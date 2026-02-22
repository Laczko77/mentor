"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { HoursProgress } from "@/components/HoursProgress";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Clock, Download, Filter, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";

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
    upcoming_sessions: unknown[];
    past_sessions: {
        session_title: string;
        start_time: string;
        duration_min: number;
        mentor_note: string;
        booking_status: string;
    }[];
}

export default function HoursPage() {
    const { profile } = useAuth();
    return profile?.role === "mentor" ? <MentorHours /> : <MenteeHours />;
}

function MentorHours() {
    const [data, setData] = useState<MentorDash | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        api
            .get<MentorDash>("/dashboard/mentor")
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

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

    if (!data) return null;

    let filteredMentees = data.mentee_hours;
    if (filter === "completed") {
        filteredMentees = filteredMentees.filter((m) => m.progress_percent >= 100);
    } else if (filter === "incomplete") {
        filteredMentees = filteredMentees.filter((m) => m.progress_percent < 100);
    } else if (filter === "approaching") {
        filteredMentees = filteredMentees.filter(
            (m) => m.progress_percent >= 80 && m.progress_percent < 100
        );
    }

    const handleExportCSV = async () => {
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/export/hours-csv`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Export failed");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "mentoralt_orak.csv";
            a.click();
            URL.revokeObjectURL(url);
            toast.success("CSV exportálva!");
        } catch {
            toast.error("Hiba az exportálás során");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Óraszám áttekintés</h1>
                    <p className="mt-1 text-muted-foreground">
                        Mentoráltjaid óraszámainak részletes kimutatása
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleExportCSV}
                >
                    <Download className="h-4 w-4" />
                    CSV export
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-emerald-500">
                            {data.mentee_hours.filter((m) => m.progress_percent >= 100).length}
                        </p>
                        <p className="text-sm text-muted-foreground">Teljesítette</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10">
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-amber-500">
                            {data.mentee_hours.filter(
                                (m) => m.progress_percent >= 80 && m.progress_percent < 100
                            ).length}
                        </p>
                        <p className="text-sm text-muted-foreground">Közelít (80%+)</p>
                    </CardContent>
                </Card>
                <Card className="bg-primary/5">
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-primary">
                            {data.mentee_hours.filter((m) => m.progress_percent < 80).length}
                        </p>
                        <p className="text-sm text-muted-foreground">Folyamatban</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter + Table */}
            <Card className="card-telekom">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Részletes kimutatás
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Összes</SelectItem>
                                <SelectItem value="completed">Teljesített</SelectItem>
                                <SelectItem value="incomplete">Nem teljesített</SelectItem>
                                <SelectItem value="approaching">Közelítő (80%+)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Név</TableHead>
                                <TableHead>Belépés</TableHead>
                                <TableHead className="text-center">Kötelező</TableHead>
                                <TableHead className="text-center">Teljesítve</TableHead>
                                <TableHead className="text-center">Maradék</TableHead>
                                <TableHead className="w-[200px]">Haladás</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMentees.map((m) => (
                                <TableRow key={m.mentee_id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{m.full_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {m.email}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {new Date(m.joined_at).toLocaleDateString("hu-HU")}
                                    </TableCell>
                                    <TableCell className="text-center font-medium">
                                        {m.required_hours}h
                                    </TableCell>
                                    <TableCell className="text-center font-medium">
                                        {m.completed_hours.toFixed(1)}h
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {m.remaining_hours > 0 ? (
                                            <span className="text-amber-500">
                                                {m.remaining_hours.toFixed(1)}h
                                            </span>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="bg-emerald-500/10 text-emerald-600"
                                            >
                                                ✓
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <HoursProgress
                                            completed={m.completed_hours}
                                            required={m.required_hours}
                                            size="sm"
                                            showLabel={false}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {filteredMentees.length === 0 && (
                        <p className="py-8 text-center text-muted-foreground">
                            Nincs mentorált a szűrők alapján
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function MenteeHours() {
    const [data, setData] = useState<MenteeDash | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api
            .get<MenteeDash>("/dashboard/mentee")
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

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

    if (!data) return null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Óraszámom</h1>
                <p className="mt-1 text-muted-foreground">
                    Saját mentorálási óráim áttekintése
                </p>
            </div>

            {/* Balance Card */}
            <Card className="bg-primary/5">
                <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-4xl font-bold text-primary">
                                {data.completed_hours.toFixed(1)}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">Teljesítve</p>
                        </div>
                        <div>
                            <p className="text-4xl font-bold">{data.required_hours}</p>
                            <p className="mt-1 text-sm text-muted-foreground">Kötelező</p>
                        </div>
                        <div>
                            <p className="text-4xl font-bold text-amber-500">
                                {data.remaining_hours.toFixed(1)}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">Maradék</p>
                        </div>
                    </div>
                    <HoursProgress
                        completed={data.completed_hours}
                        required={data.required_hours}
                        size="lg"
                    />
                </CardContent>
            </Card>

            {/* Past Sessions */}
            <Card className="card-telekom">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        Korábbi foglalásaim
                    </CardTitle>
                    <CardDescription>
                        Elfogadott és lezárt mentorálási alkalmak
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {data.past_sessions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Session</TableHead>
                                    <TableHead>Dátum</TableHead>
                                    <TableHead className="text-center">Időtartam</TableHead>
                                    <TableHead>Mentor megjegyzés</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.past_sessions.map((s, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">
                                            {s.session_title}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(s.start_time).toLocaleDateString("hu-HU")}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {s.duration_min} perc
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                                            {s.mentor_note || "–"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="py-8 text-center text-muted-foreground">
                            Még nincsenek lezárt foglalásaid
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
