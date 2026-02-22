import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireMentor, handleApiError } from "@/lib/server-auth";
import { calculateRequiredHours } from "@/lib/hours-calculator";

export async function GET() {
    try {
        await requireMentor();
        const supabase = createAdminClient();

        // Get all mentees
        const { data: mentees, error: menteesError } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "mentee");

        if (menteesError) throw menteesError;

        // Get completed hours
        const { data: hours, error: hoursError } = await supabase
            .from("completed_hours")
            .select("*");

        if (hoursError) throw hoursError;

        const hoursMap = new Map((hours || []).map((h: any) => [h.mentee_id, parseFloat(h.completed_hours)]));

        // Build CSV content
        let csvContent = "Név;Email;Belépés dátuma;Kötelező órák;Teljesített órák;Hátralévő órák;Teljesítés %\n";

        (mentees || []).forEach((m: any) => {
            const required = calculateRequiredHours(m.joined_at);
            const completed = hoursMap.get(m.id) || 0;
            const remaining = Math.max(0, required - completed);
            const progress = required > 0 ? (completed / required) * 100 : 100;

            const row = [
                m.full_name,
                m.email,
                m.joined_at,
                required,
                completed.toFixed(2),
                remaining.toFixed(2),
                `${Math.min(100, progress).toFixed(1)}%`
            ].join(";");
            csvContent += row + "\n";
        });

        // Add BOM for Excel UTF-8 support
        const BOM = "\uFEFF";
        const contentWithBOM = BOM + csvContent;

        return new NextResponse(contentWithBOM, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": "attachment; filename=mentoralt_orak.csv",
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
