/**
 * Helper to safely parse naive date strings (e.g. "2026-03-09T14:30")
 * explicitly into Europe/Budapest local time, preventing Vercel's UTC 
 * server time from shifting the actual scheduled hour.
 */
export function parseLocalTime(timeStr: string): Date {
    if (!timeStr) return new Date();

    // If it already contains timezone info ("Z", "+01:00", etc)
    if (timeStr.includes("Z") || timeStr.match(/[+-]\d{2}:\d{2}$/)) {
        return new Date(timeStr);
    }

    // Determine if it's currently Daylight Saving Time in Budapest roughly
    const isDST = (d: Date) => {
        const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
        const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
        return Math.max(jan, jul) !== d.getTimezoneOffset();
    };

    const tempDt = new Date(timeStr);
    const offset = isDST(tempDt) ? "+02:00" : "+01:00";

    return new Date(`${timeStr}${offset}`);
}
