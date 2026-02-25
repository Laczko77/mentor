"use client";

import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { PageTransition } from "@/components/PageTransition";
import { Loader2 } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { loading, user, profile } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [loading, user, router]);

    // Show loading screen only while auth state is resolving
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-primary drop-shadow-[0_0_10px_rgba(226,0,116,0.6)]" />
                    <p className="text-sm font-mono tracking-widest text-primary animate-pulse mt-4 uppercase">Betöltés...</p>
                </div>
            </div>
        );
    }

    // Not logged in – redirect is handled by useEffect above, render nothing briefly
    if (!user || !profile) {
        return null;
    }

    return (
        <div className="min-h-screen relative z-0">
            <AnimatedBackground />
            <Navbar />
            <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8 relative z-10">
                <PageTransition>
                    {children}
                </PageTransition>
            </main>
        </div>
    );
}
