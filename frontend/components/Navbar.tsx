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
} from "lucide-react";
import { useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";

export function Navbar() {
    const { profile, signOut } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isMentor = profile?.role === "mentor";

    const navItems = [
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

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
        router.refresh();
    };

    const initials = profile?.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";

    return (
        <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                        <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <span className="hidden text-lg font-bold tracking-tight sm:block">
                        MentorTrack
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden items-center gap-1 md:flex">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    size="sm"
                                    className={`gap-2 ${isActive
                                        ? "bg-secondary font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    title={item.label}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="hidden lg:inline">{item.label}</span>
                                </Button>
                            </Link>
                        );
                    })}
                </div>

                {/* User Menu */}
                <div className="flex items-center gap-2">
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
                                <Avatar className="h-8 w-8">
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
                                {profile?.email}
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleSignOut(); }} className="text-red-500">
                                <LogOut className="mr-2 h-4 w-4" />
                                Kijelentkezés
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mobile menu button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
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

            {/* Mobile Nav */}
            {mobileOpen && (
                <div className="border-t bg-background px-4 pb-4 pt-2 md:hidden">
                    {navItems.map((item) => {
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
                                    className="w-full justify-start gap-2"
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Button>
                            </Link>
                        );
                    })}
                </div>
            )}
        </nav>
    );
}
