import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAuth, handleApiError } from "@/lib/server-auth";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const bookingId = (await params).id;
        const supabase = createAdminClient();

        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .select("*, sessions(mentor_id, title)")
            .eq("id", bookingId)
            .single();

        if (bookingError || !booking) throw new Error("Booking not found");

        // Allow mentee to cancel their own pending booking
        if (booking.mentee_id !== user.id) {
            throw new Error("Forbidden: Not your booking");
        }

        if (booking.status !== "pending" && booking.status !== "accepted") {
            throw new Error("Csak függőben lévő vagy elfogadott jelentkezést lehet lemondani");
        }

        const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
        if (error) throw error;

        // Notify mentor
        await supabase.from("notifications").insert({
            user_id: booking.sessions.mentor_id,
            type: "booking_cancelled",
            title: "Foglalás lemondva",
            message: `${user.full_name} lemondta a jelentkezését a(z) "${booking.sessions.title}" alkalmra.`,
            related_id: booking.session_id,
        });

        return NextResponse.json({ message: "Booking cancelled" });
    } catch (error) {
        return handleApiError(error);
    }
}
