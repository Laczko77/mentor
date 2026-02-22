"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Loader2, Network, Clock, ArrowLeft, ChevronRight, Activity } from "lucide-react";
import { TechCard } from "@/components/ui/TechCard";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { motion, AnimatePresence } from "framer-motion";

interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: string;
    joined_at: string;
}

const DUMMY_TIMELINE = [
    { id: 1, date: "2026-02-20", title: "Hálózati diagnosztika alapjai", status: "Kész" },
    { id: 2, date: "2026-02-15", title: "Biztonsági protokollok", status: "Kész" },
    { id: 3, date: "2026-02-10", title: "Hibaelhárítási metodika", status: "Kész" },
];

const SKILL_NODES = [
    { id: "core", x: 50, y: 150, label: "Alapok", status: "active" },
    { id: "net", x: 150, y: 80, label: "Hálózatok", status: "active" },
    { id: "sec", x: 150, y: 220, label: "Biztonság", status: "locked" },
    { id: "adv", x: 280, y: 150, label: "Haladó Hálózati D.", status: "locked" },
];
const SKILL_EDGES = [
    { from: "core", to: "net" },
    { from: "core", to: "sec" },
    { from: "net", to: "adv" },
    { from: "sec", to: "adv" },
];

function SkillTree() {
    return (
        <TechCard delay={0.2} className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-primary" />
                    Képességfáj (Skill-Tree)
                </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center flex-col items-center">
                <div className="relative w-full max-w-sm h-64 border border-white/5 bg-black/20 rounded-xl overflow-hidden shadow-inner">
                    <svg className="w-full h-full" viewBox="0 0 350 300">
                        {/* Edges */}
                        {SKILL_EDGES.map((edge, i) => {
                            const fromNode = SKILL_NODES.find((n) => n.id === edge.from)!;
                            const toNode = SKILL_NODES.find((n) => n.id === edge.to)!;
                            const isActive = fromNode.status === "active" && toNode.status === "active";
                            return (
                                <motion.line
                                    key={i}
                                    x1={fromNode.x}
                                    y1={fromNode.y}
                                    x2={toNode.x}
                                    y2={toNode.y}
                                    stroke={isActive ? "var(--color-telekom-magenta)" : "gray"}
                                    strokeWidth={isActive ? 3 : 1}
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.5, delay: 0.5 + i * 0.2 }}
                                    className={isActive ? "drop-shadow-[0_0_8px_rgba(226,0,116,0.6)]" : "opacity-30"}
                                />
                            );
                        })}
                        {/* Nodes */}
                        {SKILL_NODES.map((node, i) => (
                            <g key={node.id} className="cursor-pointer transition-transform hover:scale-110" style={{ transformOrigin: `${node.x}px ${node.y}px` }}>
                                <motion.circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={16}
                                    fill={node.status === "active" ? "var(--color-telekom-magenta)" : "#191919"}
                                    stroke={node.status === "active" ? "#fff" : "gray"}
                                    strokeWidth={2}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2 + i * 0.1, type: "spring" }}
                                    className={node.status === "active" ? "drop-shadow-[0_0_12px_rgba(226,0,116,0.8)]" : ""}
                                />
                                <text
                                    x={node.x}
                                    y={node.y + 35}
                                    textAnchor="middle"
                                    fill={node.status === "active" ? "#fff" : "gray"}
                                    className="text-[10px] font-bold tracking-wider"
                                >
                                    {node.label}
                                </text>
                            </g>
                        ))}
                    </svg>
                </div>
            </CardContent>
        </TechCard>
    );
}

function SessionTimeline() {
    return (
        <TechCard delay={0.3} className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Hálózati Log (Session History)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative pl-6 border-l-2 border-primary/20 space-y-8">
                    {DUMMY_TIMELINE.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.2 }}
                            className="relative"
                        >
                            <span className="absolute -left-[35px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-[0_0_10px_rgba(226,0,116,0.5)]">
                                <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                            </span>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background/50 border border-white/5 rounded-lg hover:border-primary/40 hover:shadow-[0_0_15px_rgba(226,0,116,0.1)] transition-all">
                                <div>
                                    <h4 className="font-bold text-lg">{item.title}</h4>
                                    <p className="text-sm text-muted-foreground font-mono mt-1">{item.date}</p>
                                </div>
                                <Badge className="mt-2 sm:mt-0 badge-telekom">
                                    {item.status}
                                </Badge>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </CardContent>
        </TechCard>
    );
}

