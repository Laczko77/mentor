import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAuth, handleApiError } from "@/lib/server-auth";
import { createNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const supabase = createAdminClient();

        let query = supabase.from("session_requests").select(`
            id, mentor_id, mentee_id, title, proposed_start_time, proposed_end_time, status, created_at,
            mentee:profiles!session_requests_mentee_id_fkey(full_name, email),
            mentor:profiles!session_requests_mentor_id_fkey(full_name, email)
        `).order("created_at", { ascending: false });

        if (user.role === "mentor") {
            query = query
                .eq("mentor_id", user.id)
                .eq("status", "pending")
                .gte("proposed_start_time", new Date().toISOString());
        } else {
            query = query.eq("mentee_id", user.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        if (user.role !== "mentee") throw new Error("Csak mentoráltak kezdeményezhetnek időpontot");

        const body = await request.json();
        const { title, proposed_start_time, proposed_end_time } = body;
        let { mentor_id } = body;

        if (!title || !proposed_start_time || !proposed_end_time) {
            throw new Error("Minden mező kitöltése kötelező");
        }

        // Auto-resolve the single mentor if mentor_id is not provided
        if (!mentor_id) {
            const supabaseForMentor = createAdminClient();
            const { data: mentorData, error: mentorError } = await supabaseForMentor
                .from("profiles")
                .select("id")
                .eq("role", "mentor")
                .limit(1)
                .single();
            if (mentorError || !mentorData) throw new Error("Nem található mentor az adatbázisban");
            mentor_id = mentorData.id;
        }

        // Deadline check function (using current Budapest time for fairness)
        const now = new Date();
        const start = new Date(proposed_start_time);

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
            throw new Error(`A kérelmek leadási határideje lejárt (${deadlineStr}).`);
        }

        const supabase = createAdminClient();

        // Anti-spam check: Limit to 10 pending requests
        const { count: pendingCount, error: countError } = await supabase
            .from("session_requests")
            .select("*", { count: "exact", head: true })
            .eq("mentee_id", user.id)
            .eq("status", "pending");

        if (countError) throw countError;
        if ((pendingCount || 0) >= 10) {
            throw new Error("Egyszerre maximum 10 függőben lévő kérelmed lehet. Kérlek, várj, amíg valamelyiket elbírálják.");
        }

        const { data, error } = await supabase
            .from("session_requests")
            .insert({
                mentee_id: user.id,
                mentor_id,
                title,
                proposed_start_time,
                proposed_end_time,
                status: "pending",
            })
            .select()
            .single();

        if (error) throw error;

        // Notify mentor about the new session request
        await createNotification(supabase, {
            user_id: mentor_id,
            type: "session_request_new",
            title: "Új időpont kérelem",
            message: `${user.full_name} időpontot javasolt: ${title}`,
            related_id: data.id,
        });

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
