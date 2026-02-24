import { SupabaseClient } from "@supabase/supabase-js";

interface CreateNotificationParams {
    user_id: string;
    type: string;
    title: string;
    message: string;
    related_id?: string;
}

/**
 * Creates a notification record in the database.
 * Call this from API routes after key events.
 */
export async function createNotification(
    supabase: SupabaseClient,
    params: CreateNotificationParams
) {
    const { error } = await supabase.from("notifications").insert({
        user_id: params.user_id,
        type: params.type,
        title: params.title,
        message: params.message,
        related_id: params.related_id || null,
        is_read: false,
    });

    if (error) {
        console.error("Failed to create notification:", error);
    }
}
