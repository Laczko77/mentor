import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireMentor, handleApiError } from "@/lib/server-auth";
import { addDays, differenceInMinutes } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { parseLocalTime } from "@/lib/timezone";

export async function POST(request: NextRequest) {
    try {
        const user = await requireMentor();
        const body = await request.json();

        if (!["weekly", "biweekly"].includes(body.recurrence_rule)) {
            throw new Error("recurrence_rule: 'weekly' vagy 'biweekly'");
        }

        const weeks = body.weeks || 4;
        if (weeks < 1 || weeks > 12) {
            throw new Error("weeks: 1–12");
        }

        const supabase = createAdminClient();
        const groupId = uuidv4();
        const intervalDays = body.recurrence_rule === "weekly" ? 7 : 14;

        const startDt = parseLocalTime(body.start_time);
        const endDt = parseLocalTime(body.end_time);
        const durationMin = differenceInMinutes(endDt, startDt);

        const sessionsToInsert = [];
        for (let i = 0; i < weeks; i++) {
            const offset = i * intervalDays;
            const sStart = addDays(startDt, offset);
            const sEnd = addDays(endDt, offset);

            sessionsToInsert.push({
                mentor_id: user.id,
                title: body.title,
                type: body.type,
                start_time: sStart.toISOString(),
                end_time: sEnd.toISOString(),
                max_slots: body.max_slots || 1,
                location_note: body.location_note,
                status: "open",
                recurrence_rule: body.recurrence_rule,
                recurrence_group_id: groupId,
            });
        }

        const { data, error } = await supabase.from("sessions").insert(sessionsToInsert).select();
        if (error) throw error;

        return NextResponse.json({
            recurrence_group_id: groupId,
            count: data?.length || 0,
            sessions: data || [],
        }, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
