import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireMentor, handleApiError } from "@/lib/server-auth";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireMentor();
        const bookingId = (await params).id;
        const body = await request.json();
        const supabase = createAdminClient();

        if (!["accepted", "rejected"].includes(body.status)) {
            return NextResponse.json({ detail: "Invalid status" }, { status: 400 });
        }

        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .select("*, sessions(title, mentor_id)")
            .eq("id", bookingId)
            .single();

        if (bookingError || !booking) throw new Error("Booking not found");
        if (booking.sessions.mentor_id !== user.id) throw new Error("Forbidden: Not your session");

        const { data, error } = await supabase
            .from("bookings")
            .update({
                status: body.status,
                mentor_note: body.mentor_note,
            })
            .eq("id", bookingId)
            .select()
            .single();

        if (error) throw error;

        // Notify mentee
        const type = body.status === "accepted" ? "booking_accepted" : "booking_rejected";
        const title = body.status === "accepted" ? "Jelentkezés elfogadva" : "Jelentkezés elutasítva";

        await supabase.from("notifications").insert({
            user_id: booking.mentee_id,
            type,
            title,
            message: `A jelentkezésed a(z) "${booking.sessions.title}" sessionre ${body.status === "accepted" ? "el lett fogadva" : "el lett utasítva"}.`,
            related_id: booking.session_id,
        });

        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}
