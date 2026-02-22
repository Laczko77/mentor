import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAuth, requireMentor, handleApiError } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
    try {
        await requireAuth();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");
        const status = searchParams.get("status");
        const dateFrom = searchParams.get("date_from");
        const dateTo = searchParams.get("date_to");

        const supabase = createAdminClient();
        let query = supabase.from("sessions").select("*, bookings(count)");

        if (type) query = query.eq("type", type);
        if (status) query = query.eq("status", status);
        if (dateFrom) query = query.gte("start_time", dateFrom);
        if (dateTo) query = query.lte("start_time", dateTo);

        query = query.order("start_time", { ascending: true });
        const { data, error } = await query;

        if (error) throw error;

        const sessions = data.map((s: any) => {
            const bookingsCount = s.bookings?.[0]?.count || 0;
            const { bookings, ...rest } = s;
            return { ...rest, booked_count: bookingsCount };
        });

        return NextResponse.json(sessions);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireMentor();
        const body = await request.json();
        const supabase = createAdminClient();

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
