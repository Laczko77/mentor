"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Loader2, Clock, ArrowLeft, ChevronRight, Pencil, UserX, UserPlus } from "lucide-react";
import { TechCard } from "@/components/ui/TechCard";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Profile {
    id: string;
    full_name: string;
    username: string;
    email: string;
    role: string;
    joined_at: string;
    is_active?: boolean;
    required_hours?: number | null;
}

export default function MenteesPage() {
    const [mentees, setMentees] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMentee, setSelectedMentee] = useState<Profile | null>(null);

    // Add mentee dialog
    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({ full_name: "", username: "", password: "", required_hours: "12" });
    const [addLoading, setAddLoading] = useState(false);
    const [addSuccess, setAddSuccess] = useState(false);

    // Edit mentee dialog
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ id: "", full_name: "", username: "", required_hours: "" });
    const [editLoading, setEditLoading] = useState(false);

    // Deactivate confirm
    const [deactivateId, setDeactivateId] = useState<string | null>(null);

    const fetchMentees = () => {
        api.get<Profile[]>("/profiles")
            .then((data) => setMentees(data))
            .catch(() => { /* silent */ })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchMentees();
    }, []);

    const handleAddMentee = async () => {
        if (!addForm.full_name || !addForm.username || !addForm.password) return toast.error("Minden mező kötelező!");
        setAddLoading(true);
        try {
            await api.post("/profiles/manage", {
                ...addForm,
                required_hours: addForm.required_hours ? parseFloat(addForm.required_hours) : null,
            });
            toast.success("Mentorált sikeresen hozzáadva!");
            setAddSuccess(true);
            fetchMentees();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Hiba történt");
        } finally {
            setAddLoading(false);
        }
    };

    const handleEditMentee = async () => {
        if (!editForm.full_name || !editForm.username) return toast.error("Minden mező kötelező!");
        setEditLoading(true);
        try {
            await api.put("/profiles/manage", {
                ...editForm,
                required_hours: editForm.required_hours ? parseFloat(editForm.required_hours) : null,
            });
            toast.success("Mentorált frissítve!");
            setEditOpen(false);
            fetchMentees();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Hiba történt");
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        try {
            await api.delete(`/profiles/manage?id=${id}`);
            toast.success("Mentorált deaktiválva");
            setDeactivateId(null);
            fetchMentees();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Hiba történt");
        }
    };

    const openEdit = (m: Profile) => {
        setEditForm({
            id: m.id,
            full_name: m.full_name,
            username: m.username,
            required_hours: m.required_hours != null ? m.required_hours.toString() : "",
        });
        setEditOpen(true);
    };

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

    const activeMentees = mentees.filter(m => m.is_active !== false);
    const inactiveMentees = mentees.filter(m => m.is_active === false);

    return (
        <div className="space-y-6 sm:space-y-8 relative z-10 w-full">

            {!selectedMentee ? (
                <div
                    key="list"
                    className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-left-4 duration-300"
                >
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                                Mentoráltjaim
                            </h1>
                            <p className="mt-2 text-muted-foreground text-base sm:text-lg">
                                Mentoráltak kezelése és nyomon követése
                            </p>
                        </div>

                        {/* Add Mentee Dialog */}
                        <Dialog open={addOpen} onOpenChange={(open) => {
                            setAddOpen(open);
                            if (!open) {
                                setAddForm({ full_name: "", username: "", password: "", required_hours: "12" });
                                setAddSuccess(false);
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 btn-telekom">
                                    <UserPlus className="h-5 w-5" />
                                    Új Mentorált
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-panel border-primary/20">
                                <DialogHeader>
                                    <DialogTitle>Új Mentorált Regisztrálása</DialogTitle>
                                    <DialogDescription className="sr-only">
                                        Új mentorált fiók létrehozása
                                    </DialogDescription>
                                </DialogHeader>
                                {addSuccess ? (
                                    <div className="space-y-4 pt-4">
                                        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                            <p className="text-sm font-semibold text-emerald-500 mb-2">✅ Mentorált sikeresen létrehozva!</p>
                                            <p className="text-xs text-muted-foreground">
                                                A mentorált a megadott felhasználónévvel és jelszóval tud belépni.
                                            </p>
                                        </div>
                                        <Button className="w-full btn-telekom" onClick={() => { setAddOpen(false); setAddSuccess(false); setAddForm({ full_name: "", username: "", password: "", required_hours: "12" }); }}>
                                            Bezárás
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label>Teljes név</Label>
                                            <Input className="input-telekom" value={addForm.full_name} onChange={e => setAddForm({ ...addForm, full_name: e.target.value })} placeholder="Mentorált neve" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Felhasználónév</Label>
                                            <Input className="input-telekom" value={addForm.username} onChange={e => setAddForm({ ...addForm, username: e.target.value })} placeholder="felhasznalonev" />
                                            <p className="text-xs text-muted-foreground">Ezzel fog belépni a rendszerbe (min. 3 karakter)</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Jelszó</Label>
                                            <Input type="password" className="input-telekom" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} placeholder="••••••••" />
                                            <p className="text-xs text-muted-foreground">Bejelentkezési jelszó (min. 6 karakter)</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Kötelező óraszám</Label>
                                            <Select value={addForm.required_hours} onValueChange={(val) => setAddForm({ ...addForm, required_hours: val })}>
                                                <SelectTrigger className="input-telekom">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="12">12 óra (új belépők, &lt;3 hónap)</SelectItem>
                                                    <SelectItem value="4">4 óra (3+ hónapja dolgozik)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">Havi mentorálási kötelezettség</p>
                                        </div>
                                        <Button className="w-full btn-telekom mt-4" onClick={handleAddMentee} disabled={addLoading}>
                                            {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Regisztrálás"}
                                        </Button>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>

                    <TechCard delay={0.1}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                Aktív Mentoráltok ({activeMentees.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activeMentees.length > 0 ? (
                                <div className="space-y-3">
                                    {activeMentees.map((m) => {
                                        const initials = m.full_name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2);

                                        const hoursLabel = m.required_hours != null ? `${m.required_hours}h/hó` : "auto";

                                        return (
                                            <div key={m.id} className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-white/5 hover:border-primary/30 hover:bg-white/5 transition-all">
                                                <Avatar className="h-10 w-10 ring-2 ring-primary/20 group-hover:ring-primary shadow-[0_0_10px_rgba(226,0,116,0.1)] transition-all shrink-0">
                                                    <AvatarFallback className="bg-background text-primary font-bold text-xs">
                                                        {initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedMentee(m)}>
                                                    <p className="font-bold text-sm sm:text-base truncate">{m.full_name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs text-muted-foreground font-mono truncate">@{m.username}</p>
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                                                            {hoursLabel}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(m)}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => setDeactivateId(m.id)}>
                                                        <UserX className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors cursor-pointer" onClick={() => setSelectedMentee(m)} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="py-12 text-center text-muted-foreground italic">
                                    Nincsenek aktív mentoráltok. Használd az „Új Mentorált" gombot a hozzáadáshoz.
                                </p>
                            )}
                        </CardContent>
                    </TechCard>

                    {inactiveMentees.length > 0 && (
                        <TechCard delay={0.2}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
                                    <UserX className="h-5 w-5" />
                                    Inaktív ({inactiveMentees.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {inactiveMentees.map((m) => (
                                        <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 opacity-50">
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarFallback className="bg-background text-muted-foreground font-bold text-xs">
                                                    {m.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm truncate">{m.full_name}</p>
                                                <p className="text-xs text-muted-foreground font-mono truncate">@{m.username}</p>
                                            </div>
                                            <Badge variant="outline" className="text-xs shrink-0">Inaktív</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </TechCard>
                    )}
                </div>
            ) : (
                <div
                    key="profile"
                    className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
                >
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button onClick={() => setSelectedMentee(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0">
                            <ArrowLeft className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white truncate">
                                {selectedMentee.full_name}
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground font-mono truncate">
                                @{selectedMentee.username} • Csatlakozás: {new Date(selectedMentee.joined_at).toLocaleDateString("hu-HU")}
                                {selectedMentee.required_hours != null && ` • ${selectedMentee.required_hours}h/hó`}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <TechCard delay={0.2}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    Óra Összesítő
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm">
                                    A mentorált óráinak részletes kimutatása az Óraszám oldalon tekinthető meg.
                                </p>
                            </CardContent>
                        </TechCard>
                    </div>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="glass-panel border-primary/20">
                    <DialogHeader>
                        <DialogTitle>Mentorált Szerkesztése</DialogTitle>
                        <DialogDescription className="sr-only">
                            Mentorált adatainak szerkesztése
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Teljes név</Label>
                            <Input className="input-telekom" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Felhasználónév</Label>
                            <Input className="input-telekom" value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Kötelező óraszám</Label>
                            <Select value={editForm.required_hours || "auto"} onValueChange={(val) => setEditForm({ ...editForm, required_hours: val === "auto" ? "" : val })}>
                                <SelectTrigger className="input-telekom">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Automatikus (belépés dátuma alapján)</SelectItem>
                                    <SelectItem value="12">12 óra (új belépők, &lt;3 hónap)</SelectItem>
                                    <SelectItem value="4">4 óra (3+ hónapja dolgozik)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Havi mentorálási kötelezettség – „Automatikus" = belépés dátumából kalkulált</p>
                        </div>
                        <Button className="w-full btn-telekom mt-4" onClick={handleEditMentee} disabled={editLoading}>
                            {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mentés"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Deactivate Confirm Dialog */}
            <Dialog open={!!deactivateId} onOpenChange={() => setDeactivateId(null)}>
                <DialogContent className="glass-panel border-red-500/20">
                    <DialogHeader>
                        <DialogTitle className="text-red-500">Mentorált Deaktiválása</DialogTitle>
                        <DialogDescription className="sr-only">
                            Mentorált fiókjának törlése vagy deaktiválása
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground">
                            Biztosan deaktiválni szeretnéd ezt a mentoráltot? A mentorált többé nem fog megjelenni az aktív listában, de az adatai megmaradnak.
                        </p>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setDeactivateId(null)}>Mégse</Button>
                            <Button className="flex-1 bg-red-500/20 text-red-500 hover:bg-red-500/30" onClick={() => deactivateId && handleDeactivate(deactivateId)}>
                                Deaktiválás
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
