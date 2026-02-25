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

        if (!session) throw new Error("Az alkalom nem található");
        if (session.status !== "open") throw new Error("Ez az alkalom már nem foglalható");

        // Check if mentee already has an active booking for this session
        const { data: existingBooking } = await supabase
            .from("bookings")
            .select("id, status")
            .eq("session_id", sessionId)
            .eq("mentee_id", user.id)
            .in("status", ["pending", "accepted"])
            .maybeSingle();

        if (existingBooking) {
            throw new Error("Már jelentkeztél erre az alkalomra");
        }

        // Check available slots – only count active (pending/accepted) bookings
        // Note: DB trigger also enforces this atomically to prevent race conditions
        const { count } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("session_id", sessionId)
            .in("status", ["pending", "accepted"]);

        if ((count || 0) >= session.max_slots) {
            throw new Error("Az alkalom megtelt");
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

        if (error) {
            // Handle race condition: another user booked the last slot between our check and insert
            if (error.code === "P0001" && error.message?.includes("megtelt")) {
                throw new Error("Az alkalom éppen megtelt, próbáld újra");
            }
            // Handle duplicate booking from simultaneous clicks (DB unique constraint)
            if (error.code === "23505") {
                throw new Error("Már jelentkeztél erre az alkalomra");
            }
            throw error;
        }

        // Notify mentor
        await supabase.from("notifications").insert({
            user_id: session.mentor_id,
            type: "booking_new",
            title: "Új jelentkezés",
            message: `${user.full_name} jelentkezett a(z) "${session.title}" alkalmra.`,
            related_id: sessionId,
        });

        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}
