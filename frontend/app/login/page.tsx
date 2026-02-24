"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signIn(username, password);
            toast.success("Sikeres bejelentkezés!");
            router.push("/dashboard");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Bejelentkezés sikertelen";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center relative z-0 px-4">
            <AnimatedBackground />

            <Card className="relative w-full max-w-md border-border/40 bg-background/80 backdrop-blur-2xl animate-premium-slide-up shadow-2xl z-10">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden shadow-lg shadow-primary/20 bg-black/50 border border-primary/20">
                        <Image src="/logo.png" alt="MentorTér Logo" width={56} height={56} className="object-cover" unoptimized />
                    </div>
                    <CardTitle className="text-2xl font-bold">MentorTér</CardTitle>
                    <CardDescription>
                        Jelentkezz be a mentorálási platformra
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Felhasználónév</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="felhasznalonev"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="h-11"
                                autoComplete="username"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Jelszó</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="h-11 w-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:brightness-110 btn-telekom"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Bejelentkezés
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
