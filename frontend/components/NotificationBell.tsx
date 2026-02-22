"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    related_id: string | null;
    is_read: boolean;
    created_at: string;
}

export function NotificationBell() {
    const { profile } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchUnreadCount = async () => {
        if (!profile) return;
        try {
            const data = await api.get<{ count: number }>("/notifications/unread-count");
            setUnreadCount(data.count);
        } catch {
            // silent
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await api.get<Notification[]>("/notifications");
            setNotifications(data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!profile) return;
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [profile]);

    useEffect(() => {
        if (open) fetchNotifications();
    }, [open]);

    // Close dropdown on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleMarkRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`, {});
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch {
            // silent
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put("/notifications/read-all", {});
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch {
            // silent
        }
    };

    const typeIcon: Record<string, string> = {
        booking_new: "📩",
        booking_accepted: "✅",
        booking_rejected: "❌",
        session_cancelled: "🚫",
        hours_warning: "⚠️",
    };

    const getLink = (n: Notification) => {
        if (n.related_id && (n.type === "booking_new" || n.type === "session_cancelled")) {
            return `/sessions/${n.related_id}`;
        }
        if (n.related_id && (n.type === "booking_accepted" || n.type === "booking_rejected")) {
            return `/sessions/${n.related_id}`;
        }
        return null;
    };

    if (!profile) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setOpen(!open)}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-0 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                )}
            </Button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-background shadow-2xl shadow-black/20 z-50">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h3 className="text-sm font-semibold">Értesítések</h3>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs text-muted-foreground"
                                onClick={handleMarkAllRead}
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                Mind olvasott
                            </Button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Nincs értesítés
                            </p>
                        ) : (
                            notifications.map((n) => {
                                const link = getLink(n);
                                return (
                                    <div
                                        key={n.id}
                                        className={`flex gap-3 border-b border-border/50 px-4 py-3 transition-colors last:border-0 ${!n.is_read
                                            ? "bg-primary/5"
                                            : "opacity-70"
                                            }`}
                                    >
                                        <span className="mt-0.5 text-lg leading-none">
                                            {typeIcon[n.type] || "📌"}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium leading-tight">
                                                {n.title}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                                {n.message}
                                            </p>
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(n.created_at).toLocaleString("hu-HU", {
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                                {link && (
                                                    <Link
                                                        href={link}
                                                        onClick={() => {
                                                            if (!n.is_read) handleMarkRead(n.id);
                                                            setOpen(false);
                                                        }}
                                                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                                                    >
                                                        Megnyit <ExternalLink className="h-2.5 w-2.5" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                        {!n.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
                                                onClick={() => handleMarkRead(n.id)}
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
