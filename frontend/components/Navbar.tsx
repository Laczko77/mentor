"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    LayoutDashboard,
    Calendar,
    CalendarDays,
    Clock,
    Users,
    LogOut,
    Menu,
    X,
    GraduationCap,
    BookTemplate,
    BarChart3,
    ClipboardList,
    ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { NotificationBell } from "@/components/NotificationBell";

export function Navbar() {
    const { profile, signOut } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileOpen]);

    const isMentor = profile?.role === "mentor";

    // All nav items (for mobile)
    const allNavItems = [
        { href: "/dashboard", label: "Vezérlőpult", icon: LayoutDashboard },
        { href: "/sessions", label: "Alkalmak", icon: Calendar },
        { href: "/calendar", label: "Naptár", icon: CalendarDays },
        { href: "/requests", label: "Kérelmek", icon: ClipboardList },
        { href: "/hours", label: "Óraszám", icon: Clock },
        ...(isMentor
            ? [
                { href: "/mentees", label: "Mentoráltjaim", icon: Users },
                { href: "/templates", label: "Sablonok", icon: BookTemplate },
                { href: "/statistics", label: "Statisztika", icon: BarChart3 },
            ]
            : []),
    ];

    // Desktop grouped navigation
    const sessionsGroup = [
        { href: "/sessions", label: "Alkalmak", icon: Calendar },
        { href: "/calendar", label: "Naptár", icon: CalendarDays },
        { href: "/requests", label: "Kérelmek", icon: ClipboardList },
    ];

    const managementGroup = isMentor ? [
        { href: "/mentees", label: "Mentoráltjaim", icon: Users },
        { href: "/templates", label: "Sablonok", icon: BookTemplate },
        { href: "/statistics", label: "Statisztika", icon: BarChart3 },
    ] : [];

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (e) {
            console.error("SignOut failed:", e);
        } finally {
            // Hard redirect to force full page reload & cookie clearing
            // Always redirect, even if signOut throws a network error
            window.location.href = "/login";
        }
    };

    const initials = profile?.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";

    const isGroupActive = (items: { href: string }[]) =>
        items.some((item) => pathname === item.href);

    const activeGroupLabel = (items: { href: string; label: string }[]) =>
        items.find((item) => pathname === item.href)?.label;

    return (
        <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg overflow-hidden shadow-lg shadow-primary/20 bg-black/50 border border-primary/20">
                        <Image src="/logo.png" alt="MentorTér Logo" width={36} height={36} className="object-cover" unoptimized />
                    </div>
                    <span className="text-base sm:text-lg font-bold tracking-tight">
                        MentorTér
                    </span>
                </Link>

                {/* Desktop Nav - Grouped */}
                <div className="hidden items-center gap-1 md:flex">
                    {/* Dashboard - standalone */}
                    <Link href="/dashboard">
                        <Button
                            variant={pathname === "/dashboard" ? "secondary" : "ghost"}
                            size="sm"
                            className={`gap-2 ${pathname === "/dashboard" ? "bg-secondary font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Vezérlőpult
                        </Button>
                    </Link>

                    {/* Sessions dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant={isGroupActive(sessionsGroup) ? "secondary" : "ghost"}
                                size="sm"
                                className={`gap-1.5 ${isGroupActive(sessionsGroup) ? "bg-secondary font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                <Calendar className="h-4 w-4" />
                                {activeGroupLabel(sessionsGroup) || "Foglalkozások"}
                                <ChevronDown className="h-3 w-3 opacity-60" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            {sessionsGroup.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <DropdownMenuItem key={item.href} asChild>
                                        <Link href={item.href} className={`flex items-center gap-2 ${pathname === item.href ? "font-semibold text-primary" : ""}`}>
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </Link>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Hours - standalone */}
                    <Link href="/hours">
                        <Button
                            variant={pathname === "/hours" ? "secondary" : "ghost"}
                            size="sm"
                            className={`gap-2 ${pathname === "/hours" ? "bg-secondary font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Clock className="h-4 w-4" />
                            Óraszám
                        </Button>
                    </Link>

                    {/* Management dropdown (mentor only) */}
                    {isMentor && managementGroup.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant={isGroupActive(managementGroup) ? "secondary" : "ghost"}
                                    size="sm"
                                    className={`gap-1.5 ${isGroupActive(managementGroup) ? "bg-secondary font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    <Users className="h-4 w-4" />
                                    {activeGroupLabel(managementGroup) || "Kezelés"}
                                    <ChevronDown className="h-3 w-3 opacity-60" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                                {managementGroup.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <DropdownMenuItem key={item.href} asChild>
                                            <Link href={item.href} className={`flex items-center gap-2 ${pathname === item.href ? "font-semibold text-primary" : ""}`}>
                                                <Icon className="h-4 w-4" />
                                                {item.label}
                                            </Link>
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* User Menu */}
                <div className="flex items-center gap-1 sm:gap-2">
                    <NotificationBell />
                    <Badge
                        variant={isMentor ? "default" : "secondary"}
                        className="hidden sm:flex"
                    >
                        {isMentor ? "Mentor" : "Mentorált"}
                    </Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="gap-2 px-2">
                                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                                    <AvatarFallback className="bg-primary text-xs font-semibold text-white">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden text-sm font-medium md:block">
                                    {profile?.full_name}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                @{(profile as any)?.username || profile?.email}
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut} className="text-red-500 cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" />
                                Kijelentkezés
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mobile menu button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-9 w-9"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile Nav - Full screen overlay */}
            {mobileOpen && (
                <div className="fixed inset-x-0 top-[56px] z-50 h-[calc(100dvh-56px)] bg-background md:hidden animate-in fade-in slide-in-from-top-2 duration-200 overflow-y-auto">
                    <div className="flex flex-col px-4 py-4 gap-1">
                        {allNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <Button
                                        variant={isActive ? "secondary" : "ghost"}
                                        className={`w-full justify-start gap-3 h-12 text-base ${isActive ? 'bg-primary/10 text-primary font-semibold' : ''}`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {item.label}
                                    </Button>
                                </Link>
                            );
                        })}
                        <div className="mt-4 pt-4 border-t border-border/40">
                            <Badge variant={isMentor ? "default" : "secondary"} className="mb-3">
                                {isMentor ? "Mentor" : "Mentorált"}
                            </Badge>
                            <p className="text-xs text-muted-foreground px-2">@{(profile as any)?.username || profile?.email}</p>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
