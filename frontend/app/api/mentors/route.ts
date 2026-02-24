import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAuth, handleApiError } from "@/lib/server-auth";

export async function GET() {
    try {
        await requireAuth();
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name")
            .eq("role", "mentor")
            .order("full_name");

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}
