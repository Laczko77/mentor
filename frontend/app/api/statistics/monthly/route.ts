import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireMentor, handleApiError } from "@/lib/server-auth";

export async function GET() {
    try {
        const user = await requireMentor();
        const supabase = createAdminClient();

        // Run both queries in parallel
        const [sessionsResult, bookingsResult] = await Promise.all([
            supabase.from("sessions").select("id, start_time, type, status").eq("mentor_id", user.id),
            supabase.from("bookings").select("session_id, status, sessions!inner(mentor_id)").eq("sessions.mentor_id", user.id).eq("status", "accepted"),
        ]);

        if (sessionsResult.error) throw sessionsResult.error;
        const sessions = sessionsResult.data || [];

        // Build accepted bookings map
        const acceptedBySession: Record<string, number> = {};
        (bookingsResult.data || []).forEach((b: any) => {
            acceptedBySession[b.session_id] = (acceptedBySession[b.session_id] || 0) + 1;
        });

        // Group by month
        const monthly: Record<string, any> = {};
        sessions.forEach((s: any) => {
            const monthKey = s.start_time.substring(0, 7);
            if (!monthly[monthKey]) {
                monthly[monthKey] = {
                    month: monthKey,
                    total_sessions: 0,
                    individual: 0,
                    group: 0,
                    accepted_bookings: 0,
                    cancelled: 0,
                };
            }
            const m = monthly[monthKey];
            m.total_sessions += 1;
            if (s.type === "individual") m.individual += 1;
            else m.group += 1;

            if (s.status === "cancelled") m.cancelled += 1;
            m.accepted_bookings += acceptedBySession[s.id] || 0;
        });

        const result = Object.values(monthly).sort((a: any, b: any) => a.month.localeCompare(b.month));
        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
