"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Clock,
    User,
    Info,
    ArrowRight,
    Crosshair
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    parseISO,
} from "date-fns";
import { hu } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TechCard } from "@/components/ui/TechCard";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { motion } from "framer-motion";

interface SessionEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    status: string;
    type: string;
    location_note: string;
    max_slots: number;
    booked_count: number;
    mentor_name?: string;
}

const statusColorMap: Record<string, { bg: string; border: string; text: string }> = {
    open: { bg: "bg-primary/20", border: "border-primary/40", text: "text-primary hover:text-white" },
    closed: { bg: "bg-slate-500/20", border: "border-slate-500/40", text: "text-slate-200" },
    cancelled: { bg: "bg-red-500/20", border: "border-red-500/40", text: "text-red-400" },
    work: { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-400 hover:text-white" },
    rest: { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-400 hover:text-white" },
    vacation: { bg: "bg-purple-500/20", border: "border-purple-500/40", text: "text-purple-400 hover:text-white" },
};

export default function CalendarPage() {
    const { profile } = useAuth();
    const [sessions, setSessions] = useState<SessionEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedSession, setSelectedSession] = useState<SessionEvent | null>(null);

    // Schedule Block Form State
    const [blockOpen, setBlockOpen] = useState(false);
    const [blockForm, setBlockForm] = useState({ type: "work", title: "", start_time: "", end_time: "" });

    const isMentor = profile?.role === "mentor";

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [sessionsRes, scheduleRes] = await Promise.all([
                api.get<any[]>("/sessions"),
                api.get<any[]>("/mentor-schedule" + (isMentor ? `?mentor_id=${profile.id}` : ""))
            ]);

            const events: SessionEvent[] = sessionsRes.map((s) => ({
                id: s.id,
                title: s.title,
                start: parseISO(s.start_time),
                end: parseISO(s.end_time),
                status: s.status,
                type: s.type,
                location_note: s.location_note || "",
                max_slots: s.max_slots,
                booked_count: s.booked_count || 0,
                mentor_name: s.mentor?.full_name,
            }));

            const blocks: SessionEvent[] = scheduleRes.map((b) => ({
                id: b.id,
                title: b.title || (b.type === "work" ? "Munka" : b.type === "rest" ? "Pihenő" : "Szabadság"),
                start: parseISO(b.start_time),
                end: parseISO(b.end_time),
                status: b.type,
                type: `schedule_block`,
                location_note: "Nem foglalható időszak",
                max_slots: 0,
                booked_count: 0,
                mentor_name: profile?.full_name
            }));

            setSessions([...events, ...blocks]);
        } catch (err) {
            console.error("Failed to fetch sessions", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [isMentor]);

    const handleAddBlock = async () => {
        if (!blockForm.start_time || !blockForm.end_time) return toast.error("Állítsd be az időtartamot!");
        try {
            await api.post("/mentor-schedule", blockForm);
            toast.success("Blokk sikeresen hozzáadva!");
            setBlockOpen(false);
            setBlockForm({ type: "work", title: "", start_time: "", end_time: "" });
            fetchAllData();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Hiba történt");
        }
    };

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-primary drop-shadow-[0_0_10px_rgba(226,0,116,0.6)]" />
                    <p className="text-sm font-mono tracking-widest text-primary animate-pulse mt-4 uppercase">Rendszer szinkronizálása...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-7xl animate-in fade-in space-y-8 relative z-10 w-full">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                        Útválasztó (Scheduler)
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-muted-foreground text-lg flex items-center gap-2">
                            <Crosshair className="h-5 w-5 text-primary" />
                            {isMentor
                                ? "Saját és közzétett workshopok kalibrációja"
                                : "Válogass a meghirdetett remote troubleshooting workshopok közül"}
                        </p>
                        {isMentor && (
                            <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
                                <DialogTrigger asChild>
                                    <MagneticButton className="h-8 px-4 text-xs font-bold tracking-widest uppercase">
                                        Idő Blokkolása
                                    </MagneticButton>
                                </DialogTrigger>
                                <DialogContent className="glass-panel border-primary/20 bg-black/80 backdrop-blur-3xl">
                                    <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600 mb-4">
                                        Saját Idő Szigetelése
                                    </DialogTitle>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest opacity-70">Típus</label>
                                            <select
                                                className="w-full input-telekom h-10 px-3 bg-black/40 border border-white/10 rounded-lg text-sm"
                                                value={blockForm.type}
                                                onChange={e => setBlockForm({ ...blockForm, type: e.target.value })}
                                            >
                                                <option value="work">Munka 💼</option>
                                                <option value="rest">Pihenő ☕</option>
                                                <option value="vacation">Szabadság 🌴</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest opacity-70">Megnevezés (Opcionális)</label>
                                            <input
                                                className="w-full input-telekom h-10 px-3 bg-black/40 border border-white/10 rounded-lg text-sm"
                                                value={blockForm.title}
                                                placeholder="Mivel telik?"
                                                onChange={e => setBlockForm({ ...blockForm, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs uppercase tracking-widest opacity-70">Kezdete</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full input-telekom h-10 px-3 bg-black/40 border border-white/10 rounded-lg text-xs font-mono"
                                                    value={blockForm.start_time}
                                                    onChange={e => setBlockForm({ ...blockForm, start_time: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs uppercase tracking-widest opacity-70">Vége</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full input-telekom h-10 px-3 bg-black/40 border border-white/10 rounded-lg text-xs font-mono"
                                                    value={blockForm.end_time}
                                                    onChange={e => setBlockForm({ ...blockForm, end_time: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <Button className="w-full mt-2 h-12 btn-telekom" onClick={handleAddBlock}>Mentés</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(226,0,116,0.1)] backdrop-blur-md">
                    <Button variant="ghost" size="icon" onClick={previousMonth} className="h-10 w-10 hover:bg-primary/20 rounded-xl hover:text-primary transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="px-6 min-w-[160px] text-center font-bold text-lg tracking-widest uppercase text-primary">
                        {format(currentMonth, "yyyy. MMM", { locale: hu })}
                    </div>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="h-10 w-10 hover:bg-primary/20 rounded-xl hover:text-primary transition-colors">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                    <div className="w-[1px] h-6 bg-white/20 mx-2" />
                    <Button variant="ghost" size="sm" onClick={goToToday} className="h-10 px-4 font-bold tracking-widest rounded-xl hover:bg-primary/20 hover:text-primary transition-colors uppercase">
                        MA
                    </Button>
                </div>
            </div>

            <TechCard delay={0.1} className="p-0 border-white/10 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <CardContent className="p-0">
                    {/* Grid Header (Days of week) */}
                    <div className="grid grid-cols-7 border-b border-white/5 bg-black/40 font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
                        {["Hé", "Ke", "Sze", "Csü", "Pé", "Szo", "Va"].map((day) => (
                            <div key={day} className="py-4 text-center border-r border-white/5 last:border-r-0">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Grid Body */}
                    <div className="grid grid-cols-7 bg-black/20 auto-rows-fr">
                        {days.map((day, idx) => {
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isToday = isSameDay(day, new Date());
                            const daySessions = sessions.filter((s) => isSameDay(s.start, day));

                            return (
                                <div
                                    key={day.toString()}
                                    className={cn(
                                        "min-h-[120px] sm:min-h-[160px] p-2 sm:p-3 border-r border-b border-white/5 transition-all duration-300 group relative overflow-hidden",
                                        !isCurrentMonth ? "bg-black/60 text-muted-foreground/30 grayscale" : "bg-transparent hover:bg-white/5 hover:ring-1 hover:ring-white/20 hover:z-10 cursor-crosshair",
                                        isToday && "bg-primary/10 shadow-[inset_0_0_20px_rgba(226,0,116,0.15)]"
                                    )}
                                >
                                    {/* Soft Crosshair effect on hover */}
                                    <div className="absolute top-0 left-[50%] w-[1px] h-full bg-primary/0 group-hover:bg-primary/10 transition-colors pointer-events-none z-0" />
                                    <div className="absolute left-0 top-[50%] h-[1px] w-full bg-primary/0 group-hover:bg-primary/10 transition-colors pointer-events-none z-0" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(226,0,116,0.05)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0" />

                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <span className={cn(
                                            "text-sm font-bold w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-500",
                                            isToday ? "bg-primary text-white shadow-[0_0_15px_rgba(226,0,116,0.6)]" : "text-slate-400 group-hover:text-white group-hover:bg-white/10"
                                        )}>
                                            {format(day, "d")}
                                        </span>
                                        {daySessions.length > 0 && (
                                            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(226,0,116,0.8)] animate-pulse" />
                                        )}
                                    </div>

                                    <div className="space-y-1.5 content-start overflow-hidden relative z-10">
                                        {daySessions.slice(0, 3).map((session) => (
                                            <Popover key={session.id}>
                                                <PopoverTrigger asChild>
                                                    <div
                                                        className={cn(
                                                            "px-2.5 py-1.5 rounded flex items-center gap-2 text-[11px] font-bold border cursor-pointer truncate transition-all duration-300 hover:shadow-[0_0_10px_rgba(226,0,116,0.3)] hover:-translate-y-0.5",
                                                            statusColorMap[session.status]?.bg,
                                                            statusColorMap[session.status]?.border,
                                                            statusColorMap[session.status]?.text
                                                        )}
                                                    >
                                                        <span className="opacity-70 font-mono">{format(session.start, "HH:mm")}</span>
                                                        <span className="truncate">{session.title}</span>
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-72 p-4 glass-panel shadow-[0_0_30px_rgba(226,0,116,0.15)] border-primary/30 z-50 rounded-xl">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="font-extrabold text-lg text-white leading-tight">{session.title}</h4>
                                                            <p className="text-xs text-primary font-mono mt-1 flex items-center gap-1 uppercase tracking-widest">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                {format(session.start, "HH:mm")} - {format(session.end, "HH:mm")}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs bg-black/40 rounded-lg p-2 border border-white/5">
                                                            <span className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-widest font-bold">
                                                                <User className="h-3.5 w-3.5" /> Kapacitás:
                                                            </span>
                                                            <span className="font-mono text-white text-sm">
                                                                {session.booked_count} / {session.max_slots}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            className="w-full h-10 text-xs font-bold gap-2 group/btn btn-telekom"
                                                            onClick={() => setSelectedSession(session)}
                                                        >
                                                            Kapcsolódás <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                                        </Button>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        ))}
                                        {daySessions.length > 3 && (
                                            <div className="text-[10px] font-bold text-primary/70 pl-2 tracking-wider mt-1">
                                                +{daySessions.length - 3} ADATCSOMAG
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </TechCard>

            {/* Session Detail Glass Modal */}
            <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
                <DialogContent className="sm:max-w-xl p-0 overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] glass-panel bg-black/80 rounded-2xl backdrop-blur-2xl">
                    <div className="relative h-32 bg-gradient-to-br from-primary/30 to-black overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2007433_1px,transparent_1px),linear-gradient(to_bottom,#e2007433_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_100%,transparent_100%)]"></div>
                        <div className="absolute -bottom-8 left-8">
                            <div className="h-24 w-24 rounded-2xl bg-black/80 border border-primary/40 flex items-center justify-center shadow-[0_0_20px_rgba(226,0,116,0.3)] backdrop-blur-md">
                                <Crosshair className="h-10 w-10 text-primary animate-[spin_10s_linear_infinite]" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-14 px-8 pb-8 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="space-y-3">
                                <Badge className={cn(
                                    "px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                                    selectedSession?.status === "open" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                        selectedSession?.status === "closed" ? "bg-slate-500/20 text-slate-300 border border-slate-500/30" :
                                            "bg-red-500/20 text-red-400 border border-red-500/30"
                                )}>
                                    {selectedSession?.status === "open" ? "Nyitott Port" : selectedSession?.status === "closed" ? "Lezárt Port" : "Kapcsolat megszakítva"}
                                </Badge>
                                <DialogTitle className="text-3xl font-black leading-tight text-white drop-shadow-md">
                                    {selectedSession?.title}
                                </DialogTitle>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center gap-4 hover:border-primary/30 transition-colors">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                                    <Clock className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Szinkron Időpont</p>
                                    <p className="font-mono text-sm text-white mt-0.5">
                                        {selectedSession && format(selectedSession.start, "yyyy-MM-dd HH:mm")}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center gap-4 hover:border-primary/30 transition-colors">
                                <div className="h-12 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner">
                                    <User className="h-6 w-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Sávszélesség</p>
                                    <p className="font-mono text-sm text-white mt-0.5">
                                        {selectedSession?.booked_count} / {selectedSession?.max_slots} foglalt
                                    </p>
                                </div>
                            </div>
                        </div>

                        {selectedSession?.location_note && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-[10px] text-primary font-bold uppercase tracking-widest">
                                    <Info className="h-4 w-4" />
                                    Csatlakozási Végpont (URL / Helyszín)
                                </div>
                                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm font-mono text-white shadow-inner break-all">
                                    {selectedSession.location_note}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex flex-col gap-3">
                            {!isMentor && selectedSession?.status === "open" && (
                                <Link href={`/sessions/${selectedSession.id}/book`} className="w-full">
                                    <MagneticButton className="w-full text-base tracking-widest uppercase">
                                        Hely Foglalása Most
                                    </MagneticButton>
                                </Link>
                            )}

                            {isMentor && (
                                <div className="flex gap-3">
                                    <Link href={`/sessions/${selectedSession?.id}/edit`} className="flex-1">
                                        <Button variant="secondary" className="w-full h-12 font-bold rounded-xl bg-white/10 hover:bg-white/20 uppercase tracking-widest">
                                            Újrakalibrálás
                                        </Button>
                                    </Link>
                                    <Button variant="destructive" className="flex-1 h-12 font-bold rounded-xl bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 uppercase tracking-widest">
                                        Törlés
                                    </Button>
                                </div>
                            )}

                            <Link href={`/sessions/${selectedSession?.id}`} className="w-full">
                                <Button variant="ghost" className="w-full h-12 font-bold tracking-widest uppercase text-muted-foreground hover:text-white">
                                    Részletes Adatlap Megnyitása
                                </Button>
                            </Link>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
