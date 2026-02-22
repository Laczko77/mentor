import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
    const cookieStore = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        console.warn("Building: Supabase environment variables are missing in createClient (server).");
        return createServerClient("https://placeholder.supabase.co", "placeholder", {
            cookies: {
                getAll() { return []; },
                setAll() { }
            }
        });
    }

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
                    // The `setAll` method was called from a Server Component.
                }
            },
        },
    });
}

/**
 * Creates a Supabase client with the service role key for admin operations.
 * Use this only in API routes or Server Actions where needed, and never expose to the client.
 */
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        console.warn("Building: admin environment variables are missing in createAdminClient.");
        return createServerClient("https://placeholder.supabase.co", "placeholder", {
            cookies: {
                getAll() { return []; },
                setAll() { }
            }
        });
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
