"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const getInitialSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", session.user.id)
                    .single();
                setProfile(data as Profile | null);
            }

            setLoading(false);
        };

        getInitialSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", session.user.id)
                    .single();
                setProfile(data as Profile | null);
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (username: string, password: string) => {
        // Convert username to internal fake email for Supabase auth
        const email = usernameToEmail(username);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            // Show user-friendly error instead of "Invalid login credentials"
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
