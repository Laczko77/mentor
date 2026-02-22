"use client";

import { Progress } from "@/components/ui/progress";

interface HoursProgressProps {
    completed: number;
    required: number;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export function HoursProgress({
    completed,
    required,
    size = "md",
    showLabel = true,
}: HoursProgressProps) {
    const percent = required > 0 ? Math.min(100, (completed / required) * 100) : 100;
    const remaining = Math.max(0, required - completed);

    const getColor = () => {
        if (percent >= 100) return "text-primary";
        if (percent >= 80) return "text-primary/80";
        return "text-muted-foreground";
    };

    return (
        <div className="space-y-1.5">
            <Progress
                value={percent}
                className={`${size === "sm" ? "h-2" : size === "lg" ? "h-4" : "h-3"}`}
            />
            {showLabel && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className={`font-semibold ${getColor()}`}>
                        {completed.toFixed(1)} / {required} óra
                    </span>
                    <span>
                        {remaining > 0 ? `Még ${remaining.toFixed(1)} óra` : "✓ Teljesítve"}
                    </span>
                </div>
            )}
        </div>
    );
}
