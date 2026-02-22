import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAuth, requireMentor, handleApiError } from "@/lib/server-auth";

// Mentors can create their own blocks
export async function POST(request: NextRequest) {
    try {
        const user = await requireMentor();
        const body = await request.json();
        const { type, start_time, end_time, title } = body;

        if (!["work", "rest", "vacation"].includes(type)) {
            throw new Error("Érvénytelen blokk típus");
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from("mentor_schedule")
            .insert({
                mentor_id: user.id,
                type,
                start_time,
                end_time,
                title: title || type
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}

// Anyone can GET schedules, optionally filtered by mentor_id
export async function GET(request: NextRequest) {
    try {
        await requireAuth();
        const supabase = createAdminClient();
        const searchParams = request.nextUrl.searchParams;
        const mentorId = searchParams.get("mentor_id");

        let query = supabase.from("mentor_schedule").select("*");
        if (mentorId) {
            query = query.eq("mentor_id", mentorId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}
