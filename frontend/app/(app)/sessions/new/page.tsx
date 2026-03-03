"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, Repeat, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function NewSessionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: "",
        type: "individual",
        start_date: "",
        start_time: "",
        end_time: "",
        max_slots: 1,
        location_note: "",
    });

    // Recurring options
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceRule, setRecurrenceRule] = useState("weekly");
    const [weeks, setWeeks] = useState(4);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const start = new Date(`${form.start_date}T${form.start_time}`);
            const end = new Date(`${form.start_date}T${form.end_time}`);

            if (end <= start) {
                toast.error("A befejezési időnek a kezdés után kell lennie");
                setLoading(false);
                return;
            }

            if (isRecurring) {
                // Create recurring sessions
                const res = await api.post<{ count: number }>("/sessions/recurring", {
                    title: form.title,
                    type: form.type,
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                    max_slots: form.type === "group" ? form.max_slots : 1,
                    location_note: form.location_note || null,
                    recurrence_rule: recurrenceRule,
                    weeks,
                });
                toast.success(`${res.count} ismétlődő alkalom létrehozva!`);
            } else {
                await api.post("/sessions", {
                    title: form.title,
                    type: form.type,
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                    max_slots: form.type === "group" ? form.max_slots : 1,
                    location_note: form.location_note || null,
                });
                toast.success("Alkalom sikeresen létrehozva!");
            }

            router.push("/sessions");
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Hiba a létrehozáskor";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // Preview recurring dates
    const getPreviewDates = () => {
        if (!form.start_date || !form.start_time) return [];
        const start = new Date(`${form.start_date}T${form.start_time}`);
        const intervalDays = recurrenceRule === "weekly" ? 7 : 14;
        const dates = [];
        for (let i = 0; i < weeks; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i * intervalDays);
            dates.push(d);
        }
        return dates;
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/sessions">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Új alkalom</h1>
                    <p className="mt-1 text-muted-foreground">
                        Hirdess meg egy új mentorálási alkalmat
                    </p>
                </div>
            </div>

            <Card className="card-telekom">
                <CardHeader>
                    <CardTitle>Alkalom adatai</CardTitle>
                    <CardDescription>
                        A mentoráltjaid itt fogják látni és tudnak rá jelentkezni
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="title">Megnevezés</Label>
                            <Input
                                id="title"
                                placeholder="pl. 1:1 Mentoring - Onboarding"
                                value={form.title}
                                onChange={(e) =>
                                    setForm({ ...form, title: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Típus</Label>
                            <Select
                                value={form.type}
                                onValueChange={(v) =>
                                    setForm({
                                        ...form,
                                        type: v,
                                        max_slots: v === "individual" ? 1 : form.max_slots,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="individual">Egyéni</SelectItem>
                                    <SelectItem value="group">Csoportos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {form.type === "group" && (
                            <div className="space-y-2">
                                <Label htmlFor="max_slots">Max. résztvevők</Label>
                                <Input
                                    id="max_slots"
                                    type="number"
                                    min={2}
                                    max={20}
                                    value={form.max_slots}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            max_slots: parseInt(e.target.value) || 2,
                                        })
                                    }
                                />
                            </div>
                        )}

                        <div className="space-y-2 flex flex-col">
                            <Label>Dátum</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal input-telekom bg-black/40 border-white/10 hover:bg-white/5",
                                            !form.start_date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {form.start_date ? (
                                            format(new Date(form.start_date), "yyyy. MMMM d.", { locale: hu })
                                        ) : (
                                            <span>Válassz dátumot</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 glass-panel border-primary/20 bg-black/80 backdrop-blur-3xl" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={form.start_date ? new Date(form.start_date) : undefined}
                                        onSelect={(date) => {
                                            if (date) {
                                                const offset = date.getTimezoneOffset() * 60000;
                                                const localDate = new Date(date.getTime() - offset).toISOString().split('T')[0];
                                                setForm({ ...form, start_date: localDate });
                                            } else {
                                                setForm({ ...form, start_date: "" });
                                            }
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <input type="hidden" value={form.start_date} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_time">Kezdés</Label>
                                <Input
                                    id="start_time"
                                    type="time"
                                    value={form.start_time}
                                    onChange={(e) =>
                                        setForm({ ...form, start_time: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_time">Befejezés</Label>
                                <Input
                                    id="end_time"
                                    type="time"
                                    value={form.end_time}
                                    onChange={(e) =>
                                        setForm({ ...form, end_time: e.target.value })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Helyszín / Link</Label>
                            <Textarea
                                id="location"
                                placeholder="pl. Teams link, Iroda 3.em"
                                value={form.location_note}
                                onChange={(e) =>
                                    setForm({ ...form, location_note: e.target.value })
                                }
                            />
                        </div>

                        {/* Recurring section */}
                        <div className="rounded-xl border border-border p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Repeat className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium">
                                        Ismétlődő alkalom
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant={isRecurring ? "default" : "outline"}
                                    size="sm"
                                    className="h-7"
                                    onClick={() => setIsRecurring(!isRecurring)}
                                >
                                    {isRecurring ? "Bekapcsolva" : "Kikapcsolva"}
                                </Button>
                            </div>

                            {isRecurring && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Ismétlődés</Label>
                                            <Select
                                                value={recurrenceRule}
                                                onValueChange={setRecurrenceRule}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="weekly">
                                                        Hetente
                                                    </SelectItem>
                                                    <SelectItem value="biweekly">
                                                        Kéthetente
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">
                                                Hetek száma
                                            </Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={12}
                                                value={weeks}
                                                onChange={(e) =>
                                                    setWeeks(
                                                        Math.min(
                                                            12,
                                                            Math.max(1, Number(e.target.value))
                                                        )
                                                    )
                                                }
                                                className="h-9"
                                            />
                                        </div>
                                    </div>

                                    {/* Date preview */}
                                    {form.start_date && form.start_time && (
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Előnézet ({weeks} alkalom):
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {getPreviewDates().map((d, i) => (
                                                    <Badge
                                                        key={i}
                                                        variant="outline"
                                                        className="gap-1 text-xs"
                                                    >
                                                        <CalendarIcon className="h-3 w-3" />
                                                        {d.toLocaleDateString("hu-HU", {
                                                            month: "short",
                                                            day: "numeric",
                                                            weekday: "short",
                                                        })}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-telekom"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {isRecurring
                                ? `${weeks} alkalom létrehozása`
                                : "Alkalom létrehozása"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
