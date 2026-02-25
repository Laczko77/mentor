"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { SessionCard } from "@/components/SessionCard";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Filter } from "lucide-react";
import Link from "next/link";

interface Session {
    id: string;
    title: string;
    type: string;
    start_time: string;
    end_time: string;
    duration_min: number;
    max_slots: number;
    location_note: string;
    status: string;
    booked_count: number;
}

export default function SessionsPage() {
    const { profile } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (typeFilter !== "all") params.set("type", typeFilter);
            if (statusFilter !== "all") params.set("status", statusFilter);
            const query = params.toString();
            const data = await api.get<Session[]>(
                `/sessions${query ? `?${query}` : ""}`
            );
            setSessions(data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [typeFilter, statusFilter]);

    const isMentor = profile?.role === "mentor";

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Alkalmak</h1>
                    <p className="mt-1 text-muted-foreground">
                        {isMentor
                            ? "Meghirdetett mentorálási alkalmak"
                            : "Elérhető mentorálási alkalmak"}
                    </p>
                </div>
                {isMentor && (
                    <Link href="/sessions/new">
                        <Button className="gap-2 btn-telekom">
                            <Plus className="h-4 w-4" />
                            Új alkalom
                        </Button>
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Típus" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Mind</SelectItem>
                            <SelectItem value="individual">Egyéni</SelectItem>
                            <SelectItem value="group">Csoportos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                        <SelectValue placeholder="Státusz" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Mind</SelectItem>
                        <SelectItem value="open">Nyitott</SelectItem>
                        <SelectItem value="closed">Lezárva</SelectItem>
                        <SelectItem value="cancelled">Törölve</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Sessions Grid */}
            {loading ? (
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-10 w-10 animate-spin text-primary drop-shadow-[0_0_10px_rgba(226,0,116,0.6)]" />
                        <p className="text-sm font-mono tracking-widest text-primary animate-pulse mt-4 uppercase">Betöltés...</p>
                    </div>
                </div>
            ) : sessions.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sessions.map((s) => (
                        <SessionCard key={s.id} session={s} />
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center text-muted-foreground">
                    Nincsenek alkalmak a szűrők alapján.
                </div>
            )}
        </div>
    );
}
