"use client";

import { ReactNode } from "react";

interface PageTransitionProps {
    children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
    return (
        <div style={{ animation: "pageFadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}>
            <style>{`
                @keyframes pageFadeIn {
                    from { opacity: 0; transform: translateY(15px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            {children}
        </div>
    );
}
