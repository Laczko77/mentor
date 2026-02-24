"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Calendar, Clock, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TechCard } from "@/components/ui/TechCard";

import { motion } from "framer-motion";

interface SessionRequest {
    id: string;
    mentee_id: string;
    mentor_id: string;
    title: string;
    proposed_start_time: string;
    proposed_end_time: string;
    status: string;
    created_at: string;
    mentee: { full_name: string; email: string };
    mentor: { full_name: string; email: string };
}

interface MentorOption {
    id: string;
    full_name: string;
}

export default function RequestsPage() {
    const { profile } = useAuth();
    const [requests, setRequests] = useState<SessionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [mentors, setMentors] = useState<MentorOption[]>([]);
    const [createOpen, setCreateOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Inline time editing state for each request (mentor side)
    const [editedTimes, setEditedTimes] = useState<Record<string, { start_time: string; end_time: string }>>({});

    // Form
    const [form, setForm] = useState({
        mentor_id: "",
        title: "",
        proposed_start_time: "",
        proposed_end_time: ""
    });

    const isMentor = profile?.role === "mentor";

    const fetchRequests = async () => {
        try {
            const data = await api.get<SessionRequest[]>("/session-requests");
            setRequests(data);
            // Initialize editable times for pending requests
            const times: Record<string, { start_time: string; end_time: string }> = {};
            data.forEach(req => {
                if (req.status === "pending") {
                    times[req.id] = {
                        start_time: formatDateForInput(req.proposed_start_time),
                        end_time: formatDateForInput(req.proposed_end_time),
                    };
                }
            });
            setEditedTimes(times);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    const fetchMentors = async () => {
        if (isMentor) return;
        try {
            const data = await api.get<MentorOption[]>("/mentors");
            setMentors(data);
        } catch {
            // silent
        }
    };

    useEffect(() => {
        fetchRequests();
        fetchMentors();
    }, [isMentor]);

    const handleCreate = async () => {
        if (!form.mentor_id || !form.title || !form.proposed_start_time || !form.proposed_end_time) {
            return toast.error("Minden mező kötelező!");
        }
        try {
            await api.post("/session-requests", form);
            toast.success("Kérés sikeresen elküldve!");
            setCreateOpen(false);
            setForm({ mentor_id: "", title: "", proposed_start_time: "", proposed_end_time: "" });
            fetchRequests();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Hiba");
        }
    };

    const handleAction = async (id: string, status: "accepted" | "rejected") => {
        setActionLoading(id);
        try {
            const overrides = status === "accepted" && editedTimes[id]
                ? { start_time: editedTimes[id].start_time, end_time: editedTimes[id].end_time }
                : undefined;

            await api.put(`/session-requests/${id}`, {
                status,
                ...(overrides || {})
            });
            toast.success(status === "accepted" ? "Időpont elfogadva!" : "Időpont elutasítva");
            fetchRequests();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Hiba");
        } finally {
            setActionLoading(null);
        }
    };

    const updateEditedTime = (reqId: string, field: "start_time" | "end_time", value: string) => {
        setEditedTimes(prev => ({
            ...prev,
            [reqId]: { ...prev[reqId], [field]: value }
        }));
    };

    if (loading) return (
        <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );

    const formatDateForInput = (isoString: string) => {
        return isoString.slice(0, 16);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-5xl space-y-8 z-10 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
                <div>
                    <motion.h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                        {isMentor ? "Időpont Kérelmek" : "Saját Időpont Igényléseim"}
                    </motion.h1>
                    <motion.p className="mt-2 text-muted-foreground text-base sm:text-lg">
                        {isMentor ? "Mentoráltok által javasolt időpontok bírálata" : "Javasolj saját időpontot a mentornak"}
                    </motion.p>
                </div>

                {!isMentor && (
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 btn-telekom">
                                <Plus className="h-5 w-5" />
                                Új Időpont Javaslat
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-panel border-primary/20">
                            <DialogHeader>
                                <DialogTitle>Időpont Igénylése</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Mentor</Label>
                                    <Select value={form.mentor_id} onValueChange={(v) => setForm({ ...form, mentor_id: v })}>
                                        <SelectTrigger className="input-telekom"><SelectValue placeholder="Válassz mentort" /></SelectTrigger>
                                        <SelectContent>
                                            {mentors.map(m => (
                                                <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Téma / Cím</Label>
                                    <Input className="input-telekom" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="pl. Kód review" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Kezdés</Label>
                                        <Input type="datetime-local" className="input-telekom" value={form.proposed_start_time} onChange={e => setForm({ ...form, proposed_start_time: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Befejezés</Label>
                                        <Input type="datetime-local" className="input-telekom" value={form.proposed_end_time} onChange={e => setForm({ ...form, proposed_end_time: e.target.value })} />
                                    </div>
                                </div>
                                <Button className="w-full btn-telekom mt-4" onClick={handleCreate}>Javaslat elküldése</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {requests.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground">Nincsenek időpont kérelmek.</div>
                ) : (
                    requests.map(req => (
                        <TechCard key={req.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{req.title}</CardTitle>
                                        <CardDescription>{isMentor ? req.mentee?.full_name : req.mentor?.full_name}</CardDescription>
                                    </div>
                                    <Badge className={req.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : req.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}>
                                        {req.status === 'pending' ? 'Függő' : req.status === 'accepted' ? 'Elfogadva' : 'Elutasítva'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* For non-pending or mentee view: show read-only time */}
                                {(!isMentor || req.status !== "pending") && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>{new Date(req.proposed_start_time).toLocaleString("hu-HU")} - {new Date(req.proposed_end_time).toLocaleTimeString("hu-HU")}</span>
                                    </div>
                                )}

                                {/* For mentor + pending: inline editable time fields + action buttons */}
                                {isMentor && req.status === "pending" && editedTimes[req.id] && (
                                    <div className="space-y-4">
                                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                Módosíthatod az időpontot elfogadás előtt
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Kezdés</Label>
                                                    <Input
                                                        type="datetime-local"
                                                        className="input-telekom h-9 text-sm"
                                                        value={editedTimes[req.id].start_time}
                                                        onChange={e => updateEditedTime(req.id, "start_time", e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Befejezés</Label>
                                                    <Input
                                                        type="datetime-local"
                                                        className="input-telekom h-9 text-sm"
                                                        value={editedTimes[req.id].end_time}
                                                        onChange={e => updateEditedTime(req.id, "end_time", e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                className="flex-1 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30"
                                                disabled={actionLoading === req.id}
                                                onClick={() => handleAction(req.id, "accepted")}
                                            >
                                                {actionLoading === req.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Check className="h-4 w-4 mr-2" /> Elfogadás
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                className="flex-1 bg-red-500/20 text-red-500 hover:bg-red-500/30"
                                                onClick={() => handleAction(req.id, "rejected")}
                                                disabled={actionLoading === req.id}
                                            >
                                                <X className="h-4 w-4 mr-2" /> Elutasítás
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </TechCard>
                    ))
                )}
            </div>
        </motion.div>
    );
}
