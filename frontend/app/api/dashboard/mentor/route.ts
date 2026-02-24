import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireMentor, handleApiError } from "@/lib/server-auth";
import { calculateRequiredHours } from "@/lib/hours-calculator";

export async function GET() {
    try {
        const user = await requireMentor();
        const supabase = createAdminClient();

        // Get all mentees
        const { data: mentees, error: menteesError } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "mentee");

        if (menteesError) throw menteesError;

        // Get completed hours from view (now monthly!)
        const { data: hours, error: hoursError } = await supabase
            .from("completed_hours")
            .select("*");

        if (hoursError) throw hoursError;

        const hoursMap = new Map<string, number>(
            (hours || []).map((h: any) => [h.mentee_id, parseFloat(h.completed_hours)])
        );

        // Get pending bookings count
        const { count: pendingCount } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending");

        // Get upcoming sessions count
        const nowIso = new Date().toISOString();
        const { count: upcomingCount } = await supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("mentor_id", user.id)
            .gte("start_time", nowIso)
            .neq("status", "cancelled");

        // Build mentee hours summary
        const menteeHours = (mentees || []).map((m: any) => {
            const required = calculateRequiredHours(m.joined_at, m.required_hours);
            const completed = hoursMap.get(m.id) || 0;
            const remaining = Math.max(0, required - completed);
            const progress = required > 0 ? (completed / required) * 100 : 100;

            return {
                mentee_id: m.id,
                full_name: m.full_name,
                email: m.email,
                joined_at: m.joined_at,
                required_hours: required,
                completed_hours: Number(completed.toFixed(2)),
                remaining_hours: Number(remaining.toFixed(2)),
                progress_percent: Number(Math.min(100, progress).toFixed(1)),
            };
        });

        // Get mentor's hour quota
        const { data: mentorProfile } = await supabase
            .from("profiles")
            .select("monthly_hour_quota")
            .eq("id", user.id)
            .single();

        const quota = mentorProfile?.monthly_hour_quota || 54;

        // Get mentor's used hours this month
        const { data: usedData } = await supabase
            .from("completed_hours_mentor")
            .select("used_hours")
            .eq("mentor_id", user.id)
            .single();

        const usedHours = usedData?.used_hours ? parseFloat(usedData.used_hours) : 0;

        return NextResponse.json({
            total_mentees: mentees?.length || 0,
            pending_bookings: pendingCount || 0,
            upcoming_sessions: upcomingCount || 0,
            mentee_hours: menteeHours,
            // Mentor quota info
            monthly_quota: quota,
            used_hours: Number(usedHours.toFixed(2)),
            remaining_quota: Number(Math.max(0, quota - usedHours).toFixed(2)),
            quota_usage_percent: Number(Math.min(100, (usedHours / quota) * 100).toFixed(1)),
        });
    } catch (error) {
        return handleApiError(error);
    }
}
