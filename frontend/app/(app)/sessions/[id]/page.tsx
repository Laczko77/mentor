"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    Users,
    User,
    Check,
    X,
    Loader2,
    Trash2,
    FileText,
    Save,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Booking {
    id: string;
    mentee_id: string;
    mentee_name: string;
    mentee_email: string;
    status: string;
    note: string | null;
    mentor_note: string | null;
    created_at: string;
}

interface SessionNote {
    id: string;
    session_id: string;
    mentee_id: string;
    mentee_name: string;
    content: string;
    updated_at: string;
}

interface SessionDetail {
    id: string;
    mentor_id: string;
    title: string;
    type: string;
    start_time: string;
    end_time: string;
    duration_min: number;
    max_slots: number;
    location_note: string;
    status: string;
    bookings: Booking[];
    booked_count: number;
}

export default function SessionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { profile } = useAuth();
    const [session, setSession] = useState<SessionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookNote, setBookNote] = useState("");
    const [booking, setBooking] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [notes, setNotes] = useState<SessionNote[]>([]);
    const [noteContents, setNoteContents] = useState<Record<string, string>>({});
    const [savingNote, setSavingNote] = useState<string | null>(null);

    const isMentor = profile?.role === "mentor";
    const sessionId = params.id as string;

    const fetchSession = async () => {
        try {
            const data = await api.get<SessionDetail>(`/sessions/${sessionId}`);
            setSession(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotes = async () => {
        try {
            const data = await api.get<SessionNote[]>(
                `/sessions/${sessionId}/notes`
            );
            setNotes(data);
            const contents: Record<string, string> = {};
            data.forEach((n) => {
                contents[n.mentee_id] = n.content;
            });
            setNoteContents(contents);
        } catch {
            // silent
        }
    };

    useEffect(() => {
        fetchSession();
        fetchNotes();
    }, [sessionId]);

    const handleBook = async () => {
        setBooking(true);
        try {
            await api.post(`/sessions/${sessionId}/book`, {
                note: bookNote || null,
            });
            toast.success("Sikeresen jelentkeztél!");
            setBookNote("");
            fetchSession();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Hiba";
            toast.error(msg);
        } finally {
            setBooking(false);
        }
    };

    const handleBookingAction = async (
        bookingId: string,
        status: "accepted" | "rejected",
        mentorNote?: string
    ) => {
        setActionLoading(bookingId);
        try {
            await api.put(`/bookings/${bookingId}/status`, {
                status,
                mentor_note: mentorNote || null,
            });
            toast.success(
                status === "accepted" ? "Foglalás elfogadva!" : "Foglalás elutasítva."
            );
            fetchSession();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Hiba";
            toast.error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Biztosan törlöd a sessiont? A foglalások is törlődnek."))
            return;
        try {
            await api.delete(`/sessions/${sessionId}`);
            toast.success("Session törölve");
            router.push("/sessions");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Hiba";
            toast.error(msg);
        }
    };

    const handleSaveNote = async (menteeId: string) => {
        setSavingNote(menteeId);
        try {
            await api.post(`/sessions/${sessionId}/notes`, {
                mentee_id: menteeId,
                content: noteContents[menteeId] || "",
            });
            toast.success("Megjegyzés mentve!");
            fetchNotes();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Hiba";
            toast.error(msg);
        } finally {
            setSavingNote(null);
        }
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

    if (!session) return <div className="py-20 text-center">Alkalom nem található</div>;

    const start = new Date(session.start_time);
    const end = new Date(session.end_time);

    const statusMap: Record<string, { label: string; class: string }> = {
        open: { label: "Nyitott", class: "bg-emerald-500/10 text-emerald-600" },
        closed: { label: "Lezárva", class: "bg-gray-500/10 text-gray-600" },
        cancelled: { label: "Törölve", class: "bg-red-500/10 text-red-600" },
    };

    const bookingStatusMap: Record<string, { label: string; class: string }> = {
        pending: { label: "Függő", class: "bg-amber-500/10 text-amber-600" },
        accepted: { label: "Elfogadva", class: "bg-emerald-500/10 text-emerald-600" },
        rejected: { label: "Elutasítva", class: "bg-red-500/10 text-red-600" },
        cancelled: { label: "Visszavonva", class: "bg-gray-500/10 text-gray-600" },
    };

    const alreadyBooked = session.bookings.some(
        (b) => b.mentee_id === profile?.id
    );
    const hasSlots = session.booked_count < session.max_slots;
    const acceptedBookings = session.bookings.filter((b) => b.status === "accepted");

    // Mentee view: show notes for self
    const myNotes = notes.filter((n) => n.mentee_id === profile?.id);

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/sessions">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {session.title}
                    </h1>
                </div>
                <Badge
                    variant="outline"
                    className={statusMap[session.status]?.class || ""}
                >
                    {statusMap[session.status]?.label || session.status}
                </Badge>
            </div>

            {/* Session Details */}
            <Card className="card-telekom">
                <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                    <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                            {start.toLocaleDateString("hu-HU", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                weekday: "long",
                            })}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                            {start.toLocaleTimeString("hu-HU", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}{" "}
                            –{" "}
                            {end.toLocaleTimeString("hu-HU", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}{" "}
                            ({session.duration_min} perc)
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        {session.type === "group" ? (
                            <Users className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>
                            {session.type === "individual" ? "Egyéni" : "Csoportos"}{" "}
                            {session.type === "group" &&
                                `(${session.booked_count}/${session.max_slots} hely)`}
                        </span>
                    </div>
                    {session.location_note && (
                        <div className="flex items-center gap-3 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{session.location_note}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Mentee: Book Button */}
            {!isMentor && session.status === "open" && !alreadyBooked && hasSlots && (
                <Card className="card-telekom">
                    <CardHeader>
                        <CardTitle className="text-lg">Jelentkezés</CardTitle>
                        <CardDescription>
                            Kattints a gombra a jelentkezéshez
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="Opcionális megjegyzés..."
                            value={bookNote}
                            onChange={(e) => setBookNote(e.target.value)}
                        />
                        <Button
                            onClick={handleBook}
                            disabled={booking}
                            className="w-full btn-telekom"
                        >
                            {booking ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Jelentkezem
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!isMentor && alreadyBooked && (
                <Card className="card-telekom">
                    <CardContent className="py-6 text-center text-muted-foreground">
                        ✓ Már jelentkeztél erre az alkalomra
                    </CardContent>
                </Card>
            )}

            {/* Mentee: My notes from mentor */}
            {!isMentor && myNotes.length > 0 && (
                <Card className="card-telekom">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-primary" />
                            Mentor megjegyzése
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {myNotes.map((n) => (
                            <div
                                key={n.id}
                                className="rounded-lg bg-muted/50 p-4 text-sm"
                            >
                                <p className="whitespace-pre-wrap">{n.content}</p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Frissítve:{" "}
                                    {new Date(n.updated_at).toLocaleString("hu-HU")}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Mentor: Bookings Table */}
            {isMentor && (
                <Card className="card-telekom">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">
                                Jelentkezések ({session.bookings.length})
                            </CardTitle>
                            <CardDescription>
                                Fogadd el vagy utasítsd el a jelentkezéseket
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {session.bookings.length > 0 ? (
                            <div className="overflow-x-auto -mx-6">
                                <div className="min-w-[500px] px-6">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Név</TableHead>
                                                <TableHead>Státusz</TableHead>
                                                <TableHead className="hidden sm:table-cell">Megjegyzés</TableHead>
                                                <TableHead className="text-right">Műveletek</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {session.bookings.map((b) => (
                                                <TableRow key={b.id}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{b.mentee_name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {b.mentee_email}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                bookingStatusMap[b.status]?.class || ""
                                                            }
                                                        >
                                                            {bookingStatusMap[b.status]?.label || b.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground hidden sm:table-cell">
                                                        {b.note || "–"}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {b.status === "pending" && (
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-8 gap-1 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                                                    disabled={actionLoading === b.id}
                                                                    onClick={() =>
                                                                        handleBookingAction(b.id, "accepted")
                                                                    }
                                                                >
                                                                    {actionLoading === b.id ? (
                                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                    ) : (
                                                                        <Check className="h-3.5 w-3.5" />
                                                                    )}
                                                                    <span className="hidden sm:inline">Elfogad</span>
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-8 gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                                    disabled={actionLoading === b.id}
                                                                    onClick={() =>
                                                                        handleBookingAction(b.id, "rejected")
                                                                    }
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                    <span className="hidden sm:inline">Elutasít</span>
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ) : (
                            <p className="py-8 text-center text-muted-foreground">
                                Még nincs jelentkezés
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Mentor: Session Notes */}
            {isMentor && acceptedBookings.length > 0 && (
                <Card className="card-telekom">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-primary" />
                            Alkalom megjegyzések
                        </CardTitle>
                        <CardDescription>
                            Feljegyzések az elfogadott mentoráltakhoz
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {acceptedBookings.map((b) => (
                            <div key={b.mentee_id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">{b.mentee_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {b.mentee_email}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 gap-1"
                                        disabled={savingNote === b.mentee_id}
                                        onClick={() => handleSaveNote(b.mentee_id)}
                                    >
                                        {savingNote === b.mentee_id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Save className="h-3.5 w-3.5" />
                                        )}
                                        Mentés
                                    </Button>
                                </div>
                                <Textarea
                                    placeholder="Témák, fejlesztési pontok, megjegyzések..."
                                    value={noteContents[b.mentee_id] || ""}
                                    onChange={(e) =>
                                        setNoteContents((prev) => ({
                                            ...prev,
                                            [b.mentee_id]: e.target.value,
                                        }))
                                    }
                                    className="min-h-[80px]"
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Mentor: Delete Session & Convert to Group */}
            {isMentor && (
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    {session.type === "individual" && session.status === "open" && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2 text-primary hover:bg-primary/10">
                                    <Users className="h-4 w-4" />
                                    Átalakítás Csoportossá
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md glass-panel border border-primary/20 bg-black/80 backdrop-blur-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black text-white flex items-center gap-2">
                                        <Users className="h-6 w-6 text-primary" />
                                        Csoportos Esemény
                                    </DialogTitle>
                                    <DialogDescription>
                                        Add meg, hogy maximum hány résztvevő csatlakozhat az eseményhez.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-muted-foreground">Maximális Létszám</label>
                                        <input
                                            type="number"
                                            min="2"
                                            id="group-max-slots"
                                            className="flex h-12 w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-base font-mono ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            defaultValue={5}
                                        />
                                    </div>
                                    <Button
                                        className="w-full h-12 btn-telekom text-md font-bold uppercase tracking-widest mt-4"
                                        onClick={async () => {
                                            const input = document.getElementById("group-max-slots") as HTMLInputElement;
                                            const slots = parseInt(input.value);
                                            if (slots < 2) return toast.error("Legalább 2 fő szükséges");
                                            try {
                                                await api.post(`/sessions/${session.id}/convert`, { max_slots: slots });
                                                toast.success("Esemény sikeresen átalakítva csoportossá!");
                                                window.location.reload();
                                            } catch (err: unknown) {
                                                toast.error(err instanceof Error ? err.message : "Hiba történt");
                                            }
                                        }}
                                    >
                                        Kiterjesztés
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                    <Button
                        variant="outline"
                        className="gap-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={handleDelete}
                    >
                        <Trash2 className="h-4 w-4" />
                        Alkalom törlése
                    </Button>
                </div>
            )}
        </div>
    );
}