function ProgressionTracker() {
    const progress = 65; // Example progress
    return (
        <TechCard delay={0.4} className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Kibernetikus Fejlődés (Progression Tracker)
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="relative h-6 w-full bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner">
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/50 to-primary relative overflow-hidden"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.8 }}
                    >
                        {/* Shimmer effect */}
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[gridMove_2s_linear_infinite]" style={{ backgroundSize: '200% 100%' }}></div>
                    </motion.div>
                </div>
                <div className="flex justify-between mt-2 text-sm font-bold tracking-widest text-muted-foreground">
                    <span className="text-primary">{progress}% TELJESÍTVE</span>
                    <span>100% CÉL</span>
                </div>
            </CardContent>
        </TechCard>
    );
}

export default function MenteesPage() {
    const [mentees, setMentees] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMentee, setSelectedMentee] = useState<Profile | null>(null);

    useEffect(() => {
        api
            .get<Profile[]>("/profiles")
            .then((data) => setMentees(data.filter(m => m.role === 'mentee')))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-primary drop-shadow-[0_0_10px_rgba(226,0,116,0.6)]" />
                    <p className="text-sm font-mono tracking-widest text-primary animate-pulse mt-4 uppercase">Rendszer szinkronizálása...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 relative z-10 w-full">
            <AnimatePresence mode="wait">
                {!selectedMentee ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-8"
                    >
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                                Mentoráltjaim
                            </h1>
                            <p className="mt-2 text-muted-foreground text-lg">
                                A hálózathoz csatlakozott profilok listája
                            </p>
                        </div>

                        <TechCard delay={0.1}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <Users className="h-6 w-6 text-primary" />
                                    Aktív Csomópontok ({mentees.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {mentees.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent border-white/10">
                                                    <TableHead className="text-primary tracking-widest text-xs uppercase">Protokoll Név</TableHead>
                                                    <TableHead className="text-primary tracking-widest text-xs uppercase">E-mail</TableHead>
                                                    <TableHead className="text-primary tracking-widest text-xs uppercase">Csatlakozás ideje</TableHead>
                                                    <TableHead className="text-primary tracking-widest text-xs uppercase">Állapot</TableHead>
                                                    <TableHead className="text-right"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {mentees.map((m) => {
                                                    const initials = m.full_name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .toUpperCase()
                                                        .slice(0, 2);
                                                    const joinedDate = new Date(m.joined_at);
                                                    const isNew = true; // Dummy logic

                                                    return (
                                                        <TableRow key={m.id} className="group border-white/5 hover:bg-white/5 cursor-pointer transition-colors" onClick={() => setSelectedMentee(m)}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-4">
                                                                    <Avatar className="h-10 w-10 ring-2 ring-primary/20 group-hover:ring-primary shadow-[0_0_10px_rgba(226,0,116,0.1)] transition-all">
                                                                        <AvatarFallback className="bg-background text-primary font-bold">
                                                                            {initials}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="font-bold text-base">{m.full_name}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground font-mono text-sm tracking-wide">
                                                                {m.email}
                                                            </TableCell>
                                                            <TableCell className="text-sm font-mono tracking-wide">
                                                                {joinedDate.toLocaleDateString("hu-HU")}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className="badge-telekom">
                                                                    {isNew ? "ONLINE" : "OFFLINE"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <p className="py-12 text-center text-muted-foreground italic">
                                        Nincsenek aktív csomópontok a hálózaton.
                                    </p>
                                )}
                            </CardContent>
                        </TechCard>
                    </motion.div>
                ) : (
                    <motion.div
                        key="profile"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-4">
                                    <button onClick={() => setSelectedMentee(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                        <ArrowLeft className="h-8 w-8 text-primary" />
                                    </button>
                                    {selectedMentee.full_name} <span className="text-primary font-mono text-xl tracking-widest ml-2">[PROFIL]</span>
                                </h1>
                                <p className="mt-2 text-muted-foreground font-mono tracking-wider ml-14">
                                    {selectedMentee.email} • Aktív Kapcsolat: {new Date(selectedMentee.joined_at).toLocaleDateString("hu-HU")}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                            <SkillTree />
                            <SessionTimeline />
                            <ProgressionTracker />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
