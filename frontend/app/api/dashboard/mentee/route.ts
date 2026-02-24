import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAuth, handleApiError } from "@/lib/server-auth";
import { calculateRequiredHours } from "@/lib/hours-calculator";

export async function GET() {
    try {
        const user = await requireAuth();
        const supabase = createAdminClient();

        // Get profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) throw new Error("Profile not found");

        const required = calculateRequiredHours(profile.joined_at, profile.required_hours);

        // Get completed hours
        const { data: hours } = await supabase
            .from("completed_hours")
            .select("*")
            .eq("mentee_id", user.id)
            .maybeSingle();

        const completed = hours ? parseFloat(hours.completed_hours) : 0;
        const remaining = Math.max(0, required - completed);
        const progress = required > 0 ? (completed / required) * 100 : 100;

        const nowIso = new Date().toISOString();

        // Get all bookings (including past ones) to separate them
        const { data: bookings } = await supabase
            .from("bookings")
            .select("*, sessions(*)")
            .eq("mentee_id", user.id)
            .in("status", ["pending", "accepted"]);

        const upcoming: any[] = [];
        const past: any[] = [];

        (bookings || []).forEach((b: any) => {
            const session = b.sessions;
            const entry = {
                booking_id: b.id,
                booking_status: b.status,
                session_title: session?.title || "",
                start_time: session?.start_time || "",
                end_time: session?.end_time || "",
                duration_min: session?.duration_min,
                location_note: session?.location_note || "",
                mentor_note: b.mentor_note || "",
            };

            if (session?.end_time > nowIso) {
                upcoming.push(entry);
            } else {
                past.push(entry);
            }
        });

        return NextResponse.json({
            required_hours: required,
            completed_hours: Number(completed.toFixed(2)),
            remaining_hours: Number(remaining.toFixed(2)),
            progress_percent: Number(Math.min(100, progress).toFixed(1)),
            upcoming_sessions: upcoming,
            past_sessions: past,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
