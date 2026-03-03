import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireMentor, handleApiError } from "@/lib/server-auth";
import { calculateRequiredHours } from "@/lib/hours-calculator";

export async function GET() {
    try {
        const user = await requireMentor();
        const supabase = createAdminClient();
        const nowIso = new Date().toISOString();

        // Run all independent DB queries in parallel
        const [
            menteesResult,
            hoursResult,
            pendingResult,
            upcomingResult,
            mentorProfileResult,
            usedHoursResult,
        ] = await Promise.all([
            supabase.from("profiles").select("*").eq("role", "mentee"),
            supabase.from("completed_hours").select("*"),
            supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
            supabase.from("sessions").select("*", { count: "exact", head: true }).eq("mentor_id", user.id).gte("start_time", nowIso).neq("status", "cancelled"),
            supabase.from("profiles").select("monthly_hour_quota").eq("id", user.id).single(),
            supabase.from("sessions").select("duration_min").eq("mentor_id", user.id).gte("end_time", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()).lt("end_time", nowIso).neq("status", "cancelled"),
        ]);

        if (menteesResult.error) throw menteesResult.error;
        if (hoursResult.error) throw hoursResult.error;

        const mentees = menteesResult.data;
        const hours = hoursResult.data;

        const hoursMap = new Map<string, number>(
            (hours || []).map((h: any) => [h.mentee_id, parseFloat(h.completed_hours)])
        );

        const pendingCount = pendingResult.count;
        const upcomingCount = upcomingResult.count;

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

        const quota = mentorProfileResult.data?.monthly_hour_quota || 54;

        let calculatedUsedHours = 0;
        if (usedHoursResult.data) {
            calculatedUsedHours = usedHoursResult.data.reduce((acc: number, s: any) => acc + (s.duration_min || 0), 0) / 60;
        }
        const usedHours = calculatedUsedHours;

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
