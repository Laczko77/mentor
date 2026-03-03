import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireMentor, handleApiError } from "@/lib/server-auth";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireMentor();
        const blockId = (await params).id;
        const supabase = createAdminClient();

        // Check if block exists and belongs to the mentor
        const { data: existing, error: fetchError } = await supabase
            .from("mentor_schedule")
            .select("id, mentor_id")
            .eq("id", blockId)
            .single();

        if (fetchError || !existing) throw new Error("Műszak nem található");
        if (existing.mentor_id !== user.id) throw new Error("Ezt a műszakot nem te hoztad létre");

        const { error } = await supabase
            .from("mentor_schedule")
            .delete()
            .eq("id", blockId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireMentor();
        const blockId = (await params).id;
        const body = await request.json();
        const { type, start_time, end_time, title } = body;

        const supabase = createAdminClient();

        // Check ownership
        const { data: existing, error: fetchError } = await supabase
            .from("mentor_schedule")
            .select("id, mentor_id")
            .eq("id", blockId)
            .single();

        if (fetchError || !existing) throw new Error("Műszak nem található");
        if (existing.mentor_id !== user.id) throw new Error("Ezt a műszakot nem te hoztad létre");

        const { data, error } = await supabase
            .from("mentor_schedule")
            .update({
                type,
                start_time,
                end_time,
                title: title || type
            })
            .eq("id", blockId)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}
