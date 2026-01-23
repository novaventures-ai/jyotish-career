
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Briefcase,
    Building,
    Wallet,
    User,
    Award,
    Zap,
    ShieldAlert,
    Calendar,
    Gem,
    BookOpen,
    Sparkles,
    Loader2,
    TrendingUp,
    Flag
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface WealthAnalysisProps {
    profileId?: number;
    guestChart?: any;
}

export function WealthAnalysis({ profileId, guestChart }: WealthAnalysisProps) {
    // 1. Saved Profile Query
    const profileQuery = trpc.chart.getMasterAnalysis.useQuery(
        { profileId: profileId! },
        { enabled: !!profileId }
    );

    // 2. Guest Data Query
    const guestInput = guestChart?.birthData ? {
        birthDate: guestChart.birthData.birthDate,
        birthTime: guestChart.birthData.birthTime,
        birthPlace: guestChart.birthData.birthPlace,
        latitude: guestChart.birthData.latitude,
        longitude: guestChart.birthData.longitude,
        timezoneOffset: guestChart.birthData.timezoneOffset || 0,
        ayanamsa: guestChart.birthData.ayanamsa || "lahiri"
    } : undefined;

    const guestQuery = trpc.chart.getGuestMasterAnalysis.useQuery(
        guestInput!,
        { enabled: !profileId && !!guestInput }
    );

    const data = profileId ? profileQuery.data : guestQuery.data;
    const isLoading = profileId ? profileQuery.isLoading : guestQuery.isLoading;
    const error = profileId ? profileQuery.error : guestQuery.error;

    const [narrative, setNarrative] = useState<any>(null);
    const narrativeMutation = trpc.ai.getWealthNarrative.useMutation({
        onSuccess: (data) => {
            setNarrative(data);
            toast.success("Wealth narrative generated!");
        },
        onError: (err) => toast.error(err.message)
    });

    const handleGenerateNarrative = () => {
        if (profileId) {
            narrativeMutation.mutate({ profileId });
        } else if (guestChart?.chartData) {
            narrativeMutation.mutate({ chartData: guestChart.chartData });
        }
    };

    if (isLoading) return <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>;
    if (error) return <div className="text-red-500">Error loading wealth analysis: {error.message}</div>;
    if (!data) return <div className="p-4 text-center text-muted-foreground">No analysis data available. Please generate a chart first.</div>;

    const summary = getExecutiveSummary(data);

    return (
        <div className="space-y-6 p-4">
            {/* Executive Summary & Narrative */}
            <Card className="bg-primary/5 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
                <CardContent className="pt-6">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Executive Summary
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        {summary}
                    </p>

                    {!narrative ? (
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto border-purple-500/30 text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-900/20"
                            onClick={handleGenerateNarrative}
                            disabled={narrativeMutation.isPending}
                        >
                            {narrativeMutation.isPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Writing your story...</>
                            ) : (
                                <><BookOpen className="w-4 h-4 mr-2" /> Unlock Detailed Wealth Narrative</>
                            )}
                        </Button>
                    ) : (
                        <div className="mt-6 pt-6 border-t border-primary/10 animate-in fade-in slide-in-from-top-4 duration-700">
                            <div className="mb-4">
                                <Badge variant="secondary" className="mb-2 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                    Core Theme
                                </Badge>
                                <h4 className="text-xl font-serif font-medium text-foreground">
                                    "{narrative.theme}"
                                </h4>
                            </div>

                            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground mb-6 font-serif leading-relaxed">
                                <p className="whitespace-pre-line">{narrative.narrative}</p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <h5 className="font-medium text-sm flex items-center gap-2 sm:col-span-2">
                                    <Flag className="w-4 h-4 text-green-600" /> Projected Milestones
                                </h5>
                                {narrative.milestones.map((m: any, i: number) => (
                                    <div key={i} className="bg-background/50 p-3 rounded border flex items-start gap-3">
                                        <div className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                                            {m.year}
                                        </div>
                                        <span className="text-sm">{m.event}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Wealth DNA Widget */}
                <WealthDNAWidget data={data} />

                {/* 2. Hidden Gains (Assets) Widget */}
                <AssetStatusWidget data={data} />

                {/* 3. Brand & Status Widget */}
                <SocialBrandWidget data={data} />

                {/* 4. Timing & Remedy Widget */}
                <TimingRemedyWidget data={data} />
            </div>
        </div>
    );
}

function getExecutiveSummary(data: any) {
    const { orientation, wealth, status } = data;
    const isBusiness = orientation.type === "Business";
    const driver = orientation.drivingPlanet;
    const source = wealth.d2Source.split("(")[0].trim().toLowerCase(); // removes (Planet)

    return `You have a natural inclination towards ${isBusiness ? "business and entrepreneurship" : "stable professional employment"}, 
    primarily driven by the energy of ${driver}. Your wealth building potential is strongest in ${source} areas. 
    Socially, you project an image of being ${status.reputation.toLowerCase()}.`;
}

// --- Sub-Widgets ---

function WealthDNAWidget({ data }: { data: any }) {
    const { orientation, wealth } = data;
    const isBusiness = orientation.type === "Business";
    const serviceScore = orientation.score.service;
    const businessScore = orientation.score.business;
    const totalScore = serviceScore + businessScore;
    const businessPercent = totalScore > 0 ? (businessScore / totalScore) * 100 : 50;

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary" />
                        Wealth Path
                    </CardTitle>
                    <Badge variant={isBusiness ? "default" : "secondary"}>
                        {orientation.type} Path
                    </Badge>
                </div>
                <CardDescription>Your natural working style & income source</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* Orientation Meter */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>Employment</span>
                        <span>Business</span>
                    </div>
                    <Progress value={businessPercent} className="h-2" />
                    <div className="text-xs text-center pt-1 text-muted-foreground">
                        Key Influencer: {orientation.drivingPlanet}
                    </div>
                </div>

                {/* Wealth Architecture Tags */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-secondary/30 p-3 rounded-lg flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Primary Source</span>
                        <div className="flex items-center gap-1 font-medium text-sm">
                            {wealth.d2Source.includes("Sun") ? <Zap className="w-3 h-3 text-amber-500" /> : <Wallet className="w-3 h-3 text-blue-400" />}
                            {wealth.d2Source.split("(")[0]} {/* Hide planet name */}
                        </div>
                    </div>

                    <div className="bg-secondary/30 p-3 rounded-lg flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Long-term Legacy</span>
                        <div className="flex items-center gap-1 font-medium text-sm">
                            <Building className="w-3 h-3 text-emerald-500" />
                            {wealth.d12Legacy.split("(")[0]}
                        </div>
                    </div>
                </div>

                <div className="text-sm bg-muted/50 p-2 rounded text-center">
                    <span className="font-semibold text-xs uppercase text-muted-foreground block mb-1">Best Niche</span>
                    {wealth.d24Niche}
                </div>

                <div className="pt-3 border-t mt-2">
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                        "{isBusiness
                            ? "You are naturally wired for independence. Your wealth potential peaks when you create your own systems rather than following others."
                            : "You thrive on stability and structure. Your best path to wealth is through consistent growth in established organizations."}
                        Your financial engine is powered by {wealth.d2Source.split("(")[0].toLowerCase()}."
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function AssetStatusWidget({ data }: { data: any }) {
    const { wealth } = data;

    const isHighWindfall = wealth.d8Windfall.includes("High");
    const isRiskyWindfall = wealth.d8Windfall.includes("Loss") || wealth.d8Windfall.includes("Risk");

    // Helper to strip brackets
    const clean = (s: string) => s.split("(")[0].trim();

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-500" />
                    Assets & Luck
                </CardTitle>
                <CardDescription>Windfalls, Property & Scale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* Windfall Status */}
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isHighWindfall ? "bg-green-100" : "bg-muted"}`}>
                            <Zap className={`w-4 h-4 ${isHighWindfall ? "text-green-600" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground uppercase">Luck Factor</div>
                            <div className={`text-lg font-bold ${isHighWindfall ? "text-green-600 dark:text-green-400" : ""}`}>
                                {isHighWindfall ? "High Potential" : clean(wealth.d8Windfall)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Asset Joy */}
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Lifestyle & Comforts</div>
                        <div className="font-medium flex items-center gap-2">
                            <Building className="w-4 h-4 text-blue-500" />
                            {clean(wealth.d16Assets)}
                        </div>
                    </div>

                    {/* Scale */}
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Career Scale</div>
                        <div className="font-medium flex items-center gap-2">
                            <Award className="w-4 h-4 text-purple-500" />
                            {clean(wealth.d10Status)}
                        </div>
                    </div>
                </div>

                <div className="pt-3 border-t mt-2">
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                        "Your chart suggests {isHighWindfall ? "a strong element of luck—you often find yourself in the right place at the right time." : "you rely on steady, earned progress rather than betting on sudden windfalls."}
                        Your lifestyle tends to center around {clean(wealth.d16Assets).toLowerCase()}."
                    </p>
                </div>

            </CardContent>
        </Card>
    );
}

function SocialBrandWidget({ data }: { data: any }) {
    const { status } = data;

    // Helper to remove (2nd) or (Arudha Lagna) type text
    const clean = (s: string) => s.replace(/\s*\(.*?\)\s*/g, "").trim();

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-500" />
                    Public Image
                </CardTitle>
                <CardDescription>How the world sees you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

                <div className="text-center p-4 bg-secondary/10 rounded-lg">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Your Reputation</div>
                    <div className="text-2xl font-bold text-primary">{status.arudhaLagna}</div>
                    <div className="text-sm mt-1">{status.reputation.split("(")[0]}</div>
                </div>

                {/* Boosters & Blockers */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="font-medium text-green-600 mb-2 flex items-center gap-1 text-xs uppercase tracking-wide">
                            <Zap className="w-3 h-3" /> Strengths
                        </div>
                        <ul className="space-y-1">
                            {status.boosters.length > 0 ? status.boosters.slice(0, 3).map((b: string) => (
                                <li key={b} className="text-xs text-muted-foreground flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-green-400" />
                                    {clean(b)}
                                </li>
                            )) : <li className="text-xs text-muted-foreground">None active</li>}
                        </ul>
                    </div>
                    <div>
                        <div className="font-medium text-red-500 mb-2 flex items-center gap-1 text-xs uppercase tracking-wide">
                            <ShieldAlert className="w-3 h-3" /> Challenges
                        </div>
                        <ul className="space-y-1">
                            {status.blockers.length > 0 ? status.blockers.slice(0, 3).map((b: string) => (
                                <li key={b} className="text-xs text-muted-foreground flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-red-400" />
                                    {clean(b)}
                                </li>
                            )) : <li className="text-xs text-muted-foreground">None active</li>}
                        </ul>
                    </div>
                </div>

                <div className="pt-3 border-t mt-2">
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                        "Your image acts as a filter. People naturally perceive you as {status.reputation.split("(")[0].toLowerCase()}.
                        Leaning into this reputation attracts resources, while conflicting with it creates friction."
                    </p>
                </div>

            </CardContent>
        </Card>
    );
}

function TimingRemedyWidget({ data }: { data: any }) {
    const { timing, remedies } = data;

    // Helper for icons based on event type
    const getEventIcon = (type?: string) => {
        switch (type) {
            case "career": return <Briefcase className="w-3 h-3 text-blue-500" />;
            case "wealth": return <Wallet className="w-3 h-3 text-green-500" />;
            case "spiritual": return <Gem className="w-3 h-3 text-purple-500" />;
            default: return <Zap className="w-3 h-3 text-amber-500" />;
        }
    };

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-amber-500" />
                        Key Milestones
                    </CardTitle>
                </div>
                <CardDescription>Forward-looking dynamic timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* Next Big Events */}
                <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Upcoming Timeline</div>
                    <div className="space-y-2">
                        {timing.maturityEvents.slice(0, 3).map((e: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                <div className="flex flex-col items-center min-w-[3.5rem] bg-secondary/30 rounded p-1 border">
                                    <span className="text-xs font-bold text-primary">Age {e.age}</span>
                                    <span className="text-[10px] text-muted-foreground">{e.year}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        {getEventIcon(e.type)}
                                        <span className="text-sm font-medium leading-none">
                                            {e.description.split(":")[0] || "Milestone"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {e.description.includes(":") ? e.description.split(":")[1].trim() : e.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {timing.maturityEvents.length === 0 && (
                            <div className="text-sm text-muted-foreground italic p-2">No immediate major milestones detected.</div>
                        )}
                    </div>
                </div>

                {/* Remedy Card */}
                <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full shrink-0">
                        <Gem className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <div className="text-[10px] text-amber-800 dark:text-amber-200 font-bold uppercase tracking-wider">Growth Focus</div>
                        <div className="text-sm font-medium text-amber-900 dark:text-amber-100 leading-tight">
                            Strengthen {remedies.deity} energy to overcome {remedies.blocker} challenges.
                        </div>
                    </div>
                </div>

                <div className="pt-3 border-t mt-2">
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                        "Your timeline is dynamic. The events above highlight upcoming windows of opportunity.
                        Focus on the 'Growth Focus' remedy to maximize the potential of these periods."
                    </p>
                </div>

            </CardContent>
        </Card>
    );
}
