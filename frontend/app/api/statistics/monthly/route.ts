import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireMentor, handleApiError } from "@/lib/server-auth";

export async function GET() {
    try {
        const user = await requireMentor();
        const supabase = createAdminClient();

        // 1. All mentor sessions
        const { data: sessions, error: sessionsError } = await supabase
            .from("sessions")
            .select("id, start_time, type, status")
            .eq("mentor_id", user.id);

        if (sessionsError) throw sessionsError;

        const sessionIds = (sessions || []).map((s: any) => s.id);
        let acceptedBySession: Record<string, number> = {};

        if (sessionIds.length > 0) {
            // 2. All accepted bookings for those sessions
            const { data: bookings } = await supabase
                .from("bookings")
                .select("session_id, status")
                .in("session_id", sessionIds)
                .eq("status", "accepted");

            (bookings || []).forEach((b: any) => {
                acceptedBySession[b.session_id] = (acceptedBySession[b.session_id] || 0) + 1;
            });
        }

        // 3. Group by month
        const monthly: Record<string, any> = {};
        (sessions || []).forEach((s: any) => {
            const monthKey = s.start_time.substring(0, 7); // YYYY-MM
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
