"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    BarChart3,
    Loader2,
    TrendingUp,
    Users,
    Calendar,
    PieChart,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
} from "recharts";

interface MonthlyData {
    month: string;
    total_sessions: number;
    individual: number;
    group: number;
    accepted_bookings: number;
    cancelled: number;
}

interface MenteeTrend {
    mentee_id: string;
    full_name: string;
    monthly_hours: { month: string; hours: number }[];
}

const COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#ef4444",
    "#84cc16",
];

export default function StatisticsPage() {
    const { profile } = useAuth();
    const [monthly, setMonthly] = useState<MonthlyData[]>([]);
    const [trends, setTrends] = useState<MenteeTrend[]>([]);
    const [loading, setLoading] = useState(true);

    const isMentor = profile?.role === "mentor";

    useEffect(() => {
        if (!isMentor) {
            setLoading(false);
            return;
        }
        Promise.all([
            api.get<MonthlyData[]>("/statistics/monthly"),
            api.get<MenteeTrend[]>("/statistics/mentee-trends"),
        ])
            .then(([m, t]) => {
                setMonthly(m);
                setTrends(t);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [isMentor]);

    if (!isMentor) {
        return (
            <div className="py-20 text-center text-muted-foreground">
                Csak mentorok számára elérhető
            </div>
        );
    }

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

    // Aggregate totals
    const totalSessions = monthly.reduce((a, m) => a + m.total_sessions, 0);
    const totalAccepted = monthly.reduce((a, m) => a + m.accepted_bookings, 0);
    const totalIndividual = monthly.reduce((a, m) => a + m.individual, 0);
    const totalGroup = monthly.reduce((a, m) => a + m.group, 0);

    // Merge all mentee trends into a unified chart dataset
    const allMonths = new Set<string>();
    trends.forEach((t) => t.monthly_hours.forEach((m) => allMonths.add(m.month)));
    const sortedMonths = Array.from(allMonths).sort();

    const trendChartData = sortedMonths.map((month) => {
        const point: Record<string, unknown> = { month };
        trends.forEach((t) => {
            const entry = t.monthly_hours.find((m) => m.month === month);
            point[t.full_name] = entry?.hours || 0;
        });
        return point;
    });

    const formatMonth = (m: string) => {
        const [y, mo] = m.split("-");
        const months = [
            "Jan",
            "Feb",
            "Már",
            "Ápr",
            "Máj",
            "Jún",
            "Júl",
            "Aug",
            "Sze",
            "Okt",
            "Nov",
            "Dec",
        ];
        return `${months[parseInt(mo) - 1]} ${y.slice(2)}`;
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Statisztika</h1>
                <p className="text-sm text-muted-foreground">
                    Mentorálási tevékenységed részletes áttekintése
                </p>
            </div>

            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-4">
                <Card className="bg-primary/5">
                    <CardContent className="pt-6 text-center">
                        <Calendar className="mx-auto mb-2 h-6 w-6 text-primary" />
                        <p className="text-3xl font-bold text-primary">
                            {totalSessions}
                        </p>
                        <p className="text-sm text-muted-foreground">Összes session</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
                    <CardContent className="pt-6 text-center">
                        <Users className="mx-auto mb-2 h-6 w-6 text-emerald-500" />
                        <p className="text-3xl font-bold text-emerald-500">
                            {totalAccepted}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Elfogadott foglalás
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-indigo-500/5 to-indigo-500/10">
                    <CardContent className="pt-6 text-center">
                        <PieChart className="mx-auto mb-2 h-6 w-6 text-indigo-500" />
                        <p className="text-3xl font-bold text-indigo-500">
                            {totalIndividual}
                        </p>
                        <p className="text-sm text-muted-foreground">Egyéni</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10">
                    <CardContent className="pt-6 text-center">
                        <Users className="mx-auto mb-2 h-6 w-6 text-purple-500" />
                        <p className="text-3xl font-bold text-purple-500">
                            {totalGroup}
                        </p>
                        <p className="text-sm text-muted-foreground">Csoportos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly sessions bar chart */}
            <Card className="card-telekom">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Havi session szám
                    </CardTitle>
                    <CardDescription>
                        Egyéni vs. csoportos sessionök havi bontásban
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {monthly.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">
                            Nincs elegendő adat
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={monthly} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border)"
                                />
                                <XAxis
                                    dataKey="month"
                                    tickFormatter={formatMonth}
                                    fontSize={12}
                                />
                                <YAxis fontSize={12} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                                    labelFormatter={(label) => formatMonth(String(label))}
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "1px solid var(--border)",
                                        background: "var(--background)",
                                        color: "var(--foreground)",
                                    }}
                                />
                                <Legend />
                                <Bar
                                    dataKey="individual"
                                    name="Egyéni"
                                    fill="var(--primary)"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                />
                                <Bar
                                    dataKey="group"
                                    name="Csoportos"
                                    fill="#8b5cf6"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Per-mentee trend line chart */}
            <Card className="card-telekom">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                        Mentoráltak óraszám trendje
                    </CardTitle>
                    <CardDescription>
                        Havi teljesített órák mentoráltanként
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {trendChartData.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">
                            Nincs elegendő adat
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={trendChartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border)"
                                />
                                <XAxis
                                    dataKey="month"
                                    tickFormatter={formatMonth}
                                    fontSize={12}
                                />
                                <YAxis
                                    fontSize={12}
                                    label={{
                                        value: "Órák",
                                        angle: -90,
                                        position: "insideLeft",
                                        style: { fontSize: 12 },
                                    }}
                                />
                                <Tooltip
                                    cursor={{ stroke: "var(--border)" }}
                                    labelFormatter={(label) => formatMonth(String(label))}
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "1px solid var(--border)",
                                        background: "var(--background)",
                                        color: "var(--foreground)"
                                    }}
                                />
                                <Legend />
                                {trends.map((t, i) => (
                                    <Line
                                        key={t.mentee_id}
                                        type="monotone"
                                        dataKey={t.full_name}
                                        stroke={COLORS[i % COLORS.length]}
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
