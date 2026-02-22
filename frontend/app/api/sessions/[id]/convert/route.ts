import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireMentor, handleApiError } from "@/lib/server-auth";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireMentor();
        const id = (await params).id;
        const body = await request.json();
        const maxSlots = body.max_slots;

        if (!maxSlots || typeof maxSlots !== "number" || maxSlots < 2) {
            throw new Error("Érvénytelen résztvevői szám");
        }

        const supabase = createAdminClient();

        const { data: session } = await supabase
            .from("sessions")
            .select("mentor_id, type, status")
            .eq("id", id)
            .single();

        if (!session) throw new Error("A session nem található");
        if (session.mentor_id !== user.id) throw new Error("Csak a saját sessionödet alakíthatod át");
        if (session.status !== "open") throw new Error("Csak nyitott sessiont lehet átalakítani");
        if (session.type !== "individual") throw new Error("Ez a session már nem egyéni");

        const { data, error } = await supabase
            .from("sessions")
            .update({
                type: "group",
                max_slots: maxSlots
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}
