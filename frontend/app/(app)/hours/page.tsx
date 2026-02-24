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
import { Clock, Download, Filter, Loader2, TrendingUp, Pencil, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";

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
    monthly_quota: number;
    used_hours: number;
    remaining_quota: number;
    quota_usage_percent: number;
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
    const [quotaOpen, setQuotaOpen] = useState(false);
    const [newQuota, setNewQuota] = useState("");
    const [quotaLoading, setQuotaLoading] = useState(false);

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
                    <p className="text-sm font-mono tracking-widest text-primary animate-pulse mt-4 uppercase">Betöltés...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const handleUpdateQuota = async () => {
        const val = parseFloat(newQuota);
        if (isNaN(val) || val < 0) return toast.error("Érvényes számot adj meg!");
        setQuotaLoading(true);
        try {
            await api.put("/profiles/quota", { monthly_hour_quota: val });
            toast.success("Órakeret frissítve!");
            setQuotaOpen(false);
            // Refetch data
            const fresh = await api.get<MentorDash>("/dashboard/mentor");
            setData(fresh);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Hiba");
        } finally {
            setQuotaLoading(false);
        }
    };

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

    const currentMonth = new Date().toLocaleString("hu-HU", { month: "long", year: "numeric" });
    const quotaPercent = data.quota_usage_percent || 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Óraszám áttekintés</h1>
                    <p className="mt-1 text-muted-foreground text-sm sm:text-base">
                        {currentMonth} – havi kimutatás
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="gap-2 shrink-0"
                    onClick={handleExportCSV}
                >
                    <Download className="h-4 w-4" />
                    CSV export
                </Button>
            </div>

            {/* Mentor Quota Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Gauge className="h-5 w-5 text-primary" />
                        Havi Órakeret
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => { setNewQuota(data.monthly_quota.toString()); setQuotaOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                        Módosítás
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl sm:text-3xl font-bold text-primary">{data.used_hours}</p>
                            <p className="text-xs text-muted-foreground mt-1">Felhasznált</p>
                        </div>
                        <div>
                            <p className="text-2xl sm:text-3xl font-bold">{data.monthly_quota}</p>
                            <p className="text-xs text-muted-foreground mt-1">Keret (óra)</p>
                        </div>
                        <div>
                            <p className={`text-2xl sm:text-3xl font-bold ${data.remaining_quota < 10 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {data.remaining_quota}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Maradék</p>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Progress value={quotaPercent} className="h-3" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="font-semibold">{quotaPercent}% felhasználva</span>
                            {data.remaining_quota < 10 && (
                                <span className="text-amber-500 font-semibold">⚠️ Alacsony keret!</span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
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
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                    <div className="overflow-x-auto -mx-6">
                        <div className="min-w-[600px] px-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Név</TableHead>
                                        <TableHead className="hidden sm:table-cell">Belépés</TableHead>
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
                                            <TableCell className="text-sm hidden sm:table-cell">
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
                        </div>
                    </div>
                    {filteredMentees.length === 0 && (
                        <p className="py-8 text-center text-muted-foreground">
                            Nincs mentorált a szűrők alapján
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Quota Edit Dialog */}
            <Dialog open={quotaOpen} onOpenChange={setQuotaOpen}>
                <DialogContent className="glass-panel border-primary/20">
                    <DialogHeader>
                        <DialogTitle>Havi Órakeret Módosítása</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground">
                            Add meg a havi mentorálási órakeretét. Ez az érték határozza meg, hogy maximum hány órát tudsz az adott hónapban mentorlásra fordítani.
                        </p>
                        <div className="space-y-2">
                            <Label>Új órakeret (óra)</Label>
                            <Input
                                type="number"
                                className="input-telekom"
                                value={newQuota}
                                onChange={e => setNewQuota(e.target.value)}
                                placeholder="54"
                                min="0"
                            />
                        </div>
                        <Button className="w-full btn-telekom" onClick={handleUpdateQuota} disabled={quotaLoading}>
                            {quotaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mentés"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
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
                    <p className="text-sm font-mono tracking-widest text-primary animate-pulse mt-4 uppercase">Betöltés...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const currentMonth = new Date().toLocaleString("hu-HU", { month: "long", year: "numeric" });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Óraszámom</h1>
                <p className="mt-1 text-muted-foreground text-sm sm:text-base">
                    {currentMonth} – saját mentorálási órák
                </p>
            </div>

            {/* Balance Card */}
            <Card className="bg-primary/5">
                <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl sm:text-4xl font-bold text-primary">
                                {data.completed_hours.toFixed(1)}
                            </p>
                            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Teljesítve</p>
                        </div>
                        <div>
                            <p className="text-2xl sm:text-4xl font-bold">{data.required_hours}</p>
                            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Kötelező</p>
                        </div>
                        <div>
                            <p className="text-2xl sm:text-4xl font-bold text-amber-500">
                                {data.remaining_hours.toFixed(1)}
                            </p>
                            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Maradék</p>
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
                        <div className="overflow-x-auto -mx-6">
                            <div className="min-w-[500px] px-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Alkalom</TableHead>
                                            <TableHead>Dátum</TableHead>
                                            <TableHead className="text-center">Időtartam</TableHead>
                                            <TableHead className="hidden sm:table-cell">Mentor megjegyzés</TableHead>
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
                                                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground hidden sm:table-cell">
                                                    {s.mentor_note || "–"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
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
