"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoursProgress } from "@/components/HoursProgress";
import {
    Clock,
    Users,
    Calendar,
    AlertCircle,
    TrendingUp,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { TechCard } from "@/components/ui/TechCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface MenteeHours {
    mentee_id: string;
    full_name: string;
    email: string;
    joined_at: string;
    required_hours: number;
    completed_hours: number;
    remaining_hours: number;
    progress_percent: number;
}

interface MentorDash {
    total_mentees: number;
    pending_bookings: number;
    upcoming_sessions: number;
    mentee_hours: MenteeHours[];
}

interface MenteeDash {
    required_hours: number;
    completed_hours: number;
    remaining_hours: number;
    progress_percent: number;
    upcoming_sessions: { session_title: string; start_time: string; booking_status: string }[];
    past_sessions: { session_title: string; start_time: string; duration_min: number }[];
}



export default function DashboardPage() {
    const { profile } = useAuth();
    const isMentor = profile?.role === "mentor";

    return isMentor ? <MentorDashboard /> : <MenteeDashboard />;
}

function MentorDashboard() {
    const { profile } = useAuth();
    const [data, setData] = useState<MentorDash | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) return;
        api
            .get<MentorDash>("/dashboard/mentor")
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [profile]);

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

    if (!data) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 z-10 relative">
            <div>
                <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                    Vezérlőpult
                </motion.h1>
                <motion.p initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="mt-2 text-muted-foreground text-lg">
                    Mentor áttekintés és mentoráltak haladása
                </motion.p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <TechCard delay={0.1}>
                    <CardContent className="flex items-center gap-4 pt-6">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(226,0,116,0.15)]">
                            <Users className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <p className="text-3xl font-black">{data.total_mentees}</p>
                            <p className="text-sm tracking-wide text-muted-foreground uppercase pt-1">Mentoráltak</p>
                        </div>
                    </CardContent>
                </TechCard>

                <TechCard delay={0.2} className={data.pending_bookings > 0 ? "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]" : ""}>
                    <CardContent className="flex items-center gap-4 pt-6">
                        <div
                            className={`flex h-14 w-14 items-center justify-center rounded-xl border ${data.pending_bookings > 0
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                                }`}
                        >
                            <AlertCircle className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-3xl font-black">{data.pending_bookings}</p>
                            <p className="text-sm tracking-wide text-muted-foreground uppercase pt-1">
                                Függő foglalás
                            </p>
                        </div>
                    </CardContent>
                </TechCard>

                <TechCard delay={0.3}>
                    <CardContent className="flex items-center gap-4 pt-6">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(226,0,116,0.15)]">
                            <Calendar className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <p className="text-3xl font-black">{data.upcoming_sessions}</p>
                            <p className="text-sm tracking-wide text-muted-foreground uppercase pt-1">
                                Közelgő alkalom
                            </p>
                        </div>
                    </CardContent>
                </TechCard>
            </div>

            {/* Mentee Hours Overview */}
            <TechCard delay={0.4}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <TrendingUp className="h-6 w-6 text-primary" />
                            Mentoráltak Óraszámai
                        </CardTitle>
                        <CardDescription>
                            Mentoráltak haladási mutatói
                        </CardDescription>
                    </div>
                    <Link href="/hours">
                        <Button variant="outline" className="px-4 py-2 mt-4 sm:mt-0">
                            Részletes elemzés
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent className="space-y-6">
                    {data.mentee_hours.map((m) => (
                        <div key={m.mentee_id} className="space-y-3 p-4 rounded-lg bg-background/30 border border-white/5 hover:border-primary/30 transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-lg">{m.full_name}</p>
                                    <p className="text-xs text-muted-foreground tracking-wider">{m.email}</p>
                                </div>
                                <Badge
                                    className="badge-telekom px-3 py-1 text-sm shadow-[0_0_10px_rgba(226,0,116,0.2)]"
                                >
                                    {m.progress_percent.toFixed(0)}% KÉSZ
                                </Badge>
                            </div>
                            <HoursProgress
                                completed={m.completed_hours}
                                required={m.required_hours}
                                size="sm"
                            />
                        </div>
                    ))}
                    {data.mentee_hours.length === 0 && (
                        <p className="text-center text-muted-foreground py-10 italic">
                            Még nincsenek mentoráltjaid. Adj hozzá mentoráltakat a Kezelés menüben.
                        </p>
                    )}
                </CardContent>
            </TechCard>
        </motion.div>
    );
}

function MenteeDashboard() {
    const { profile } = useAuth();
    const [data, setData] = useState<MenteeDash | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) return;
        api
            .get<MenteeDash>("/dashboard/mentee")
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [profile]);

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

    if (!data) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 z-10 relative">
            <div>
                <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                    Saját Központ
                </motion.h1>
                <motion.p initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="mt-2 text-muted-foreground text-lg">
                    Aktuális státusz és fejlesztési terv
                </motion.p>
            </div>

            {/* Hours Balance Card */}
            <TechCard delay={0.1}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <Clock className="h-6 w-6 text-primary" />
                        Óraegyenleg
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-3 gap-6 text-center">
                        <div className="p-4 rounded-xl bg-background/50 border border-border/50 shadow-inner">
                            <p className="text-4xl font-black text-primary drop-shadow-[0_0_8px_rgba(226,0,116,0.3)]">
                                {data.completed_hours.toFixed(1)}
                            </p>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-2">Teljesítve</p>
                        </div>
                        <div className="p-4 rounded-xl bg-background/50 border border-border/50 shadow-inner">
                            <p className="text-4xl font-black">{data.required_hours}</p>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-2">Cél</p>
                        </div>
                        <div className="p-4 rounded-xl bg-background/50 border border-border/50 shadow-inner">
                            <p className="text-4xl font-black text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                                {data.remaining_hours.toFixed(1)}
                            </p>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-2">Hátralévő</p>
                        </div>
                    </div>
                    <div className="pt-4">
                        <HoursProgress
                            completed={data.completed_hours}
                            required={data.required_hours}
                            size="lg"
                        />
                    </div>
                </CardContent>
            </TechCard>

            {/* Upcoming Sessions */}
            <div className="pt-4">
                <h2 className="mb-6 text-2xl font-bold flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-primary" />
                    Közelgő Alkalmak
                </h2>
                {data.upcoming_sessions.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2">
                        {data.upcoming_sessions.map((s, i) => (
                            <TechCard key={i} delay={0.2 + i * 0.1}>
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="font-bold text-lg">{s.session_title}</p>
                                            <p className="text-sm text-muted-foreground tracking-wide font-mono">
                                                {new Date(s.start_time).toLocaleString("hu-HU")}
                                            </p>
                                        </div>
                                        <Badge
                                            className={`px-3 py-1 ${s.booking_status === 'accepted' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 'bg-amber-500/20 text-amber-500 border-amber-500/30'}`}
                                            variant="outline"
                                        >
                                            {s.booking_status === "accepted"
                                                ? "Elfogadva"
                                                : "Függőben"}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </TechCard>
                        ))}
                    </div>
                ) : (
                    <TechCard delay={0.2}>
                        <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                            <p className="text-lg">Nincs közelgő mentorálási alkalom.</p>
                            <Link href="/sessions">
                                <Button className="btn-telekom">
                                    Alkalom keresése
                                </Button>
                            </Link>
                        </CardContent>
                    </TechCard>
                )}
            </div>
        </motion.div>
    );
}
