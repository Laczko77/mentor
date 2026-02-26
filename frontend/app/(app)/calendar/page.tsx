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
    Crosshair,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
    shift: { bg: "bg-cyan-500/20", border: "border-cyan-500/40", text: "text-cyan-400 hover:text-white" },
};

export default function CalendarPage() {
    const { profile } = useAuth();
    const [sessions, setSessions] = useState<SessionEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    // Schedule Block Form State
    const [blockOpen, setBlockOpen] = useState(false);
    const [blockForm, setBlockForm] = useState({ type: "shift", title: "", start_time: "", end_time: "" });

    const isMentor = profile?.role === "mentor";

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [sessionsRes, scheduleRes] = await Promise.all([
                api.get<any[]>("/sessions?include_past=true"),
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
                title: b.title || (b.type === "work" ? "Munka" : b.type === "rest" ? "Pihenő" : b.type === "shift" ? "Műszak" : "Szabadság"),
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
        } catch {
            // silent
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
            const payload = {
                ...blockForm,
                start_time: new Date(blockForm.start_time).toISOString(),
                end_time: new Date(blockForm.end_time).toISOString()
            };
            await api.post("/mentor-schedule", payload);
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
                    <p className="text-sm font-mono tracking-widest text-primary animate-pulse mt-4 uppercase">Betöltés...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl animate-in fade-in space-y-8 relative z-10 w-full duration-500">
            {/* Header Area */}
            <div className="flex flex-col gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                        Naptár
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                        <p className="text-muted-foreground text-sm sm:text-lg flex items-center gap-2">
                            <Crosshair className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            {isMentor
                                ? "Saját beosztás és foglalkozások kezelése"
                                : "Elérhető mentorálási alkalmak áttekintése"}
                        </p>
                        {isMentor && (
                            <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2 btn-telekom h-8 px-4 text-xs font-bold tracking-widest uppercase">
                                        Műszak Hozzáadása
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="glass-panel border-primary/20 bg-black/80 backdrop-blur-3xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-4">
                                            Műszak Rögzítése
                                        </DialogTitle>
                                        <DialogDescription className="sr-only">
                                            Új műszak hozzáadása a naptárhoz
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest opacity-70">Megnevezés (Opcionális)</label>
                                            <input
                                                className="w-full h-10 px-3 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                                                value={blockForm.title}
                                                placeholder="Pl. délelőtti műszak"
                                                onChange={e => setBlockForm({ ...blockForm, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs uppercase tracking-widest opacity-70">Kezdete</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full h-10 px-3 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-primary/50"
                                                    value={blockForm.start_time}
                                                    onChange={e => setBlockForm({ ...blockForm, start_time: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs uppercase tracking-widest opacity-70">Vége</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full h-10 px-3 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-primary/50"
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

                <div className="flex items-center gap-2 bg-black/40 p-1.5 sm:p-2 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(226,0,116,0.1)] backdrop-blur-md">
                    <Button variant="ghost" size="icon" onClick={previousMonth} className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-primary/20 rounded-xl hover:text-primary transition-colors">
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <div className="px-3 sm:px-6 min-w-[120px] sm:min-w-[160px] text-center font-bold text-sm sm:text-lg tracking-widest uppercase text-primary">
                        {format(currentMonth, "yyyy. MMM", { locale: hu })}
                    </div>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-primary/20 rounded-xl hover:text-primary transition-colors">
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <div className="w-[1px] h-5 sm:h-6 bg-white/20 mx-1 sm:mx-2" />
                    <Button variant="ghost" size="sm" onClick={goToToday} className="h-8 sm:h-10 px-2 sm:px-4 font-bold tracking-widest rounded-xl hover:bg-primary/20 hover:text-primary transition-colors uppercase text-xs sm:text-sm">
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
                                    onClick={() => setSelectedDay(day)}
                                    className={cn(
                                        "min-h-[60px] sm:min-h-[120px] md:min-h-[160px] p-1 sm:p-2 md:p-3 border-r border-b border-white/5 transition-all duration-300 group relative overflow-hidden cursor-pointer",
                                        !isCurrentMonth ? "bg-black/60 text-muted-foreground/30 grayscale" : "bg-transparent hover:bg-white/5 hover:ring-1 hover:ring-white/20 hover:z-10",
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
                                            <div
                                                key={session.id}
                                                className={cn(
                                                    "px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded flex items-center gap-1 sm:gap-2 text-[10px] sm:text-[11px] font-bold border truncate transition-all duration-300",
                                                    statusColorMap[session.status]?.bg,
                                                    statusColorMap[session.status]?.border,
                                                    statusColorMap[session.status]?.text
                                                )}
                                            >
                                                <span className="opacity-70 font-mono hidden sm:inline">{format(session.start, "HH:mm")}</span>
                                                <span className="truncate">{session.title}</span>
                                            </div>
                                        ))}
                                        {daySessions.length > 3 && (
                                            <div className="text-[9px] sm:text-[10px] font-bold text-primary/70 pl-2 tracking-wider mt-1 uppercase">
                                                +{daySessions.length - 3} további
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </TechCard>

            {/* Day View Modal */}
            <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] glass-panel bg-black/80 rounded-2xl backdrop-blur-2xl">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                            Események - {selectedDay ? format(selectedDay, "yyyy. MMMM d.", { locale: hu }) : ""}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Napi események listája</DialogDescription>
                    </DialogHeader>
                    <div className="p-4 sm:p-6 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {selectedDay && sessions.filter(s => isSameDay(s.start, selectedDay)).length > 0 ? (
                            sessions.filter(s => isSameDay(s.start, selectedDay))
                                .sort((a, b) => a.start.getTime() - b.start.getTime())
                                .map(session => (
                                    <div key={session.id} className={cn(
                                        "p-4 rounded-xl border bg-black/40 relative overflow-hidden group transition-all",
                                        statusColorMap[session.status]?.border || "border-white/10",
                                        statusColorMap[session.status]?.bg || "bg-black/40"
                                    )}>
                                        <div className="flex justify-between items-start gap-4 mb-3">
                                            <h4 className={cn(
                                                "font-bold leading-tight",
                                                statusColorMap[session.status]?.text || "text-white"
                                            )}>
                                                {session.title}
                                            </h4>
                                            <Badge className={cn(
                                                "px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)] border",
                                                session.status === "open" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                                                    session.status === "closed" ? "bg-slate-500/20 text-slate-300 border-slate-500/30" :
                                                        session.status === "cancelled" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                                            session.type === "schedule_block" ? "bg-primary/20 text-primary border-primary/30" :
                                                                "bg-white/10 text-white/70 border-white/20"
                                            )}>
                                                {session.status === "open" ? "Nyitott" :
                                                    session.status === "closed" ? "Lezárt / Megtartott" :
                                                        session.status === "cancelled" ? "Lemondva" :
                                                            session.type === "schedule_block" ? "Műszak" : session.status}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mt-1 bg-black/40 p-3 rounded-lg border border-white/5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                    <Clock className="h-3 w-3 text-primary" /> Időpont
                                                </div>
                                                <span className="font-mono text-sm text-white/90">
                                                    {format(session.start, "HH:mm")} - {format(session.end, "HH:mm")}
                                                </span>
                                            </div>
                                            {session.max_slots > 0 && (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                        <User className="h-3 w-3 text-emerald-400" /> Kapacitás
                                                    </div>
                                                    <span className="font-mono text-sm text-white/90">
                                                        {session.booked_count} / {session.max_slots} foglalt
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {session.type !== "schedule_block" && session.mentor_name && (
                                            <div className="mt-3 text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded inline-block border border-white/10">
                                                <span className="uppercase tracking-wider text-[10px] font-bold mr-1 opacity-70">Oktató:</span>
                                                <span className="text-white/90 font-medium">{session.mentor_name}</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                        ) : (
                            <div className="text-center py-10 flex flex-col items-center gap-3 bg-black/40 rounded-xl border border-white/10">
                                <CalendarIcon className="h-8 w-8 text-white/20" />
                                <span className="text-muted-foreground/60 text-sm font-medium tracking-wide">
                                    Nincsenek események vagy műszakok ezen a napon.
                                </span>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
