"use client";

import { useEffect, useState } from "react";

const STYLE_ID = "animated-bg-styles";

function injectStyles() {
    if (typeof document === "undefined") return;

    // Remove any previously injected styles with this ID to ensure hot-reload
    // doesn't keep stale CSS animations running.
    const existing = document.getElementById(STYLE_ID);
    if (existing) {
        existing.remove();
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        @keyframes floatNode {
            0%   { transform: translate(0, 0px) rotate(0deg) scale(0.7); opacity: 0; }
            12%  { opacity: 0.75; }
            50%  { transform: translate(calc(var(--x-drift) * 0.5), -110px)
                              rotate(calc(var(--rot) * 0.5)) scale(1.15);
                   opacity: 0.85; }
            88%  { opacity: 0.75; }
            100% { transform: translate(var(--x-drift), -220px) rotate(var(--rot)) scale(0.7);
                   opacity: 0; }
        }
        .anim-node {
            position: absolute;
            background: rgba(226, 0, 116, 0.6);
            filter: blur(1px);
            animation: floatNode var(--dur) var(--delay) infinite;
            animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1);
            will-change: transform, opacity;
        }
        .anim-node-circle   { border-radius: 50%; box-shadow: 0 0 10px 2px rgba(226,0,116,0.5); }
        .anim-node-square   { border-radius: 2px; box-shadow: 0 0 10px 2px rgba(226,0,116,0.5); }
        .anim-node-triangle { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); }
    `;
    document.head.appendChild(style);
}

// ── Static data definitions ───────────────────────────────────────────────

/** Seeded-random LCG so positions are deterministic – no hydration mismatch */
function makeLCG(seed: number) {
    let s = seed;
    return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

interface NodeDef {
    id: number; x: number; y: number; size: number;
    duration: number; delay: number;
    type: "circle" | "square" | "triangle";
    xDrift: number; rot: number;
}

const TYPES: NodeDef["type"][] = ["circle", "square", "triangle"];
function generateNodes(): NodeDef[] {
    const rand = makeLCG(42);
    return Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: rand() * 100, y: rand() * 100,
        size: rand() * 6 + 2,
        duration: rand() * 20 + 15,
        delay: rand() * 6,
        type: TYPES[Math.floor(rand() * 3)],
        xDrift: (rand() - 0.5) * 90,
        rot: rand() > 0.5 ? 360 : 0,
    }));
}

const NODES = generateNodes();

// ── Component ─────────────────────────────────────────────────────────────

export const AnimatedBackground = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        injectStyles();
        setMounted(true);
    }, []);

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-background pointer-events-none">

            {/* Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e200741a_1px,transparent_1px),linear-gradient(to_bottom,#e200741a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_30%,transparent_100%)] opacity-60" />

            {/* Corner glows */}
            <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[140px]" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[140px]" />
            <div className="absolute top-[40%] left-[80%] w-[30%] h-[30%] rounded-full bg-white/5 blur-[120px]" />

            {/* Floating data nodes */}
            {mounted && NODES.map((node) => (
                <div
                    key={node.id}
                    className={`anim-node anim-node-${node.type}`}
                    style={{
                        width: node.size, height: node.size,
                        left: `${node.x}%`, top: `${node.y}%`,
                        "--dur": `${node.duration}s`,
                        "--delay": `${node.delay}s`,
                        "--x-drift": `${node.xDrift}px`,
                        "--rot": `${node.rot}deg`,
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
};
