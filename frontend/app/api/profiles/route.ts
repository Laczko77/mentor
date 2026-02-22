import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireMentor, handleApiError } from "@/lib/server-auth";

export async function GET() {
    try {
        await requireMentor();
        const supabase = createAdminClient();

        // Mentors can see all mentee profiles
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "mentee")
            .order("full_name");

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}
