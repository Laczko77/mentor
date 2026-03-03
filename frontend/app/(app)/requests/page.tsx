"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Calendar, Clock, Check, X, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TechCard } from "@/components/ui/TechCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

    // Grouping state
    const [expandedMentees, setExpandedMentees] = useState<Record<string, boolean>>({});

    // Inline time editing state for each request (mentor side)
    const [editedTimes, setEditedTimes] = useState<Record<string, { start_time: string; end_time: string }>>({});
    const [isEditingTime, setIsEditingTime] = useState<Record<string, boolean>>({});

    // Form
    const [form, setForm] = useState({
        mentor_id: "",
        title: "",
        proposed_start_time: "",
        proposed_end_time: ""
    });

    const isMentor = profile?.role === "mentor";

    const formatDateForInput = (isoString: string) => {
        if (!isoString) return "";
        try {
            const formattedString = isoString.includes(' ') ? isoString.replace(' ', 'T') : isoString;
            const d = new Date(formattedString);

            if (isNaN(d.getTime())) {
                return formattedString.slice(0, 16);
            }
            const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
            return localDate.toISOString().slice(0, 16);
        } catch (e) {
            console.error("Error formatting date:", e);
            return isoString.slice(0, 16);
        }
    };

    const fetchRequests = async () => {
        try {
            const data = await api.get<SessionRequest[]>("/session-requests");
            setRequests(data);
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
        } catch (err) {
            console.error("Error fetching requests:", err);
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
            const payload = {
                ...form,
                proposed_start_time: new Date(form.proposed_start_time).toISOString(),
                proposed_end_time: new Date(form.proposed_end_time).toISOString(),
            };
            await api.post("/session-requests", payload);
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
            let overrides = undefined;
            if (status === "accepted" && editedTimes[id]) {
                overrides = {
                    start_time: new Date(editedTimes[id].start_time).toISOString(),
                    end_time: new Date(editedTimes[id].end_time).toISOString(),
                };
            }

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

    const handleEditRequest = async (id: string) => {
        setActionLoading(id);
        try {
            if (!editedTimes[id]) return;
            const payload = {
                action: "update",
                start_time: new Date(editedTimes[id].start_time).toISOString(),
                end_time: new Date(editedTimes[id].end_time).toISOString(),
            };
            await api.put(`/session-requests/${id}`, payload);
            toast.success("Kérelem sikeresen módosítva!");
            fetchRequests();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Hiba a módosítás során");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteRequest = async (id: string) => {
        if (!confirm("Biztosan törlöd a kérelmet?")) return;
        setActionLoading(id);
        try {
            await api.delete(`/session-requests/${id}`);
            toast.success("Kérelem sikeresen törölve!");
            fetchRequests();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Hiba a törlés során");
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

    const toggleEditTime = (id: string) => {
        setIsEditingTime(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleMentee = (menteeId: string) => {
        setExpandedMentees(prev => ({ ...prev, [menteeId]: !prev[menteeId] }));
    };

    const groupedRequests = requests.reduce((acc, req) => {
        const menteeId = req.mentee_id || "unknown";
        if (!acc[menteeId]) {
            acc[menteeId] = { mentee: req.mentee, requests: [] };
        }
        acc[menteeId].requests.push(req);
        return acc;
    }, {} as Record<string, { mentee: { full_name: string; email: string }; requests: SessionRequest[] }>);

    const renderCardContent = (req: SessionRequest) => {
        const start = new Date(req.proposed_start_time);
        const end = new Date(req.proposed_end_time);
        const isEditing = isEditingTime[req.id];

        return (
            <CardContent className="space-y-4 px-0 pb-0 pt-4">
                <div className="flex flex-col gap-3 text-sm text-muted-foreground w-full">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">
                            {start.toLocaleDateString("hu-HU", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                weekday: "short",
                            })}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">
                            {start.toLocaleTimeString("hu-HU", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}{" "}
                            –{" "}
                            {end.toLocaleTimeString("hu-HU", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    </div>
                </div>

                {req.status === "pending" && (
                    <div className="space-y-3 pt-2">
                        {isEditing && editedTimes[req.id] ? (
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3 animate-in fade-in zoom-in-95">
                                <p className="text-xs text-muted-foreground font-medium">
                                    Új időpont javaslata:
                                </p>
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-foreground/80">Kezdés</Label>
                                        <Input
                                            type="datetime-local"
                                            className="input-telekom h-10 text-sm w-full"
                                            value={editedTimes[req.id].start_time}
                                            onChange={e => updateEditedTime(req.id, "start_time", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-foreground/80">Befejezés</Label>
                                        <Input
                                            type="datetime-local"
                                            className="input-telekom h-10 text-sm w-full"
                                            value={editedTimes[req.id].end_time}
                                            onChange={e => updateEditedTime(req.id, "end_time", e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-xs h-8"
                                    onClick={() => toggleEditTime(req.id)}
                                >
                                    Mégse
                                </Button>
                            </div>
                        ) : (
                            isMentor && (
                                <button
                                    className="text-xs text-primary/80 hover:text-primary underline underline-offset-4 transition-colors w-full text-center py-1.5"
                                    onClick={() => toggleEditTime(req.id)}
                                >
                                    Időpont módosítása elfogadás előtt
                                </button>
                            )
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/10">
                            {isMentor ? (
                                <>
                                    <Button
                                        className="w-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 shadow-none font-medium h-10"
                                        disabled={actionLoading === req.id}
                                        onClick={() => handleAction(req.id, "accepted")}
                                    >
                                        {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" /> Elfogad</>}
                                    </Button>
                                    <Button
                                        className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 shadow-none font-medium h-10"
                                        onClick={() => handleAction(req.id, "rejected")}
                                        disabled={actionLoading === req.id}
                                    >
                                        <X className="h-4 w-4 mr-2" /> Elutasít
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        className="w-full btn-telekom h-10"
                                        disabled={actionLoading === req.id}
                                        onClick={() => handleEditRequest(req.id)}
                                    >
                                        {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Mentés</>}
                                    </Button>
                                    <Button
                                        className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 shadow-none font-medium h-10"
                                        onClick={() => handleDeleteRequest(req.id)}
                                        disabled={actionLoading === req.id}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Törlés
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        );
    };

    if (loading) return (
        <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="mx-auto max-w-5xl space-y-8 z-10 relative animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 animate-in fade-in slide-in-from-left-4 duration-500">
                        {isMentor ? "Időpont Kérelmek" : "Saját Időpont Igényléseim"}
                    </h1>
                    <p className="mt-2 text-muted-foreground text-base sm:text-lg animate-in fade-in slide-in-from-left-4 duration-500 delay-150 fill-mode-both">
                        {isMentor ? "Mentoráltok által javasolt időpontok bírálata" : "Javasolj saját időpontot a mentornak. Ha az időpont nem megfelelő a mentornak, az ő elfogadása előtt módosíthatod, de számíts arra is, hogy teljesen más időpontot javasol."}
                    </p>

                    {!isMentor && (
                        <div className="mt-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 max-w-2xl animate-in fade-in slide-in-from-left-4 duration-500 delay-300">
                            <p className="text-sm text-amber-800 dark:text-amber-400 font-bold mb-2">
                                ⚠️ Jelentkezési határidők szabályzata a kérelmekre is:
                            </p>
                            <ul className="text-sm text-amber-700 dark:text-amber-500 list-disc pl-5 space-y-1">
                                <li>Kedd–Péntek eseményekre: <span className="font-semibold">előző nap 13:00-ig</span> lehet kérelmet leadni.</li>
                                <li>Szombat, Vasárnap, Hétfő eseményekre: <span className="font-semibold">péntek 13:00-ig</span> lehet kérelmet leadni.</li>
                            </ul>
                        </div>
                    )}
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
                                <DialogDescription className="sr-only">Új időpont igénylése űrlap</DialogDescription>
                            </DialogHeader>

                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-md p-3 my-2">
                                <p className="text-sm text-amber-800 dark:text-amber-400 font-medium mb-1">
                                    Figyelem: A jelentkezési határidők a saját kérelmekre is vonatkoznak!
                                </p>
                                <ul className="text-xs text-amber-700 dark:text-amber-500 list-disc pl-4 space-y-1">
                                    <li>Kedd–Péntek eseményekre: <span className="font-semibold">előző nap 13:00-ig</span></li>
                                    <li>Szombat, Vasárnap, Hétfő eseményekre: <span className="font-semibold">péntek 13:00-ig</span></li>
                                </ul>
                            </div>

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

            {requests.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground w-full">Nincsenek időpont kérelmek.</div>
            ) : isMentor ? (
                <div className="space-y-6">
                    {Object.entries(groupedRequests).map(([menteeId, group]) => {
                        const pendingCount = group.requests.filter(r => r.status === "pending").length;
                        const isExpanded = expandedMentees[menteeId];
                        return (
                            <div key={menteeId} className="space-y-4">
                                <Card
                                    className="card-telekom cursor-pointer transition-all hover:border-primary/50 group"
                                    onClick={() => toggleMentee(menteeId)}
                                >
                                    <div className="p-4 sm:p-6 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg group-hover:scale-105 transition-transform">
                                                {group.mentee?.full_name?.charAt(0) || "M"}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">{group.mentee?.full_name || "Ismeretlen mentorált"}</h3>
                                                <p className="text-sm text-muted-foreground">{group.requests.length} összes kérelem</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {pendingCount > 0 && (
                                                <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
                                                    {pendingCount} új kérelem
                                                </Badge>
                                            )}
                                            <div className="text-muted-foreground w-6 flex justify-center">
                                                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                                {isExpanded && (
                                    <div className="pl-2 sm:pl-8 space-y-4 animate-in slide-in-from-top-4 fade-in duration-300">
                                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                            {group.requests.map(req => (
                                                <TechCard key={req.id} className="group transition-all duration-300 hover:border-primary/50">
                                                    <CardHeader className="pb-3 px-0 pt-0">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <CardTitle className="text-base font-semibold leading-snug">{req.title}</CardTitle>
                                                            <Badge className={req.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : req.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}>
                                                                {req.status === 'pending' ? 'Függő' : req.status === 'accepted' ? 'Elfogadva' : 'Elutasítva'}
                                                            </Badge>
                                                        </div>
                                                    </CardHeader>
                                                    {renderCardContent(req)}
                                                </TechCard>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="mb-4 bg-primary/5">
                        <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            Aktív / Függő
                        </TabsTrigger>
                        <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            Előzmények
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {requests.filter(r => r.status === "pending").length === 0 ? (
                                <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed border-border/50 rounded-lg">Nincsenek aktív javaslataid.</div>
                            ) : (
                                requests.filter(r => r.status === "pending").map(req => (
                                    <TechCard key={req.id} className="group transition-all duration-300 hover:border-primary/50">
                                        <CardHeader className="pb-3 px-0 pt-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <CardTitle className="text-base font-semibold leading-snug">{req.title}</CardTitle>
                                                    <CardDescription className="text-xs pt-1">{req.mentor?.full_name}</CardDescription>
                                                </div>
                                                <Badge className="bg-amber-500/10 text-amber-500">
                                                    Függő
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        {renderCardContent(req)}
                                    </TechCard>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {requests.filter(r => r.status !== "pending").length === 0 ? (
                                <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed border-border/50 rounded-lg">Nincsenek előzmények.</div>
                            ) : (
                                requests.filter(r => r.status !== "pending").map(req => (
                                    <TechCard key={req.id} className="group transition-all duration-300 hover:border-primary/50">
                                        <CardHeader className="pb-3 px-0 pt-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <CardTitle className="text-base font-semibold leading-snug">{req.title}</CardTitle>
                                                    <CardDescription className="text-xs pt-1">{req.mentor?.full_name}</CardDescription>
                                                </div>
                                                <Badge className={req.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}>
                                                    {req.status === 'accepted' ? 'Elfogadva' : 'Elutasítva'}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        {renderCardContent(req)}
                                    </TechCard>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
