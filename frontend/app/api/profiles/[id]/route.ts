import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAuth, handleApiError } from "@/lib/server-auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        if (user.id !== id) {
            throw new Error("Forbidden: You can only update your own profile");
        }

        const body = await request.json();
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from("profiles")
            .update({
                full_name: body.full_name,
                // Email usually shouldn't be updated here as it's linked to Auth
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
