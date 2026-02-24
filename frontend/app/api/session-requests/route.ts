import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAuth, handleApiError } from "@/lib/server-auth";
import { createNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const supabase = createAdminClient();

        let query = supabase.from("session_requests").select(`
            id, mentor_id, mentee_id, title, proposed_start_time, proposed_end_time, status, created_at,
            mentee:profiles!session_requests_mentee_id_fkey(full_name, email),
            mentor:profiles!session_requests_mentor_id_fkey(full_name, email)
        `).order("created_at", { ascending: false });

        if (user.role === "mentor") {
            query = query.eq("mentor_id", user.id).eq("status", "pending");
        } else {
            query = query.eq("mentee_id", user.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        if (user.role !== "mentee") throw new Error("Csak mentoráltak kezdeményezhetnek időpontot");

        const body = await request.json();
        const { mentor_id, title, proposed_start_time, proposed_end_time } = body;

        if (!mentor_id || !title || !proposed_start_time || !proposed_end_time) {
            throw new Error("Minden mező kitöltése kötelező");
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from("session_requests")
            .insert({
                mentee_id: user.id,
                mentor_id,
                title,
                proposed_start_time,
                proposed_end_time,
                status: "pending",
            })
            .select()
            .single();

        if (error) throw error;

        // Notify mentor about the new session request
        await createNotification(supabase, {
            user_id: mentor_id,
            type: "session_request_new",
            title: "Új időpont kérelem",
            message: `${user.full_name} időpontot javasolt: ${title}`,
            related_id: data.id,
        });

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
