import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireMentor, handleApiError } from "@/lib/server-auth";

export async function GET() {
    try {
        const user = await requireMentor();
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from("session_templates")
            .select("*")
            .eq("mentor_id", user.id)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return NextResponse.json(data || []);
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
            .from("session_templates")
            .insert({
                mentor_id: user.id,
                name: body.name,
                title: body.title,
                type: body.type,
                duration_min: body.duration_min || 60,
                max_slots: body.max_slots || 1,
                location_note: body.location_note,
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
