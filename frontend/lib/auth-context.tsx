"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    useMemo,
    ReactNode,
} from "react";
import { createClient } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

/**
 * Converts a username to the internal fake email used by Supabase auth.
 * Since this app uses username-based login (no real emails),
 * we store users with `username@mentortrack.app` as their email.
 */
export function usernameToEmail(username: string): string {
    return `${username.toLowerCase().trim()}@mentortrack.app`;
}

interface Profile {
    id: string;
    full_name: string;
    username: string;
    email: string;
    role: "mentor" | "mentee";
    joined_at: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    signIn: (username: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    signIn: async () => { },
    signOut: async () => { },
});

/** Fetch user profile with a timeout to prevent infinite loading on slow networks. */
async function fetchProfileWithTimeout(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    timeoutMs = 8000
): Promise<Profile | null> {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            console.warn("Profile fetch timed out – resolving with null.");
            resolve(null);
        }, timeoutMs);

        supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single()
            .then(({ data }: { data: Profile | null }) => {
                clearTimeout(timer);
                resolve(data);
            })
            .catch((err: unknown) => {
                clearTimeout(timer);
                console.error("Profile fetch error:", err);
                resolve(null);
            });
    });
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    // Prevent double-initialization from onAuthStateChange firing on mount
    const initialized = useRef(false);

    // Memoize the supabase client so it's not recreated on every render
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        let isMounted = true;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event: string, newSession: import("@supabase/supabase-js").Session | null) => {
                if (!isMounted) return;

                setSession(newSession);
                setUser(newSession?.user ?? null);

                // If user changed, or if we don't have a profile yet for this user:
                const isNewUser = newSession?.user?.id !== user?.id;
                const needsProfile = newSession?.user && (!profile || isNewUser);

                if (needsProfile && newSession.user) {
                    // Fetch profile with error handling + timeout – never blocks forever
                    const profileData = await fetchProfileWithTimeout(
                        supabase,
                        newSession.user.id
                    );
                    if (isMounted) {
                        setProfile(profileData);
                    }
                } else if (!newSession?.user) {
                    // User logged out
                    if (isMounted) {
                        setProfile(null);
                    }
                }

                // Always mark loading as done – even on error or timeout
                if (isMounted && !initialized.current) {
                    initialized.current = true;
                    setLoading(false);
                } else if (isMounted) {
                    setLoading(false);
                }
            }
        );

        // Safety net: if onAuthStateChange never fires (edge case), stop loading after 10s
        const safetyTimer = setTimeout(() => {
            if (isMounted && !initialized.current) {
                console.warn("Auth initialization safety timeout triggered.");
                initialized.current = true;
                setLoading(false);
            }
        }, 10000);

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(safetyTimer);
        };
    }, []);

    const signIn = async (username: string, password: string) => {
        const email = usernameToEmail(username);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            if (error.message.includes("Invalid login")) {
                throw new Error("Hibás felhasználónév vagy jelszó");
            }
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("SignOut error:", error);
        } finally {
            setUser(null);
            setSession(null);
            setProfile(null);
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{ user, session, profile, loading, signIn, signOut }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
