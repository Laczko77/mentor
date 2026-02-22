import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        if (typeof window === "undefined") {
            console.warn("Building: Supabase environment variables are missing during server-side execution/build.");
            // Return a minimal client that won't crash immediately but will allow the build to proceed
            // Note: This might still fail later if data fetching is required for static paths
            return createBrowserClient("https://placeholder.supabase.co", "placeholder");
        }
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    return createBrowserClient(url, anonKey);
}
