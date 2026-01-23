
import React from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { useGuestChart } from "@/contexts/GuestChartContext";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import {
    ShieldCheck,
    AlertTriangle,
    Target,
    Zap,
    ArrowLeft,
    ChevronDown,
    Save,
    Info,
    CheckCircle2,
    XCircle,
    Lightbulb,
    Shield
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

import { useState } from 'react';
import { toast } from "sonner";
import { Loader2, Sparkles, BrainCircuit, TrendingUp } from "lucide-react";

export default function SwotAnalysis() {
    const { loading: authLoading, isAuthenticated } = useAuth();
    const { guestChart, hasGuestChart } = useGuestChart();

    // Data Fetching Logic (Same as Remedies Page)
    const { data: profiles, isLoading: profilesLoading } = trpc.profile.list.useQuery(
        undefined,
        { enabled: isAuthenticated }
    );
    const primaryProfile = profiles?.find(p => p.isPrimary) || profiles?.[0];

    const { data: authAnalysis, isLoading: authAnalysisLoading } = trpc.chart.getMasterAnalysis.useQuery(
        { profileId: primaryProfile?.id || 0 },
        { enabled: !!primaryProfile && isAuthenticated }
    );

    const guestInput = guestChart?.birthData ? {
        birthDate: guestChart.birthData.birthDate,
        birthTime: guestChart.birthData.birthTime,
        birthPlace: guestChart.birthData.birthPlace,
        latitude: guestChart.birthData.latitude,
        longitude: guestChart.birthData.longitude,
        timezoneOffset: guestChart.birthData.timezoneOffset || 0,
        ayanamsa: (guestChart.birthData.ayanamsa as any) || "lahiri"
    } : null;

    const { data: guestAnalysis, isLoading: guestAnalysisLoading } = trpc.chart.getGuestMasterAnalysis.useQuery(
        guestInput as any,
        { enabled: !!guestInput && !isAuthenticated }
    );

    const swotData = isAuthenticated ? authAnalysis?.swot : guestAnalysis?.swot;
    const isLoading = authLoading || (isAuthenticated ? profilesLoading || authAnalysisLoading : guestAnalysisLoading);
    const hasData = isAuthenticated ? !!primaryProfile : hasGuestChart;

    const [strategy, setStrategy] = useState<any>(null);
    const strategyMutation = trpc.ai.getSwotAnalysis.useMutation({
        onSuccess: (data) => {
            setStrategy(data);
            toast.success("Strategic insights generated!");
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const handleGenerateStrategy = () => {
        if (isAuthenticated && primaryProfile?.id) {
            strategyMutation.mutate({ profileId: primaryProfile.id });
        } else if (guestChart?.chartData) {
            strategyMutation.mutate({ chartData: guestChart.chartData });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-4 flex items-center justify-center">
                <div className="max-w-6xl w-full space-y-6">
                    <Skeleton className="h-12 w-64" />
                    <div className="grid md:grid-cols-2 gap-4">
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                    </div>
                </div>
            </div>
        );
    }

    if (!hasData || !swotData) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="max-w-md text-center p-8">
                    <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h2 className="text-xl font-bold mb-2">Analysis Pending</h2>
                    <p className="text-muted-foreground mb-6">Create your chart to unlock your comprehensive SWOT analysis.</p>
                    <Button asChild>
                        <Link href="/onboarding">Get Started</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    // Helper for rendering sections
    const SwotSection = ({ title, icon: Icon, items, colorClass, bgClass, emptyMsg, type }: any) => (
        <Card className={`border-l-4 ${colorClass} h-full`}>
            <CardHeader className={`${bgClass} pb-3`}>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="w-5 h-5" />
                    {title}
                    <span className="ml-auto text-xs font-normal opacity-70 bg-background/50 px-2 py-1 rounded-full">
                        {items?.length || 0} Factors
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {items?.length === 0 && <p className="text-muted-foreground text-sm italic">{emptyMsg}</p>}

                <Accordion type="single" collapsible className="w-full">
                    {items?.map((item: any, i: number) => (
                        <AccordionItem key={i} value={`item-${i}`} className="border-b-0 mb-2 last:mb-0">
                            <div className="bg-background/50 rounded-lg border p-1">
                                <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50 rounded-md transition-colors">
                                    <div className="flex flex-col items-start text-left gap-1 w-full">
                                        <div className="flex justify-between w-full items-center pr-2">
                                            <span className="font-semibold text-sm">{item.title}</span>
                                            {/* Impact Score Dot */}
                                            <div className="flex items-center gap-1.5" title="Impact Score">
                                                <div className="flex gap-0.5">
                                                    {[...Array(Math.min(3, Math.ceil(item.impactScore / 3)))].map((_, idx) => (
                                                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${colorClass.replace('border-l-', 'bg-')}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-muted-foreground line-clamp-1 font-normal">
                                            {item.description}
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 pb-3 pt-1">
                                    <div className="mt-2 text-sm text-foreground/90 space-y-3">
                                        <p>{item.description}</p>

                                        <div className={`p-3 rounded-md text-sm font-medium flex items-start gap-2 ${bgClass}`}>
                                            {type === 'Strength' && <Zap className="w-4 h-4 mt-0.5 shrink-0" />}
                                            {type === 'Weakness' && <Shield className="w-4 h-4 mt-0.5 shrink-0" />}
                                            {type === 'Opportunity' && <Target className="w-4 h-4 mt-0.5 shrink-0" />}
                                            {type === 'Threat' && <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />}

                                            <div>
                                                <span className="opacity-70 text-xs uppercase tracking-wide block mb-0.5">
                                                    {type === 'Strength' ? 'How to Leverage' :
                                                        type === 'Weakness' ? 'How to Overcome' :
                                                            type === 'Opportunity' ? 'How to Capture' : 'How to Mitigate'}
                                                </span>
                                                {item.actionableAdvice}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {item.tags.map((tag: string) => (
                                                <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-1.5">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </div>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-border/50">
                <div className="container flex items-center gap-4 h-16">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <h1 className="font-semibold">Cosmic SWOT Analysis</h1>
                        <p className="text-sm text-muted-foreground">Strategic chart assessment</p>
                    </div>
                    {!isAuthenticated && hasGuestChart && (
                        <Button variant="outline" size="sm" onClick={() => window.location.href = getLoginUrl()}>
                            <Save className="w-4 h-4 mr-2" />
                            Sign In to Save
                        </Button>
                    )}
                </div>
            </header>

            <main className="container py-8 max-w-7xl mx-auto">
                <div className="mb-8 max-w-3xl">
                    <h2 className="text-3xl font-bold mb-3">Strategic Life Overview</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        {swotData.summary}
                    </p>
                </div>

                {/* AI Strategic Coach */}
                <Card className="bg-gradient-to-r from-indigo-900/10 to-purple-900/10 border-indigo-500/20 mb-10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-indigo-600" />
                            AI Strategic Coach
                        </CardTitle>
                        <CardDescription>
                            Get an executive summary and actionable strategic advice based on your SWOT analysis.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!strategy ? (
                            <div className="flex justify-center py-6">
                                <Button
                                    onClick={handleGenerateStrategy}
                                    size="lg"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    disabled={strategyMutation.isPending}
                                >
                                    {strategyMutation.isPending ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing Strategy...</>
                                    ) : (
                                        <><Sparkles className="w-4 h-4 mr-2" /> Generate Executive Strategy</>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="p-4 bg-background/60 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                                    <h3 className="font-semibold text-indigo-600 mb-2 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> Executive Summary
                                    </h3>
                                    <p className="text-sm leading-relaxed text-foreground/90 italic">
                                        "{strategy.executiveSummary}"
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-semibold text-amber-600 mb-3 flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4" /> Key Insight
                                        </h3>
                                        <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded border border-amber-200 dark:border-amber-800 text-sm">
                                            {strategy.keyInsight}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                                            <Target className="w-4 h-4" /> Strategic Moves
                                        </h3>
                                        <ul className="space-y-2">
                                            {strategy.strategicAdvice.map((advice: string, i: number) => (
                                                <li key={i} className="text-sm flex items-start gap-2">
                                                    <CheckCircle2 className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                                                    <span>{advice}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                    {/* Strengths */}
                    <SwotSection
                        title="Strengths (Internal)"
                        icon={CheckCircle2}
                        items={swotData.strengths}
                        type="Strength"
                        colorClass="border-l-emerald-500"
                        bgClass="bg-emerald-500/10"
                        emptyMsg="No major inherent strengths flagged; focus on building opportunities."
                    />

                    {/* Weaknesses */}
                    <SwotSection
                        title="Weaknesses (Internal)"
                        icon={XCircle}
                        items={swotData.weaknesses}
                        type="Weakness"
                        colorClass="border-l-rose-500"
                        bgClass="bg-rose-500/10"
                        emptyMsg="No major weaknesses detected. Keep maintaining balance."
                    />

                    {/* Opportunities */}
                    <SwotSection
                        title="Opportunities (External)"
                        icon={Lightbulb}
                        items={swotData.opportunities}
                        type="Opportunity"
                        colorClass="border-l-blue-500"
                        bgClass="bg-blue-500/10"
                        emptyMsg="Current transits are neutral. Prepare for future cycles."
                    />

                    {/* Threats */}
                    <SwotSection
                        title="Threats (External)"
                        icon={AlertTriangle}
                        items={swotData.threats}
                        type="Threat"
                        colorClass="border-l-amber-500"
                        bgClass="bg-amber-500/10"
                        emptyMsg="No immediate external threats appearing."
                    />
                </div>
            </main>
        </div>
    );
}
