import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const mockSupabase = {
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
        select: () => ({
            eq: () => ({
                single: async () => ({ data: null, error: null }),
                maybeSingle: async () => ({ data: null, error: null }),
                in: () => ({
                    single: async () => ({ data: null, error: null }),
                    maybeSingle: async () => ({ data: null, error: null }),
                })
            }),
            in: () => ({
                single: async () => ({ data: null, error: null }),
                maybeSingle: async () => ({ data: null, error: null }),
            }),
            single: async () => ({ data: null, error: null }),
            maybeSingle: async () => ({ data: null, error: null }),
        }),
    }),
} as any;

export async function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey || url === "undefined") {
        console.warn("Building: Using mock Supabase server client.");
        return mockSupabase;
    }

    const cookieStore = await cookies();

    return createServerClient(url, anonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch (error) {
                    // Ignore setAll errors in Server Components
                }
            },
        },
    });
}

/**
 * Creates a Supabase client with the service role key for admin operations.
 */
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey || url === "undefined") {
        console.warn("Building: Using mock Supabase admin client.");
        return mockSupabase;
    }

    return createServerClient(url, serviceRoleKey, {
        cookies: {
            getAll() {
                return [];
            },
            setAll() {
                // Service role client doesn't need to set cookies
            },
        },
    });
}
