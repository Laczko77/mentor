import { addMonths, isBefore, parseISO } from "date-fns";

/**
 * Returns the required mentoring hours for a mentee.
 * Priority:
 * 1. If `overrideHours` is set (mentor manually configured), use that
 * 2. Otherwise auto-calculate from tenure:
 *    - < 3 months at the company: 12 hours
 *    - >= 3 months: 4 hours
 */
export function calculateRequiredHours(
    joinedAt: string | Date | null | undefined,
    overrideHours?: number | null
): number {
    // If mentor manually set the required hours, use that
    if (overrideHours != null && overrideHours >= 0) {
        return overrideHours;
    }

    if (!joinedAt) return 12; // Default to 12 if no join date specified

    try {
        const joinDate = typeof joinedAt === "string" ? parseISO(joinedAt) : joinedAt;

        // Check if date is valid
        if (isNaN(joinDate.getTime())) {
            return 12;
        }

        const threshold = addMonths(joinDate, 3);
        const today = new Date();

        if (isBefore(today, threshold)) {
            return 12;
        }
        return 4;
    } catch (e) {
        return 12;
    }
}
