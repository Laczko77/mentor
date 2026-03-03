import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireMentor, handleApiError } from "@/lib/server-auth";

// PUT - Mentor updates their own monthly hour quota
export async function PUT(request: NextRequest) {
    try {
        const user = await requireMentor();
        const body = await request.json();
        const { monthly_hour_quota } = body;

        if (monthly_hour_quota === undefined || monthly_hour_quota < 0) {
            throw new Error("Érvényes órakeret megadása kötelező");
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from("profiles")
            .update({ monthly_hour_quota })
            .eq("id", user.id)
            .select("monthly_hour_quota")
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}

// GET - Get mentor's current quota info
export async function GET() {
    try {
        const user = await requireMentor();
        const supabase = createAdminClient();

        // Get mentor's quota
        const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("monthly_hour_quota")
            .eq("id", user.id)
            .single();

        if (profileErr) throw profileErr;

        // Get used hours this month based on application tz
        const nowIso = new Date().toISOString();
        const startOfMonthIso = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const { data: monthSessions, error: usedErr } = await supabase
            .from("sessions")
            .select("duration_min")
            .eq("mentor_id", user.id)
            .gte("end_time", startOfMonthIso)
            .lt("end_time", nowIso)
            .neq("status", "cancelled");

        const quota = profile?.monthly_hour_quota || 54;
        const used = monthSessions ? monthSessions.reduce((acc: number, s: any) => acc + (s.duration_min || 0), 0) / 60 : 0;

        return NextResponse.json({
            monthly_quota: quota,
            used_hours: Number(used.toFixed(2)),
            remaining_hours: Number(Math.max(0, quota - used).toFixed(2)),
            usage_percent: Number(Math.min(100, (used / quota) * 100).toFixed(1)),
        });
    } catch (error) {
        return handleApiError(error);
    }
}
