import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAuth, requireMentee, requireMentor, handleApiError } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const supabase = createAdminClient();

        if (user.role === "mentor") {
            const { data, error } = await supabase
                .from("group_session_votes")
                .select("*, mentee:profiles!group_session_votes_mentee_id_fkey(full_name)")
                .eq("mentor_id", user.id);

            if (error) throw error;
            return NextResponse.json(data);
        } else {
            const { data, error } = await supabase
                .from("group_session_votes")
                .select("*")
                .eq("mentee_id", user.id)
                .maybeSingle();

            if (error) throw error;
            return NextResponse.json(data); // returns null if no vote yet
        }
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireMentee();
        const body = await request.json();
        const supabase = createAdminClient();

        // Get the mentee's mentor_id
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("mentor_id")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;
        if (!profile.mentor_id) throw new Error("Még nincs mentorod!");

        const { data, error } = await supabase
            .from("group_session_votes")
            .upsert({
                mentee_id: user.id,
                mentor_id: profile.mentor_id,
                preferred_days: body.preferred_days || [],
                preferred_times: body.preferred_times || [],
                preferred_durations: body.preferred_durations || [],
            }, { onConflict: 'mentee_id' })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await requireMentor();
        const supabase = createAdminClient();

        const { error } = await supabase
            .from("group_session_votes")
            .delete()
            .eq("mentor_id", user.id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error);
    }
}
