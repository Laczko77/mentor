import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireMentor, handleApiError } from "@/lib/server-auth";

export async function GET() {
    try {
        const user = await requireMentor();
        const supabase = createAdminClient();

        // Get all accepted bookings for this mentor's sessions
        // We filter by session.mentor_id using .eq on joined table
        const { data: bookings, error } = await supabase
            .from("bookings")
            .select(`
                mentee_id,
                profiles(full_name),
                sessions!inner(title, start_time, duration_min, mentor_id)
            `)
            .eq("sessions.mentor_id", user.id)
            .eq("status", "accepted");

        if (error) throw error;

        const trends: Record<string, any> = {};
        (bookings || []).forEach((b: any) => {
            const menteeId = b.mentee_id;
            const session = b.sessions;
            const profile = b.profiles;

            const monthKey = session.start_time.substring(0, 7); // YYYY-MM
            const durationHours = session.duration_min / 60.0;

            if (!trends[menteeId]) {
                trends[menteeId] = {
                    mentee_id: menteeId,
                    full_name: profile?.full_name || "Ismeretlen",
                    months: {} as Record<string, number>,
                };
            }

            const months = trends[menteeId].months;
            months[monthKey] = (months[monthKey] || 0) + durationHours;
        });

        const result = Object.values(trends).map((t: any) => {
            const monthlyData = Object.entries(t.months)
                .map(([k, v]) => ({ month: k, hours: Number((v as number).toFixed(1)) }))
                .sort((a, b) => a.month.localeCompare(b.month));

            return {
                mentee_id: t.mentee_id,
                full_name: t.full_name,
                monthly_hours: monthlyData,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
