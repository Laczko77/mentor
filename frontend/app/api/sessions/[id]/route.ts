import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAuth, requireMentor, handleApiError } from "@/lib/server-auth"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;
        const supabase = createAdminClient();

        const { data: session, error: sessionError } = await supabase
            .from("sessions")
            .select("*")
            .eq("id", id)
            .single();

        if (sessionError) throw sessionError;

        const { data: bookings, error: bookingsError } = await supabase
            .from("bookings")
            .select("*, profiles(full_name, email)")
            .eq("session_id", id);

        if (bookingsError) throw bookingsError;

        const enrichedBookings = bookings.map((b: any) => {
            const profile = b.profiles;
            const { profiles, ...rest } = b;
            return {
                ...rest,
                mentee_name: profile?.full_name || "",
                mentee_email: profile?.email || "",
            };
        });

        const acceptedCount = bookings.filter((b: any) => b.status === "accepted").length;

        return NextResponse.json({
            ...session,
            bookings: enrichedBookings,
            booked_count: acceptedCount,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireMentor();
        const { id } = await params;
        const body = await request.json();
        const supabase = createAdminClient();

        // Check ownership
        const { data: existing } = await supabase
            .from("sessions")
            .select("mentor_id, title")
            .eq("id", id)
            .single();

        if (!existing) throw new Error("Session not found");
        if (existing.mentor_id !== user.id) throw new Error("Forbidden: Not your session");

        const { data, error } = await supabase
            .from("sessions")
            .update(body)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        // If cancelled, notify
        if (body.status === "cancelled") {
            const { data: bookings } = await supabase
                .from("bookings")
                .select("mentee_id")
                .eq("session_id", id)
                .in("status", ["pending", "accepted"]);

            for (const b of (bookings || [])) {
                await supabase.from("notifications").insert({
                    user_id: b.mentee_id,
                    type: "session_cancelled",
                    title: "Session törölve",
                    message: `A(z) "${existing.title}" session törölve lett.`,
                    related_id: id,
                });
            }
        } else {
            // If updated (not cancelled), notify applicants
            const { data: bookings } = await supabase
                .from("bookings")
                .select("mentee_id")
                .eq("session_id", id)
                .in("status", ["pending", "accepted"]);

            for (const b of (bookings || [])) {
                await supabase.from("notifications").insert({
                    user_id: b.mentee_id,
                    type: "session_updated",
                    title: "Időpont módosítás",
                    message: `Az időpont módosult a következő sessionben: "${existing.title}".`,
                    related_id: id,
                });
            }
        }

        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireMentor();
        const { id } = await params;
        const supabase = createAdminClient();

        const { data: existing } = await supabase
            .from("sessions")
            .select("mentor_id, title")
            .eq("id", id)
            .single();

        if (!existing) throw new Error("Session not found");
        if (existing.mentor_id !== user.id) throw new Error("Forbidden: Not your session");

        // Notify and delete (cascading handled by DB usually, but we notify first)
        const { data: bookings } = await supabase
            .from("bookings")
            .select("mentee_id")
            .eq("session_id", id)
            .in("status", ["pending", "accepted"]);

        for (const b of (bookings || [])) {
            await supabase.from("notifications").insert({
                user_id: b.mentee_id,
                type: "session_cancelled",
                title: "Session törölve",
                message: `A(z) "${existing.title}" session törölve lett.`,
                related_id: null,
            });
        }

        const { error } = await supabase.from("sessions").delete().eq("id", id);
        if (error) throw error;

        return NextResponse.json({ message: "Session deleted" });
    } catch (error) {
        return handleApiError(error);
    }
}
