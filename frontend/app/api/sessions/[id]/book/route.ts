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

        // Deadline check function (using current Budapest time for fairness)
        const now = new Date();
        const start = new Date(session.start_time);

        let deadlineDay = new Date(start);
        const dayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, 6 = Saturday

        if (dayOfWeek === 1 || dayOfWeek === 6 || dayOfWeek === 0) {
            const diffToFriday = dayOfWeek === 1 ? 3 : dayOfWeek === 6 ? 1 : 2;
            deadlineDay.setDate(start.getDate() - diffToFriday);
        } else {
            deadlineDay.setDate(start.getDate() - 1);
        }

        // Apply local 13:00 to the deadline date
        deadlineDay.setHours(13, 0, 0, 0);

        if (now.getTime() > deadlineDay.getTime()) {
            const deadlineStr = deadlineDay.toLocaleString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            throw new Error(`A jelentkezési határidő lejárt (${deadlineStr}).`);
        }

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

        // Check available slots – only count accepted bookings
        // Note: DB trigger also enforces this atomically to prevent race conditions
        const { count } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("session_id", sessionId)
            .eq("status", "accepted");

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
