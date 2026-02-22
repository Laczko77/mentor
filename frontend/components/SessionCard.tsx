"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Clock,
    MapPin,
    Users,
    User,
    Calendar as CalendarIcon,
} from "lucide-react";
import Link from "next/link";

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
    };
    showActions?: boolean;
}

export function SessionCard({ session, showActions = true }: SessionCardProps) {
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);

    const statusColors: Record<string, string> = {
        open: "text-primary border-primary",
        closed: "text-muted-foreground border-border",
        cancelled: "text-destructive border-destructive",
    };

    const statusLabels: Record<string, string> = {
        open: "Nyitott",
        closed: "Lezárva",
        cancelled: "Törölve",
    };

    return (
        <Card className="group card-telekom transition-all duration-300">
            <CardHeader className="pb-3">
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
            <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {start.toLocaleDateString("hu-HU", {
                            month: "short",
                            day: "numeric",
                            weekday: "short",
                        })}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
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
                    <span className="flex items-center gap-1.5">
                        {session.type === "group" ? (
                            <Users className="h-3.5 w-3.5" />
                        ) : (
                            <User className="h-3.5 w-3.5" />
                        )}
                        {session.type === "individual" ? "Egyéni" : "Csoportos"}
                        {session.type === "group" && (
                            <span className="text-xs">
                                ({session.booked_count ?? 0}/{session.max_slots})
                            </span>
                        )}
                    </span>
                </div>

                {session.location_note && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {session.location_note}
                    </div>
                )}

                {showActions && (
                    <Link href={`/sessions/${session.id}`}>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/20 transition-all"
                        >
                            Részletek
                        </Button>
                    </Link>
                )}
            </CardContent>
        </Card>
    );
}
