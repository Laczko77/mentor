import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check if we are in build time or have missing variables
    if (!url || !anonKey || url === "undefined") {
        console.warn("Building: Using mock Supabase client due to missing environment variables.");
        const throwMissingEnv = async () => {
            return { data: null, error: { message: "Supabase környezeti változók hiányoznak. Kérlek ellenőrizd a beállításokat." } };
        };
        return {
            auth: {
                getSession: async () => ({ data: { session: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                getUser: async () => ({ data: { user: null }, error: null }),
                signInWithPassword: throwMissingEnv,
                signUp: throwMissingEnv,
                signOut: throwMissingEnv,
                resetPasswordForEmail: throwMissingEnv,
            },
            from: () => ({
                select: () => ({
                    eq: () => ({
                        single: async () => ({ data: null, error: null }),
                        maybeSingle: async () => ({ data: null, error: null }),
                    }),
                    single: async () => ({ data: null, error: null }),
                    maybeSingle: async () => ({ data: null, error: null }),
                }),
            }),
        } as any;
    }

    return createBrowserClient(url, anonKey);
}
