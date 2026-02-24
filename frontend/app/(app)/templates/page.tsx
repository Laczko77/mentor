"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BookTemplate, Calendar, Clock, Loader2, MapPin, Plus, Trash2, Users, User, Search, FileJson, Server, Play } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { TechCard } from "@/components/ui/TechCard";
import { MagneticButton } from "@/components/ui/MagneticButton";
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
                [ACCESS DENIED] Csak mentor azonosítóval rendelkező entitások számára.
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-6xl space-y-10 relative z-10 w-full mb-20 animate-in fade-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                        Sablonok
                    </motion.h1>
                    <motion.p initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="mt-2 text-muted-foreground text-lg flex items-center gap-2">
                        <Server className="h-5 w-5 text-primary" />
                        Foglalkozás sablonok kezelése
                    </motion.p>
                </div>

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <MagneticButton className="gap-2 shadow-[0_0_15px_rgba(226,0,116,0.3)]">
                            <Plus className="h-5 w-5" />
                            Új Sablon Létrehozása
                        </MagneticButton>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md glass-panel border border-primary/20 bg-black/80 backdrop-blur-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-white flex items-center gap-2">
                                <FileJson className="h-6 w-6 text-primary" />
                                Új Sablon Konfiguráció
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-5 pt-4">
                            <div className="space-y-1">
                                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Sablon azonosító (Név)</Label>
                                <Input
                                    className="input-telekom h-11"
                                    placeholder="pl. Heti 1:1 – Teams"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Publikus Session Cím</Label>
                                <Input
                                    className="input-telekom h-11"
                                    placeholder="pl. Heti Architektúra Áttekintés"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Topológia (Típus)</Label>
                                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                                        <SelectTrigger className="input-telekom h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="glass-panel border-primary/20">
                                            <SelectItem value="individual">Egyéni (P2P)</SelectItem>
                                            <SelectItem value="group">Csoportos (Multi)</SelectItem>
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
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Max Kliensek</Label>
                                    <Input
                                        className="input-telekom h-11 font-mono"
                                        type="number"
                                        value={form.max_slots}
                                        onChange={(e) => setForm({ ...form, max_slots: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Végpont (Helyszín)</Label>
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
                                Konfiguráció Mentése
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
                                "relative px-6 py-2.5 text-sm font-bold uppercase tracking-widest transition-colors rounded-lg z-10",
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
                                <TechCard className="h-full group hover:border-primary/50 transition-all duration-500">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                                                    {tpl.name}
                                                </CardTitle>
                                                <CardDescription className="font-mono text-xs">
                                                    {tpl.title}
                                                </CardDescription>
                                            </div>
                                            <Badge
                                                className={cn(
                                                    "px-2.5 py-1 text-[10px] uppercase tracking-widest",
                                                    tpl.type === "individual"
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                        : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                                )}
                                            >
                                                {tpl.type === "individual" ? "P2P" : "Multi"}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-2 gap-3 text-sm font-mono text-muted-foreground bg-black/40 p-3 rounded-xl border border-white/5 group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-primary" />
                                                <span className="text-white">{tpl.duration_min}m</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {tpl.type === "group" ? (
                                                    <Users className="h-4 w-4 text-emerald-500" />
                                                ) : (
                                                    <User className="h-4 w-4 text-emerald-500" />
                                                )}
                                                <span className="text-white">{tpl.max_slots} Kliens</span>
                                            </div>
                                            {tpl.location_note && (
                                                <div className="col-span-2 flex items-center gap-2 truncate">
                                                    <MapPin className="h-4 w-4 flex-shrink-0 text-blue-400" />
                                                    <span className="truncate text-white text-xs">{tpl.location_note}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            <Button
                                                className="flex-1 gap-2 font-bold tracking-widest uppercase btn-telekom"
                                                onClick={() => {
                                                    setSelectedTpl(tpl);
                                                    setScheduleOpen(true);
                                                }}
                                            >
                                                <Calendar className="h-4 w-4" />
                                                Indítás
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-colors"
                                                onClick={() => handleDelete(tpl.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>

                                    {/* Connection established effect */}
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity" />
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
                                    <span className="text-muted-foreground uppercase tracking-wider">Erőforrás:</span>
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
        </motion.div>
    );
}
