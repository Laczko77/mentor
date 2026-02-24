import { createClient, createAdminClient } from "./supabase-server";
import { NextResponse } from "next/server";

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: "mentor" | "mentee";
    full_name: string;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();

    return {
        id: user.id,
        email: user.email || "",
        role: profile?.role as "mentor" | "mentee",
        full_name: profile?.full_name || "",
    };
}

export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("Unauthorized");
    }
    return user;
}

export async function requireMentor() {
    const user = await requireAuth();
    if (user.role !== "mentor") {
        throw new Error("Forbidden: Mentor role required");
    }
    return user;
}

export async function requireMentee() {
    const user = await requireAuth();
    if (user.role !== "mentee") {
        throw new Error("Forbidden: Mentee role required");
    }
    return user;
}

export function handleApiError(error: any) {
    console.error("API Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";

    if (message === "Unauthorized") {
        return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }
    if (message.includes("Forbidden")) {
        return NextResponse.json({ detail: message }, { status: 403 });
    }

    return NextResponse.json({ detail: message }, { status: 500 });
}
