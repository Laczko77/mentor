import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireMentor, handleApiError } from "@/lib/server-auth";

/**
 * Converts a username to the internal fake email used by Supabase auth.
 */
function usernameToEmail(username: string): string {
    return `${username.toLowerCase().trim()}@mentortrack.app`;
}

// POST - Create a new mentee (mentor registers mentee with username + password)
// Uses direct SQL insert into auth.users to bypass Supabase email validation
export async function POST(request: NextRequest) {
    try {
        const user = await requireMentor();
        const body = await request.json();
        const { full_name, username, password, required_hours } = body;

        if (!full_name || !username || !password) {
            throw new Error("Név, felhasználónév és jelszó megadása kötelező");
        }

        const cleanUsername = username.toLowerCase().trim();

        if (cleanUsername.length < 3) {
            throw new Error("A felhasználónév legalább 3 karakter legyen");
        }
        if (password.length < 6) {
            throw new Error("A jelszó legalább 6 karakter legyen");
        }

        const supabase = createAdminClient();

        // Check if username already taken
        const { data: existing } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", cleanUsername)
            .single();

        if (existing) {
            throw new Error("Ez a felhasználónév már foglalt");
        }

        const fakeEmail = usernameToEmail(cleanUsername);

        // Insert directly into auth.users via SQL to bypass email validation
        // The handle_new_user trigger will auto-create the profile row
        const { data: authResult, error: authError } = await supabase.rpc(
            'create_user_with_password',
            {
                p_email: fakeEmail,
                p_password: password,
                p_username: cleanUsername,
                p_full_name: full_name,
            }
        );

        if (authError) throw authError;

        const newUserId = authResult;
        if (!newUserId) throw new Error("Felhasználó létrehozása sikertelen");

        // The trigger already created the profile, just update mentor_id + is_active
        const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .update({
                mentor_id: user.id,
                is_active: true,
                ...(required_hours != null ? { required_hours: Number(required_hours) } : {}),
            })
            .eq("id", newUserId)
            .select()
            .single();

        if (profileError) throw profileError;

        return NextResponse.json(profileData, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT - Update mentee profile
export async function PUT(request: NextRequest) {
    try {
        await requireMentor();
        const body = await request.json();
        const { id, full_name, username, is_active, required_hours } = body;

        if (!id) throw new Error("Mentorált ID megadása kötelező");

        const supabase = createAdminClient();

        const updateData: Record<string, unknown> = {};
        if (full_name !== undefined) updateData.full_name = full_name;
        if (username !== undefined) {
            const cleanUsername = username.toLowerCase().trim();
            // Check uniqueness
            const { data: existing } = await supabase
                .from("profiles")
                .select("id")
                .eq("username", cleanUsername)
                .neq("id", id)
                .single();

            if (existing) throw new Error("Ez a felhasználónév már foglalt");

            updateData.username = cleanUsername;
            updateData.email = usernameToEmail(cleanUsername);

            // Also update auth.users email
            const newEmail = usernameToEmail(cleanUsername);
            try {
                await supabase.auth.admin.updateUserById(id, { email: newEmail });
            } catch {
                // Ignore if auth update fails - profile email is already updated
            }
        }
        if (is_active !== undefined) updateData.is_active = is_active;
        if (required_hours !== undefined) updateData.required_hours = required_hours === null ? null : Number(required_hours);

        const { data, error } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", id)
            .eq("role", "mentee")
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE - Deactivate mentee (soft delete)
export async function DELETE(request: NextRequest) {
    try {
        await requireMentor();
        const { searchParams } = request.nextUrl;
        const id = searchParams.get("id");

        if (!id) throw new Error("Mentorált ID megadása kötelező");

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from("profiles")
            .update({ is_active: false })
            .eq("id", id)
            .eq("role", "mentee")
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}
