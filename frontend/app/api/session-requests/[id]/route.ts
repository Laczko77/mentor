import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAuth, handleApiError } from "@/lib/server-auth";
import { addMinutes, differenceInMinutes, parseISO } from "date-fns";
import { createNotification } from "@/lib/notifications";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const id = (await params).id;
        const body = await request.json();
        const status = body.status;

        if (user.role !== "mentor") throw new Error("Csak mentor bírálhat el kéréseket");
        if (!["accepted", "rejected"].includes(status)) throw new Error("Érvénytelen státusz");

        const supabase = createAdminClient();

        // fetch the request
        const { data: req, error: reqErr } = await supabase
            .from("session_requests")
            .select("*")
            .eq("id", id)
            .single();

        if (reqErr || !req) throw new Error("A kérés nem található");
        if (req.mentor_id !== user.id) throw new Error("Nincs jogosultságod");
        if (req.status !== "pending") throw new Error("A kérés már el van bírálva");

        // if accepted, create session and booking
        if (status === "accepted") {
            const finalStart = body.start_time || req.proposed_start_time;
            const finalEnd = body.end_time || req.proposed_end_time;
            const startDt = parseISO(finalStart);
            const endDt = parseISO(finalEnd);
            const dur = differenceInMinutes(endDt, startDt);

            // create session
            const { data: sessionData, error: sessionErr } = await supabase
                .from("sessions")
                .insert({
                    mentor_id: user.id,
                    title: req.title,
                    type: "individual",
                    start_time: finalStart,
                    end_time: finalEnd,
                    duration_min: dur > 0 ? dur : 60,
                    max_slots: 1,
                    location_note: "Saját igényelt időpont",
                    status: "closed", // immediately closed since it's full
                })
                .select()
                .single();

            if (sessionErr) throw sessionErr;

            // create booking
            const { error: bookingErr } = await supabase
                .from("bookings")
                .insert({
                    session_id: sessionData.id,
                    mentee_id: req.mentee_id,
                    status: "accepted",
                });
            if (bookingErr) throw bookingErr;

            // update request with the new times too, so mentees can see
            const { error: updErr } = await supabase
                .from("session_requests")
                .update({
                    status,
                    proposed_start_time: finalStart,
                    proposed_end_time: finalEnd,
                    updated_at: new Date().toISOString()
                })
                .eq("id", id);
            if (updErr) throw updErr;
        } else {
            // just update status
            const { error: updErr } = await supabase
                .from("session_requests")
                .update({ status, updated_at: new Date().toISOString() })
                .eq("id", id);
            if (updErr) throw updErr;
        }

        // Notify mentee about the decision
        await createNotification(supabase, {
            user_id: req.mentee_id,
            type: status === "accepted" ? "session_request_accepted" : "session_request_rejected",
            title: status === "accepted" ? "Időpont elfogadva ✅" : "Időpont elutasítva ❌",
            message: status === "accepted"
                ? `A mentorod elfogadta az időpontodat: ${req.title}`
                : `A mentorod elutasította az időpontodat: ${req.title}`,
            related_id: id,
        });

        return NextResponse.json({ success: true, status });
    } catch (error) {
        return handleApiError(error);
    }
}
