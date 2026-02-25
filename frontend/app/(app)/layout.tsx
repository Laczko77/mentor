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

    // Not logged in or profile not loaded yet – redirect is handled by useEffect above.
    // Show loading state instead of null to prevent the "grey screen of death" if profile is temporarily missing on PWA wake.
    if (!user || !profile) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-primary drop-shadow-[0_0_10px_rgba(226,0,116,0.6)]" />
                    <p className="text-sm font-mono tracking-widest text-primary animate-pulse mt-4 uppercase">Szinkronizálás...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-stretch relative isolate">
            <AnimatedBackground />

            <HeaderWrapper>
                <Navbar />
            </HeaderWrapper>

            <main className="flex-1 mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8 w-full relative z-10">
                <PageTransition>
                    {children}
                </PageTransition>
            </main>
        </div>
    );
}

// Ensure the navbar sits properly on top independent of the rest of the flow
function HeaderWrapper({ children }: { children: React.ReactNode }) {
    return <div className="relative z-50">{children}</div>;
}
