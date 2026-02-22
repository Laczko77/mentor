import { addMonths, isBefore, parseISO } from "date-fns";

/**
 * Calculates the required mentoring hours based on tenure.
 * Logic:
 * - < 3 months at the company: 12 hours
 * - >= 3 months: 4 hours
 */
export function calculateRequiredHours(joinedAt: string | Date | null | undefined): number {
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
