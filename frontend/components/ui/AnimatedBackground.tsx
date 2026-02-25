"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

export const AnimatedBackground = () => {
    const [mounted, setMounted] = useState(false);
    // remountKey forces a full re-render of animations when tab becomes visible again.
    // This is necessary because Framer Motion animations with repeat:Infinity and
    // opacity ending at 0 get frozen at opacity:0 by the browser's rAF throttling
    // when the tab is hidden, causing a grey screen on return.
    const [remountKey, setRemountKey] = useState(0);

    const handleVisibilityChange = useCallback(() => {
        if (document.visibilityState === "visible") {
            setRemountKey((k) => k + 1);
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [handleVisibilityChange]);

    // Generate random nodes only after mount to avoid hydration mismatch.
    // Memoized per remountKey so positions stay stable within a session but
    // get fresh animation state after a tab-switch.
    const nodes = mounted ? Array.from({ length: 30 }).map((_, i) => {
        const shapeTypes = ['circle', 'square', 'triangle'] as const;
        return {
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 6 + 2,
            duration: Math.random() * 20 + 15,
            delay: Math.random() * 5,
            type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
            xOffset: Math.random() * 100 - 50,
        };
    }) : [];

    return (
        <div key={remountKey} className="fixed inset-0 z-[-1] overflow-hidden bg-background pointer-events-none">
            {/* Dynamic Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e200741a_1px,transparent_1px),linear-gradient(to_bottom,#e200741a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_30%,transparent_100%)] opacity-60"></div>

            {/* Glowing Orbs / Data Nodes (Various Shapes) */}
            {nodes.map((node) => {
                let shapeStyle = {};
                switch (node.type) {
                    case 'circle':
                        shapeStyle = { borderRadius: '50%' };
                        break;
                    case 'square':
                        shapeStyle = { borderRadius: '2px' };
                        break;
                    case 'triangle':
                        shapeStyle = { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' };
                        break;
                }

                return (
                    <motion.div
                        key={node.id}
                        className="absolute bg-primary/60 blur-[1px]"
                        style={{
                            width: node.size,
                            height: node.size,
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                            boxShadow: node.type !== 'triangle' ? "0 0 10px 2px rgba(226, 0, 116, 0.5)" : "none",
                            ...shapeStyle,
                        }}
                        animate={{
                            y: [0, -200, 0],
                            x: [0, node.xOffset, 0],
                            opacity: [0.1, 0.8, 0.1],
                            rotate: node.type !== 'circle' ? [0, 180, 360] : 0,
                        }}
                        transition={{
                            duration: node.duration,
                            delay: node.delay,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                );
            })}

            {/* Glowing ambient light at the corners */}
            <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[140px]" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[140px]" />
            <div className="absolute top-[40%] left-[80%] w-[30%] h-[30%] rounded-full bg-white/5 blur-[120px]" />

            {/* Animated SVG paths (Data Lines) */}
            <svg
                className="absolute inset-0 w-full h-full opacity-50"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
            >
                <motion.path
                    d="M -100 250 Q 300 600 600 250 T 1800 350"
                    fill="transparent"
                    stroke="var(--color-telekom-magenta)"
                    strokeWidth="2.5"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0, 1, 0] }}
                    transition={{
                        duration: 7,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "loop",
                    }}
                />
                <motion.path
                    d="M -50 850 Q 400 350 800 650 T 1800 550"
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="1.5"
                    strokeDasharray="12 12"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0, 0.8, 0] }}
                    transition={{
                        duration: 12,
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "loop",
                        delay: 1.5
                    }}
                />
                <motion.path
                    d="M -200 1000 Q 500 850 1000 1150 T 2000 950"
                    fill="transparent"
                    stroke="var(--color-telekom-magenta)"
                    strokeWidth="4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0, 0.6, 0] }}
                    transition={{
                        duration: 15,
                        ease: "easeOut",
                        repeat: Infinity,
                        repeatType: "loop",
                        delay: 3.5
                    }}
                />
                <motion.path
                    d="M 0 300 Q 800 150 2000 300"
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="1"
                    strokeDasharray="4 8"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0, 1, 0] }}
                    transition={{
                        duration: 4,
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "loop",
                        delay: 1
                    }}
                />
                <motion.path
                    d="M -200 -200 L 2200 1200"
                    fill="transparent"
                    stroke="var(--color-telekom-magenta)"
                    strokeWidth="1.5"
                    strokeDasharray="20 40 5 40"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0, 0.7, 0] }}
                    transition={{
                        duration: 6,
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "loop",
                        delay: 2
                    }}
                />
                <motion.path
                    d="M -200 1200 L 2200 -200"
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="2"
                    strokeDasharray="15 30"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0, 0.6, 0] }}
                    transition={{
                        duration: 8,
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "loop",
                        delay: 0.5
                    }}
                />
            </svg>
        </div>
    );
};
