"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BookTemplate, Calendar, Clock, Loader2, MapPin, Plus, Trash2, Users, User, Search, FileJson, Server, Play } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { TechCard } from "@/components/ui/TechCard";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Template {
    id: string;
    name: string;
    title: string;
    type: string;
    duration_min: number;
    max_slots: number;
    location_note: string | null;
    created_at: string;
}

const TABS = [
    { id: "all", label: "Összes sablon" },
    { id: "individual", label: "Egyéni" },
    { id: "group", label: "Csoportos" },
];

export default function TemplatesPage() {
    const { profile } = useAuth();
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [selectedTpl, setSelectedTpl] = useState<Template | null>(null);
    const [startTime, setStartTime] = useState("");
    const [saving, setSaving] = useState(false);
    const [scheduling, setScheduling] = useState(false);

    // UI States for Network Hub
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [activeTab, setActiveTab] = useState("all");

    // New template form
    const [form, setForm] = useState({
        name: "",
        title: "",
        type: "individual",
        duration_min: 60,
        max_slots: 1,
        location_note: "",
    });

    const isMentor = profile?.role === "mentor";

    const fetchTemplates = async () => {
        try {
            const data = await api.get<Template[]>("/templates");
            setTemplates(data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isMentor) fetchTemplates();
        else setLoading(false);
    }, [isMentor]);

    const handleCreate = async () => {
        if (!form.name.trim() || !form.title.trim()) {
            toast.error("Név és cím szükséges a validációhoz");
            return;
        }
        setSaving(true);
        try {
            await api.post("/templates", {
                ...form,
                location_note: form.location_note || null,
            });
            toast.success("Új sablon sikeresen létrehozva!");
            setCreateOpen(false);
            setForm({
                name: "",
                title: "",
                type: "individual",
                duration_min: 60,
                max_slots: 1,
                location_note: "",
            });
            fetchTemplates();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Rendszerhiba");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Biztosan törlöd ezt a sablont?")) return;
        try {
            await api.delete(`/templates/${id}`);
            toast.success("Sablon törölve");
            fetchTemplates();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Hiba");
        }
    };

    const handleSchedule = async () => {
        if (!selectedTpl || !startTime) return;
        setScheduling(true);
        try {
            await api.post(`/templates/${selectedTpl.id}`, {
                start_time: startTime,
            });
            toast.success("Sablon sikeresen létrehozva!");
            setScheduleOpen(false);
            setStartTime("");
            setSelectedTpl(null);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Hiba");
        } finally {
            setScheduling(false);
        }
    };

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === "all" || t.type === activeTab;
        return matchesSearch && matchesTab;
    });

    if (!isMentor) {
        return (
            <div className="py-20 text-center text-muted-foreground font-mono">
                Nincs jogosultságod. Ez az oldal csak mentorok számára elérhető.
            </div>
        );
    }

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
        <div className="mx-auto max-w-6xl space-y-10 relative z-10 w-full mb-20 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 animate-in fade-in slide-in-from-left-4 duration-500">
                        Sablonok
                    </h1>
                    <p className="mt-2 text-muted-foreground text-lg flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-500 delay-150 fill-mode-both">
                        <Server className="h-5 w-5 text-primary" />
                        Foglalkozás sablonok kezelése
                    </p>
                </div>

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 btn-telekom">
                            <Plus className="h-5 w-5" />
                            Új Sablon Létrehozása
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md glass-panel border border-primary/20 bg-black/80 backdrop-blur-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-white flex items-center gap-2">
                                <FileJson className="h-6 w-6 text-primary" />
                                Új Sablon
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Új sablon létrehozása űrlap
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-5 pt-4">
                            <div className="space-y-1">
                                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Sablon neve</Label>
                                <Input
                                    className="input-telekom h-11"
                                    placeholder="pl. Heti 1:1 – Teams"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Alkalom címe</Label>
                                <Input
                                    className="input-telekom h-11"
                                    placeholder="pl. Heti Architektúra Áttekintés"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Típus</Label>
                                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                                        <SelectTrigger className="input-telekom h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="glass-panel border-primary/20">
                                            <SelectItem value="individual">Egyéni</SelectItem>
                                            <SelectItem value="group">Csoportos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Időtartam (perc)</Label>
                                    <Input
                                        className="input-telekom h-11 font-mono"
                                        type="number"
                                        value={form.duration_min}
                                        onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Max létszám</Label>
                                    <Input
                                        className="input-telekom h-11 font-mono"
                                        type="number"
                                        value={form.max_slots}
                                        onChange={(e) => setForm({ ...form, max_slots: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Helyszín</Label>
                                    <Input
                                        className="input-telekom h-11"
                                        placeholder="Teams / Iroda..."
                                        value={form.location_note}
                                        onChange={(e) => setForm({ ...form, location_note: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button className="w-full h-12 btn-telekom text-md font-bold uppercase tracking-widest mt-4" onClick={handleCreate} disabled={saving}>
                                {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileJson className="mr-2 h-5 w-5" />}
                                Sablon Mentése
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Controls (Search & Tabs) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-sm shadow-inner">
                {/* Search Bar */}
                <div className="relative w-full md:max-w-md group">
                    <Search className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300",
                        isSearchFocused ? "text-primary drop-shadow-[0_0_5px_rgba(226,0,116,0.8)]" : "text-muted-foreground"
                    )} size={18} />
                    <Input
                        placeholder="Keresés az archívumban..."
                        className="pl-12 h-12 bg-white/5 border-transparent focus:bg-white/10 transition-all rounded-xl focus-visible:ring-0 focus-visible:border-primary/50 text-base"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                    />
                    {/* Glowing Underline Cursor Effect */}
                    <div className={cn(
                        "absolute bottom-0 left-0 h-[2px] bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(226,0,116,1)]",
                        isSearchFocused ? "w-full opacity-100" : "w-0 opacity-0"
                    )} />
                </div>

                {/* Categorization Tabs */}
                <div className="flex bg-white/5 p-1.5 rounded-xl self-start md:self-auto border border-white/5 relative">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider sm:tracking-widest transition-colors rounded-lg z-10",
                                activeTab === tab.id ? "text-white" : "text-muted-foreground hover:text-white/80"
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="active-tab"
                                    className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-lg shadow-[inset_0_0_15px_rgba(226,0,116,0.2)]"
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                />
                            )}
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {templates.length === 0 ? (
                <TechCard delay={0.2} className="py-20 text-center flex flex-col items-center justify-center">
                    <BookTemplate className="h-20 w-20 text-muted-foreground/30 mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-2">Még nincsenek sablonok</h3>
                    <p className="text-muted-foreground text-lg">Hozd létre az első sablont az alkalmak gyors indításához.</p>
                </TechCard>
            ) : filteredTemplates.length === 0 ? (
                <div className="py-20 text-center">
                    <p className="text-muted-foreground font-mono text-lg">Nincs találat a megadott paraméterekre.</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                        {filteredTemplates.map((tpl, i) => (
                            <motion.div
                                key={tpl.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3, delay: i * 0.05 }}
                            >
                                <TechCard className="h-full group relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.02] hover:border-primary/30">
                                    {/* Subtle gradient glow behind the card on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <CardHeader className="relative pb-4 pt-5 px-5 z-10">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <CardTitle className="text-xl font-bold tracking-tight text-white/90 group-hover:text-primary transition-colors truncate">
                                                    {tpl.name}
                                                </CardTitle>
                                                <CardDescription className="text-sm text-white/50 truncate">
                                                    {tpl.title}
                                                </CardDescription>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "shrink-0 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border-white/10 bg-black/50 backdrop-blur-md rounded-full",
                                                    tpl.type === "individual"
                                                        ? "text-emerald-400 group-hover:border-emerald-500/30"
                                                        : "text-purple-400 group-hover:border-purple-500/30"
                                                )}
                                            >
                                                {tpl.type === "individual" ? "Egyéni" : "Csoportos"}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="relative px-5 pb-5 space-y-5 z-10 flex flex-col h-[calc(100%-80px)] justify-between">
                                        <div className="flex items-center gap-4 text-sm font-medium text-white/70 bg-white/5 rounded-xl px-4 py-3 border border-white/5 mx-auto w-full">
                                            <div className="flex items-center gap-2 flex-1">
                                                <Clock className="h-[14px] w-[14px] text-primary" />
                                                <span>{tpl.duration_min}m</span>
                                            </div>
                                            <div className="w-[1px] h-4 bg-white/10" />
                                            <div className="flex items-center gap-2 flex-1 justify-end">
                                                {tpl.type === "group" ? (
                                                    <Users className="h-[14px] w-[14px] text-emerald-400" />
                                                ) : (
                                                    <User className="h-[14px] w-[14px] text-emerald-400" />
                                                )}
                                                <span>{tpl.max_slots} fő</span>
                                            </div>
                                        </div>

                                        {tpl.location_note && (
                                            <div className="flex items-center gap-2.5 text-xs text-white/50 px-1">
                                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span className="truncate">{tpl.location_note}</span>
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-2 mt-auto">
                                            <Button
                                                className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold tracking-wide btn-telekom shadow-lg shadow-primary/20"
                                                onClick={() => {
                                                    setSelectedTpl(tpl);
                                                    setScheduleOpen(true);
                                                }}
                                            >
                                                <Calendar className="mr-2 h-4 w-4" />
                                                Indítás
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                onClick={() => handleDelete(tpl.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>

                                    {/* Animated bottom border instead of top line for a more grounded feel */}
                                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                </TechCard>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Schedule from template dialog */}
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                <DialogContent className="sm:max-w-md glass-panel border border-primary/20 bg-black/80 backdrop-blur-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-white flex items-center gap-2">
                            <Calendar className="h-6 w-6 text-primary" />
                            Esemény Publikálása
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Esemény publikálása naptárba
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Kezdés Időpontja</Label>
                            <Input
                                type="datetime-local"
                                className="input-telekom h-12 font-mono text-base"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>
                        {selectedTpl && (
                            <div className="rounded-xl bg-black/50 border border-white/5 p-4 text-sm font-mono space-y-2">
                                <div className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="text-muted-foreground uppercase tracking-wider">Sablon:</span>
                                    <span className="text-white font-bold">{selectedTpl.title}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/10 pb-2 pt-1">
                                    <span className="text-muted-foreground uppercase tracking-wider">Hossz:</span>
                                    <span className="text-primary font-bold">{selectedTpl.duration_min} perc</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="text-muted-foreground uppercase tracking-wider">Típus:</span>
                                    <span className="text-emerald-400 font-bold">{selectedTpl.type === "individual" ? "Egyéni" : "Csoportos"}</span>
                                </div>
                            </div>
                        )}
                        <Button
                            className="w-full h-12 text-md font-bold uppercase tracking-widest btn-telekom"
                            onClick={handleSchedule}
                            disabled={scheduling || !startTime}
                        >
                            {scheduling ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <Play className="mr-2 h-5 w-5" />
                            )}
                            Alkalom létrehozása
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
