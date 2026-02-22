import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAuth, requireMentor, handleApiError } from "@/lib/server-auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const sessionId = (await params).id;
        const supabase = createAdminClient();

        // 1. Verify session exists
        const { data: session } = await supabase
            .from("sessions")
            .select("id")
            .eq("id", sessionId)
            .single();

        if (!session) throw new Error("Session not found");

        let query = supabase
            .from("session_notes")
            .select("*, profiles(full_name, email)")
            .eq("session_id", sessionId);

        if (user.role === "mentee") {
            query = query.eq("mentee_id", user.id);
        }

        const { data, error } = await query.order("created_at", { ascending: true });
        if (error) throw error;

        const enrichedNotes = (data || []).map((n: any) => {
            const profile = n.profiles;
            const { profiles, ...rest } = n;
            return {
                ...rest,
                mentee_name: profile?.full_name || "",
                mentee_email: profile?.email || "",
            };
        });

        return NextResponse.json(enrichedNotes);
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
        const sessionId = (await params).id;
        const body = await request.json();
        const supabase = createAdminClient();

        // 1. Verify session ownership
        const { data: session } = await supabase
            .from("sessions")
            .select("mentor_id")
            .eq("id", sessionId)
            .single();

        if (!session) throw new Error("Session not found");
        if (session.mentor_id !== user.id) throw new Error("Forbidden: Not your session");

        // 2. Verify mentee has accepted booking
        const { data: booking } = await supabase
            .from("bookings")
            .select("id")
            .eq("session_id", sessionId)
            .eq("mentee_id", body.mentee_id)
            .eq("status", "accepted")
            .single();

        if (!booking) throw new Error("Mentee has no accepted booking for this session");

        // 3. Upsert note
        const { data: existing } = await supabase
            .from("session_notes")
            .select("id")
            .eq("session_id", sessionId)
            .eq("mentee_id", body.mentee_id)
            .single();

        let result;
        if (existing) {
            result = await supabase
                .from("session_notes")
                .update({ content: body.content, updated_at: new Date().toISOString() })
                .eq("id", existing.id)
                .select()
                .single();
        } else {
            result = await supabase
                .from("session_notes")
                .insert({
                    session_id: sessionId,
                    mentee_id: body.mentee_id,
                    content: body.content,
                })
                .select()
                .single();
        }

        if (result.error) throw result.error;
        return NextResponse.json(result.data);
    } catch (error) {
        return handleApiError(error);
    }
}
