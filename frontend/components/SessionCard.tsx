"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Clock,
    MapPin,
    Users,
    User,
    Calendar as CalendarIcon,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { TechCard } from "@/components/ui/TechCard";

interface SessionCardProps {
    session: {
        id: string;
        title: string;
        type: string;
        start_time: string;
        end_time: string;
        duration_min?: number;
        max_slots: number;
        location_note?: string;
        status: string;
        booked_count?: number;
        has_booked_by_me?: boolean;
    };
    showActions?: boolean;
    onApplySuccess?: () => void;
}

export function SessionCard({ session, showActions = true, onApplySuccess }: SessionCardProps) {
    const { profile } = useAuth();
    const isMentor = profile?.role === "mentor";
    const [booking, setBooking] = useState(false);

    const start = new Date(session.start_time);
    const end = new Date(session.end_time);

    const statusColors: Record<string, string> = {
        open: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
        closed: "text-muted-foreground border-border bg-muted/20",
        cancelled: "text-destructive border-destructive/20 bg-destructive/10",
    };

    const statusLabels: Record<string, string> = {
        open: "Nyitott",
        closed: "Lezárva",
        cancelled: "Törölve",
    };

    const handleBook = async (e: React.MouseEvent) => {
        e.preventDefault();
        setBooking(true);
        try {
            await api.post(`/sessions/${session.id}/book`, {
                note: null,
            });
            toast.success("Sikeresen jelentkeztél az alkalomra!");
            if (onApplySuccess) {
                onApplySuccess();
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Hiba a jelentkezés során";
            toast.error(msg);
        } finally {
            setBooking(false);
        }
    };

    const hasSlots = (session.booked_count ?? 0) < session.max_slots;
    const canQuickApply = !isMentor && session.status === "open" && hasSlots && showActions;

    return (
        <TechCard className="group transition-all duration-300 hover:border-primary/50">
            <CardHeader className="pb-3 px-0 pt-0">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold leading-snug">
                        {session.title}
                    </CardTitle>
                    <Badge
                        variant="outline"
                        className={`shrink-0 text-xs ${statusColors[session.status] || ""}`}
                    >
                        {statusLabels[session.status] || session.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 px-0 pb-0">
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary/70" />
                        <span className="font-medium text-foreground/80">
                            {start.toLocaleDateString("hu-HU", {
                                month: "short",
                                day: "numeric",
                                weekday: "short",
                            })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary/70" />
                        <span>
                            {start.toLocaleTimeString("hu-HU", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}{" "}
                            –{" "}
                            {end.toLocaleTimeString("hu-HU", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {session.type === "group" ? (
                            <Users className="h-4 w-4 text-primary/70" />
                        ) : (
                            <User className="h-4 w-4 text-primary/70" />
                        )}
                        <span>
                            {session.type === "individual" ? "Egyéni" : "Csoportos"}
                            {session.type === "group" && (
                                <span className="text-xs ml-1 font-medium">
                                    ({session.booked_count ?? 0}/{session.max_slots})
                                </span>
                            )}
                        </span>
                    </div>
                    {session.location_note && (
                        <div className="flex items-center gap-2 mt-1">
                            <MapPin className="h-4 w-4 text-primary/70" />
                            <span className="truncate" title={session.location_note}>{session.location_note}</span>
                        </div>
                    )}
                </div>

                {showActions && (
                    <div className="pt-2 flex flex-col gap-2">
                        {canQuickApply && !session.has_booked_by_me && (
                            <Button
                                onClick={handleBook}
                                disabled={booking}
                                className="w-full btn-telekom"
                            >
                                {booking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Jelentkezés
                            </Button>
                        )}
                        {canQuickApply && session.has_booked_by_me && (
                            <Button
                                variant="outline"
                                disabled
                                className="w-full bg-emerald-50 text-emerald-600 border-emerald-200"
                            >
                                ✓ Már jelentkeztél
                            </Button>
                        )}
                        <Link href={`/sessions/${session.id}`} className="w-full">
                            <Button
                                variant="outline"
                                className="w-full group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/20 transition-all font-medium"
                            >
                                Részletek
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </TechCard>
    );
}
