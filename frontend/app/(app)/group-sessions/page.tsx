"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, Clock, Trash2, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Vote {
    id: string;
    mentor_id: string;
    mentee_id: string;
    preferred_days: string[];
    preferred_times: string[];
    preferred_durations: string[];
    created_at: string;
    mentee?: { full_name: string };
}

const PREFERRED_DAYS = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];
const PREFERRED_TIMES = ["Délelőtt (08:00 - 12:00)", "Délután (12:00 - 18:00)", "Este (18:00 - 22:00)"];
const PREFERRED_DURATIONS = ["1 óra", "1.5 óra", "2 óra"];

export default function GroupSessionsPage() {
    const { profile } = useAuth();
    const isMentor = profile?.role === "mentor";

    // For mentors:
    const [votes, setVotes] = useState<Vote[]>([]);

    // For mentees:
    const [myVote, setMyVote] = useState<{
        preferred_days: string[];
        preferred_times: string[];
        preferred_durations: string[];
    }>({
        preferred_days: [],
        preferred_times: [],
        preferred_durations: []
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchVotes = async () => {
        try {
            if (isMentor) {
                const data = await api.get<Vote[]>("/group-session-votes");
                setVotes(data || []);
            } else {
                const data = await api.get<Vote | null>("/group-session-votes");
                if (data) {
                    setMyVote({
                        preferred_days: data.preferred_days || [],
                        preferred_times: data.preferred_times || [],
                        preferred_durations: data.preferred_durations || []
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching votes:", err);
            toast.error("Hiba a szavazatok betöltésekor");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch when role is loaded
        if (profile?.role) {
            fetchVotes();
        }
    }, [profile?.role]);

    const handleSaveMyVote = async () => {
        setSaving(true);
        try {
            await api.post("/group-session-votes", myVote);
            toast.success("Szavazat sikeresen elmentve!");
        } catch (err: any) {
            toast.error(err.message || "Hiba a mentés során");
        } finally {
            setSaving(false);
        }
    };

    const handleClearVotes = async () => {
        if (!confirm("Biztosan törölni szeretnéd az összes eddigi szavazatot? Ez indít egy új szavazást.")) return;
        setDeleting(true);
        try {
            await api.delete("/group-session-votes");
            toast.success("Szavazatok törölve. Új szavazás indult.");
            setVotes([]);
        } catch (err: any) {
            toast.error(err.message || "Hiba a törlés során");
        } finally {
            setDeleting(false);
        }
    };

    const toggleArrayItem = (array: string[], item: string, setter: (newArr: string[]) => void) => {
        if (array.includes(item)) {
            setter(array.filter(i => i !== item));
        } else {
            setter([...array, item]);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (isMentor) {
        // Compute statistics for mentors
        const statsDays: Record<string, number> = {};
        const statsTimes: Record<string, number> = {};
        const statsDurations: Record<string, number> = {};

        votes.forEach(v => {
            v.preferred_days.forEach(d => { statsDays[d] = (statsDays[d] || 0) + 1; });
            v.preferred_times.forEach(t => { statsTimes[t] = (statsTimes[t] || 0) + 1; });
            v.preferred_durations.forEach(dur => { statsDurations[dur] = (statsDurations[dur] || 0) + 1; });
        });

        const sortStats = (obj: Record<string, number>) => Object.entries(obj).sort((a, b) => b[1] - a[1]);

        return (
            <div className="mx-auto max-w-5xl space-y-8 z-10 relative animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                            Csoportos Foglalkozás Szavazás
                        </h1>
                        <p className="mt-2 text-muted-foreground text-base sm:text-lg">
                            Lásd a mentoráltjaid preferenciáit a következő csoportos foglalkozáshoz.
                        </p>
                    </div>
                    {votes.length > 0 && (
                        <Button
                            variant="destructive"
                            className="gap-2"
                            onClick={handleClearVotes}
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Szavazatok Törlése (Újraindítás)
                        </Button>
                    )}
                </div>

                {votes.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground w-full">Még nem érkezett szavazat.</div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="card-telekom border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    Legnépszerűbb Napok
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {sortStats(statsDays).map(([day, count]) => (
                                    <div key={day} className="flex justify-between items-center bg-primary/5 p-3 rounded-lg border border-primary/10">
                                        <span className="font-medium text-foreground">{day}</span>
                                        <div className="bg-primary text-primary-foreground text-sm font-bold h-6 w-6 flex items-center justify-center rounded-full">
                                            {count}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="card-telekom border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    Napszakok
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {sortStats(statsTimes).map(([time, count]) => (
                                    <div key={time} className="flex justify-between items-center bg-primary/5 p-3 rounded-lg border border-primary/10">
                                        <span className="font-medium text-foreground text-sm">{time.split(" ")[0]}</span>
                                        <div className="bg-primary text-primary-foreground text-sm font-bold h-6 w-6 flex items-center justify-center rounded-full">
                                            {count}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="card-telekom border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Időtartamok
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {sortStats(statsDurations).map(([dur, count]) => (
                                    <div key={dur} className="flex justify-between items-center bg-primary/5 p-3 rounded-lg border border-primary/10">
                                        <span className="font-medium text-foreground">{dur}</span>
                                        <div className="bg-primary text-primary-foreground text-sm font-bold h-6 w-6 flex items-center justify-center rounded-full">
                                            {count}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <div className="md:col-span-3 mt-6">
                            <Card className="card-telekom border-primary/20">
                                <CardHeader>
                                    <CardTitle>Részletes szavazatok</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-3">
                                        {votes.map(v => (
                                            <div key={v.id} className="p-4 rounded-xl border border-border/40 bg-background flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:border-primary/30 transition-colors">
                                                <div className="font-semibold text-lg">{v.mentee?.full_name || "Ismeretlen mentorált"}</div>
                                                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground w-full sm:w-auto">
                                                    {v.preferred_days.map(d => (
                                                        <span key={d} className="bg-primary/10 text-primary px-2 py-0.5 rounded-md">{d}</span>
                                                    ))}
                                                    {v.preferred_days.length > 0 && <span className="text-primary/20 mx-1">|</span>}
                                                    {v.preferred_times.map(t => (
                                                        <span key={t} className="bg-secondary/20 text-secondary-foreground px-2 py-0.5 rounded-md">{t.split(" ")[0]}</span>
                                                    ))}
                                                    {v.preferred_times.length > 0 && <span className="text-primary/20 mx-1">|</span>}
                                                    {v.preferred_durations.map(dur => (
                                                        <span key={dur} className="bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-md">{dur}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Mentee View
    return (
        <div className="mx-auto max-w-3xl space-y-8 z-10 relative animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                        Csoportos Foglalkozás Szavazás
                    </h1>
                    <p className="mt-2 text-muted-foreground text-base sm:text-lg">
                        Szavazz, hogy mikor lennének jók a csoportos foglalkozások!
                    </p>
                </div>
            </div>

            <Card className="card-telekom border-primary/20">
                <CardHeader>
                    <CardTitle>Preferenciáid</CardTitle>
                    <CardDescription>Jelöld meg az összes olyan opciót, ami számodra megfelelő.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">

                    {/* Days */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" /> Melyik napok jók?
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {PREFERRED_DAYS.map(day => (
                                <div key={day} className="flex items-center space-x-2 bg-primary/5 p-3 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors">
                                    <Checkbox
                                        id={`day-${day}`}
                                        checked={myVote.preferred_days.includes(day)}
                                        onCheckedChange={() => toggleArrayItem(myVote.preferred_days, day, (val) => setMyVote({ ...myVote, preferred_days: val }))}
                                    />
                                    <Label htmlFor={`day-${day}`} className="cursor-pointer font-normal">{day}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Times */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" /> Melyik napszakok jók?
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {PREFERRED_TIMES.map(time => (
                                <div key={time} className="flex items-center space-x-2 bg-primary/5 p-3 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors">
                                    <Checkbox
                                        id={`time-${time}`}
                                        checked={myVote.preferred_times.includes(time)}
                                        onCheckedChange={() => toggleArrayItem(myVote.preferred_times, time, (val) => setMyVote({ ...myVote, preferred_times: val }))}
                                    />
                                    <Label htmlFor={`time-${time}`} className="cursor-pointer font-normal">{time}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Durations */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" /> Mennyi ideig tartson?
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {PREFERRED_DURATIONS.map(dur => (
                                <div key={dur} className="flex items-center space-x-2 bg-primary/5 p-3 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors">
                                    <Checkbox
                                        id={`dur-${dur}`}
                                        checked={myVote.preferred_durations.includes(dur)}
                                        onCheckedChange={() => toggleArrayItem(myVote.preferred_durations, dur, (val) => setMyVote({ ...myVote, preferred_durations: val }))}
                                    />
                                    <Label htmlFor={`dur-${dur}`} className="cursor-pointer font-normal">{dur}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        onClick={handleSaveMyVote}
                        disabled={saving}
                        className="w-full btn-telekom py-6 text-lg mt-4"
                    >
                        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                        Szavazat Mentése / Módosítása
                    </Button>

                </CardContent>
            </Card>
        </div>
    );
}
