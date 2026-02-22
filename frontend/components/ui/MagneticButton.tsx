"use client";

import { useRef, useState, forwardRef } from "react";
import { HTMLMotionProps, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MagneticButtonProps extends HTMLMotionProps<"button"> {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "outline";
}

export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
    ({ children, className, variant = "primary", onMouseMove, onMouseLeave, ...props }, ref) => {
        const internalRef = useRef<HTMLButtonElement>(null);
        const [position, setPosition] = useState({ x: 0, y: 0 });

        const setRefs = (node: HTMLButtonElement | null) => {
            internalRef.current = node;
            if (typeof ref === "function") {
                ref(node);
            } else if (ref) {
                ref.current = node;
            }
        };

        const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!internalRef.current) return;
            const { clientX, clientY } = e;
            const { height, width, left, top } = internalRef.current.getBoundingClientRect();
            const middleX = clientX - (left + width / 2);
            const middleY = clientY - (top + height / 2);
            setPosition({ x: middleX * 0.2, y: middleY * 0.2 });

            if (onMouseMove) {
                onMouseMove(e);
            }
        };

        const reset = (e: React.MouseEvent<HTMLButtonElement>) => {
            setPosition({ x: 0, y: 0 });
            if (onMouseLeave) {
                onMouseLeave(e);
            }
        };

        const variantStyles = {
            primary: "bg-primary text-primary-foreground hover:bg-primary/95",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
            outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        };

        return (
            <motion.button
                {...props}
                ref={setRefs}
                onMouseMove={handleMouse}
                onMouseLeave={reset}
                animate={{ x: position.x, y: position.y }}
                transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
                className={cn(
                    "relative inline-flex items-center justify-center px-8 py-3 font-medium transition-colors rounded-full btn-telekom group",
                    variantStyles[variant],
                    className
                )}
            >
                <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 animate-magenta-pulse" />
            </motion.button>
        );
    }
);

MagneticButton.displayName = "MagneticButton";
