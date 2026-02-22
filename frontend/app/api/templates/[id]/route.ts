import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireMentor, handleApiError } from "@/lib/server-auth";
import { addMinutes, parseISO } from "date-fns";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireMentor();
        const id = (await params).id;
        const supabase = createAdminClient();

        const { data: existing } = await supabase
            .from("session_templates")
            .select("mentor_id")
            .eq("id", id)
            .single();

        if (!existing) throw new Error("Sablon nem található");
        if (existing.mentor_id !== user.id) throw new Error("Forbidden: Not your template");

        const { error } = await supabase.from("session_templates").delete().eq("id", id);
        if (error) throw error;

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireMentor();
        const id = (await params).id;
        const body = await request.json();
        const supabase = createAdminClient();

        const { data: tpl, error: tplError } = await supabase
            .from("session_templates")
            .select("*")
            .eq("id", id)
            .eq("mentor_id", user.id)
            .single();

        if (tplError || !tpl) throw new Error("Sablon nem található");

        const startTime = body.start_time;
        if (!startTime) throw new Error("start_time szükséges");

        const startDt = parseISO(startTime);
        const endDt = addMinutes(startDt, tpl.duration_min);

        const { data, error } = await supabase
            .from("sessions")
            .insert({
                mentor_id: user.id,
                title: tpl.title,
                type: tpl.type,
                start_time: startDt.toISOString(),
                end_time: endDt.toISOString(),
                duration_min: tpl.duration_min,
                max_slots: tpl.max_slots,
                location_note: tpl.location_note,
                status: "open",
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
