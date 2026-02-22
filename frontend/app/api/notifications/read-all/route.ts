import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAuth, handleApiError } from "@/lib/server-auth";

export async function PUT() {
    try {
        const user = await requireAuth();
        const supabase = createAdminClient();

        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", user.id)
            .eq("is_read", false);

        if (error) throw error;
        return NextResponse.json({ message: "All marked as read" });
    } catch (error) {
        return handleApiError(error);
    }
}
