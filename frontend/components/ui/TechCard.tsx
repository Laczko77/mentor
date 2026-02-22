"use client";

import { HTMLMotionProps, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TechCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

export const TechCard = ({ children, className, delay = 0, ...props }: TechCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay, ease: [0.16, 1, 0.3, 1] }}
            className={cn("card-telekom p-6 relative overflow-hidden group border", className)}
            {...props}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none" />
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};
