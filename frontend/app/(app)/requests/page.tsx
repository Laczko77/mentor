"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Calendar, Clock, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TechCard } from "@/components/ui/TechCard";
import { MagneticButton } from "@/components/ui/MagneticButton";
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
    const [adjustingRequest, setAdjustingRequest] = useState<SessionRequest | null>(null);
    const [adjustmentForm, setAdjustmentForm] = useState({ start_time: "", end_time: "" });

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
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    const fetchMentors = async () => {
        if (isMentor) return;
        try {
            const data = await api.get<MentorOption[]>("/mentors"); // Needs API endpoint
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

    const handleAction = async (id: string, status: "accepted" | "rejected", overrides?: { start_time: string, end_time: string }) => {
        setActionLoading(id);
        try {
            await api.put(`/session-requests/${id}`, {
                status,
                ...(overrides || {})
            });
            toast.success(status === "accepted" ? "Időpont elfogadva!" : "Időpont elutasítva");
            setAdjustingRequest(null);
            fetchRequests();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Hiba");
        } finally {
            setActionLoading(null);
        }
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                        {isMentor ? "Időpont Kérelmek" : "Saját Időpont Igényléseim"}
                    </motion.h1>
                    <motion.p className="mt-2 text-muted-foreground text-lg">
                        {isMentor ? "Mentroláltak által javasolt időpontok bírálata" : "Javasolj saját időpontot a mentornak"}
                    </motion.p>
                </div>

                {!isMentor && (
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <MagneticButton className="gap-2">
                                <Plus className="h-5 w-5" />
                                Új Időpont Javaslat
                            </MagneticButton>
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
                                <div className="grid grid-cols-2 gap-4">
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
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(req.proposed_start_time).toLocaleString("hu-HU")} - {new Date(req.proposed_end_time).toLocaleTimeString("hu-HU")}</span>
                                </div>

                                {isMentor && req.status === "pending" && (
                                    <div className="flex gap-2 pt-4">
                                        <Dialog open={adjustingRequest?.id === req.id} onOpenChange={(open) => {
                                            if (open) {
                                                setAdjustingRequest(req);
                                                setAdjustmentForm({
                                                    start_time: formatDateForInput(req.proposed_start_time),
                                                    end_time: formatDateForInput(req.proposed_end_time)
                                                });
                                            } else {
                                                setAdjustingRequest(null);
                                            }
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button className="flex-1 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30" disabled={actionLoading === req.id}>
                                                    <Check className="h-4 w-4 mr-2" /> Elfogad
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="glass-panel border-primary/20">
                                                <DialogHeader>
                                                    <DialogTitle>Időpont Véglegesítése</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 pt-4">
                                                    <p className="text-sm text-muted-foreground">Módosíthatod az időpontot, mielőtt elfogadod a kérést.</p>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Kezdés</Label>
                                                            <Input type="datetime-local" className="input-telekom" value={adjustmentForm.start_time} onChange={e => setAdjustmentForm({ ...adjustmentForm, start_time: e.target.value })} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Befejezés</Label>
                                                            <Input type="datetime-local" className="input-telekom" value={adjustmentForm.end_time} onChange={e => setAdjustmentForm({ ...adjustmentForm, end_time: e.target.value })} />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 mt-4">
                                                        <Button variant="outline" className="flex-1" onClick={() => setAdjustingRequest(null)}>Mégse</Button>
                                                        <Button className="flex-1 btn-telekom" onClick={() => handleAction(req.id, "accepted", adjustmentForm)} disabled={actionLoading === req.id}>
                                                            {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Elfogadás"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                        <Button className="flex-1 bg-red-500/20 text-red-500 hover:bg-red-500/30" onClick={() => handleAction(req.id, "rejected")} disabled={actionLoading === req.id}>
                                            <X className="h-4 w-4 mr-2" /> Elutasít
                                        </Button>
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
