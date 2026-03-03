import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAuth, requireMentor, handleApiError } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");
        const status = searchParams.get("status");
        const dateFrom = searchParams.get("date_from");
        const dateTo = searchParams.get("date_to");
        const includePast = searchParams.get("include_past") === "true";

        const supabase = createAdminClient();
        let query = supabase.from("sessions").select("*, bookings(mentee_id, status)");

        if (type) query = query.eq("type", type);
        if (status) query = query.eq("status", status);
        if (dateFrom) query = query.gte("start_time", dateFrom);
        if (dateTo) query = query.lte("start_time", dateTo);

        if (!includePast) {
            query = query.gte("start_time", new Date().toISOString());
        }

        query = query.order("start_time", { ascending: true });
        const { data, error } = await query;

        if (error) throw error;

        const sessions = data.map((s: any) => {
            const acceptedBookings = s.bookings?.filter((b: any) => b.status === 'accepted') || [];
            const bookingsCount = acceptedBookings.length;
            const has_booked_by_me = s.bookings?.some((b: any) => b.mentee_id === user.id && ['pending', 'accepted'].includes(b.status)) || false;
            const { bookings, ...rest } = s;
            return { ...rest, booked_count: bookingsCount, has_booked_by_me };
        });

        const showAllForCalendar = searchParams.get("show_all_for_calendar") === "true";

        let finalSessions = sessions;
        if (user.role === "mentee" && !showAllForCalendar) {
            finalSessions = sessions.filter((s: any) => s.status === "open" || s.has_booked_by_me);
        }

        return NextResponse.json(finalSessions);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireMentor();
        const body = await request.json();
        const supabase = createAdminClient();

        // Check for overlapping sessions
        const { data: overlapping, error: overlapError } = await supabase
            .from("sessions")
            .select("id")
            .eq("mentor_id", user.id)
            .lt("start_time", body.end_time)
            .gt("end_time", body.start_time)
            .not("status", "eq", "cancelled")
            .limit(1);

        if (overlapError) throw overlapError;
        if (overlapping && overlapping.length > 0) {
            throw new Error("Ebben az időpontban már van egy meghirdetett alkalmad (vagy átfedésben van egy másik eseményeddel).");
        }

        const { data, error } = await supabase
            .from("sessions")
            .insert({
                mentor_id: user.id,
                title: body.title,
                type: body.type,
                start_time: body.start_time,
                end_time: body.end_time,
                max_slots: body.max_slots,
                location_note: body.location_note,
                status: "open",
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}
