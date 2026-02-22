import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireMentee, handleApiError } from "@/lib/server-auth";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireMentee();
        const sessionId = (await params).id;
        const body = await request.json();
        const supabase = createAdminClient();

        // Check if session exists and is open
        const { data: session } = await supabase
            .from("sessions")
            .select("*")
            .eq("id", sessionId)
            .single();

        if (!session) throw new Error("Session not found");
        if (session.status !== "open") throw new Error("Session is not open for booking");

        // Check slots
        const { count } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("session_id", sessionId);

        if ((count || 0) >= session.max_slots) {
            throw new Error("Session is full");
        }

        const { data, error } = await supabase
            .from("bookings")
            .insert({
                session_id: sessionId,
                mentee_id: user.id,
                status: "pending",
                note: body.note,
            })
            .select()
            .single();

        if (error) throw error;

        // Notify mentor
        await supabase.from("notifications").insert({
            user_id: session.mentor_id,
            type: "booking_new",
            title: "Új jelentkezés",
            message: `${user.email} jelentkezett a(z) "${session.title}" sessionre.`,
            related_id: sessionId,
        });

        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}
