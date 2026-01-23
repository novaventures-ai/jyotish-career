import React, { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useGuestChart } from "@/contexts/GuestChartContext";
import {
  Clock,
  ArrowLeft,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Save,
  Star,
  Info
} from "lucide-react";
import { Link } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PLANET_COLORS: Record<string, string> = {
  Sun: "bg-amber-500",
  Moon: "bg-slate-300",
  Mars: "bg-red-500",
  Mercury: "bg-emerald-500",
  Jupiter: "bg-yellow-500",
  Venus: "bg-pink-400",
  Saturn: "bg-indigo-600",
  Rahu: "bg-slate-700",
  Ketu: "bg-orange-600"
};

const DASHA_PERIODS: Record<string, number> = {
  "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
  "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17
};

interface DashaPeriod {
  planet: string;
  startDate: Date | string;
  endDate: Date | string;
  years: number;
  subPeriods?: DashaPeriod[];
}

// Generate Dasha timeline from birth data
function generateDashaTimeline(chartData: any): DashaPeriod[] {
  if (!chartData?.birthData?.date) {
    return [];
  }

  // Get Moon's nakshatra from chart data
  const moonPlanet = chartData?.d1?.planets?.find((p: any) => p.planet === "Moon");
  if (!moonPlanet) {
    return generateDefaultDashaTimeline(chartData.birthData.date);
  }

  const nakshatraIndex = moonPlanet.nakshatraIndex || 0;

  // Nakshatra lords in order
  const nakshatraLords = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
    "Jupiter", "Saturn", "Mercury", "Ketu", "Venus", "Sun",
    "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
    "Jupiter", "Saturn", "Mercury"
  ];

  const nakshatraLord = nakshatraLords[nakshatraIndex] || "Ketu";

  // Calculate dasha balance based on Moon's position in nakshatra
  const moonDegree = moonPlanet.degree || 0;
  const nakshatraSpan = 13.333; // 13°20'
  const positionInNakshatra = moonDegree % nakshatraSpan;
  const portionTraversed = positionInNakshatra / nakshatraSpan;
  const remainingPortion = 1 - portionTraversed;

  const dashaPeriod = DASHA_PERIODS[nakshatraLord];
  const balanceYears = dashaPeriod * remainingPortion;

  // Dasha sequence starting from nakshatra lord
  const dashaSequence = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
  ];

  const startIndex = dashaSequence.indexOf(nakshatraLord);
  const orderedSequence = [
    ...dashaSequence.slice(startIndex),
    ...dashaSequence.slice(0, startIndex)
  ];

  const dashas: DashaPeriod[] = [];
  const birthDate = new Date(chartData.birthData.date);
  let currentDate = new Date(birthDate);

  // First dasha with balance
  const balanceDays = balanceYears * 365.25;
  const firstEndDate = new Date(currentDate.getTime() + balanceDays * 24 * 60 * 60 * 1000);

  dashas.push({
    planet: orderedSequence[0],
    startDate: new Date(currentDate),
    endDate: firstEndDate,
    years: balanceYears,
    subPeriods: generateAntardashas(orderedSequence[0], currentDate, firstEndDate, balanceYears)
  });

  currentDate = new Date(firstEndDate);

  // Subsequent dashas (full periods)
  for (let i = 1; i < 9; i++) {
    const planet = orderedSequence[i];
    const years = DASHA_PERIODS[planet];
    const days = years * 365.25;
    const endDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);

    dashas.push({
      planet,
      startDate: new Date(currentDate),
      endDate,
      years,
      subPeriods: generateAntardashas(planet, currentDate, endDate, years)
    });

    currentDate = new Date(endDate);
  }

  return dashas;
}

function generateAntardashas(
  mahadashaLord: string,
  startDate: Date,
  endDate: Date,
  totalYears: number
): DashaPeriod[] {
  const dashaSequence = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
  ];

  const startIndex = dashaSequence.indexOf(mahadashaLord);
  const orderedSequence = [
    ...dashaSequence.slice(startIndex),
    ...dashaSequence.slice(0, startIndex)
  ];

  const antardashas: DashaPeriod[] = [];
  let currentDate = new Date(startDate);

  for (const planet of orderedSequence) {
    const antarYears = (totalYears * DASHA_PERIODS[planet]) / 120;
    const antarDays = antarYears * 365.25;
    const antarEndDate = new Date(currentDate.getTime() + antarDays * 24 * 60 * 60 * 1000);

    antardashas.push({
      planet,
      startDate: new Date(currentDate),
      endDate: antarEndDate,
      years: antarYears
    });

    currentDate = new Date(antarEndDate);
  }

  return antardashas;
}

function generateDefaultDashaTimeline(birthDateStr: string): DashaPeriod[] {
  const dashaSequence = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
  ];

  const dashas: DashaPeriod[] = [];
  const birthDate = new Date(birthDateStr);
  let currentDate = new Date(birthDate);

  for (const planet of dashaSequence) {
    const years = DASHA_PERIODS[planet];
    const days = years * 365.25;
    const endDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);

    dashas.push({
      planet,
      startDate: new Date(currentDate),
      endDate,
      years,
      subPeriods: generateAntardashas(planet, currentDate, endDate, years)
    });

    currentDate = new Date(endDate);
  }

  return dashas;
}

function getCurrentDashaFromTimeline(dashas: DashaPeriod[]): {
  mahadasha: string;
  mahadashaStart: Date;
  mahadashaEnd: Date;
  antardasha: string;
  antardashaStart: Date;
  antardashaEnd: Date;
  progress: number;
} | null {
  const now = new Date();

  for (const dasha of dashas) {
    const startDate = new Date(dasha.startDate);
    const endDate = new Date(dasha.endDate);

    if (now >= startDate && now <= endDate) {
      // Calculate progress
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const progress = Math.round((elapsed / totalDuration) * 100);

      // Find current antardasha
      let antardasha = dasha.planet;
      let antardashaStart = startDate;
      let antardashaEnd = endDate;

      if (dasha.subPeriods) {
        for (const antar of dasha.subPeriods) {
          const antarStart = new Date(antar.startDate);
          const antarEnd = new Date(antar.endDate);

          if (now >= antarStart && now <= antarEnd) {
            antardasha = antar.planet;
            antardashaStart = antarStart;
            antardashaEnd = antarEnd;
            break;
          }
        }
      }

      return {
        mahadasha: dasha.planet,
        mahadashaStart: startDate,
        mahadashaEnd: endDate,
        antardasha,
        antardashaStart,
        antardashaEnd,
        progress
      };
    }
  }

  return null;
}

export default function Timing() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { guestChart, hasGuestChart } = useGuestChart();

  // For authenticated users
  const { data: profiles, isLoading: profilesLoading } = trpc.profile.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const primaryProfile = profiles?.find(p => p.isPrimary) || profiles?.[0];

  // Get chart data from appropriate source
  const chartData = isAuthenticated
    ? (primaryProfile?.chartData as any)
    : guestChart?.chartData;

  // Generate dasha timeline from chart data
  const dashaTimeline = useMemo(() => {
    if (!chartData) return [];

    // First check if dashas are already in chart data (from backend calculation)
    if (Array.isArray(chartData?.dashas)) {
      return chartData.dashas;
    }
    // Legacy structure check
    if (chartData?.dashas?.mahadashas && chartData.dashas.mahadashas.length > 0) {
      return chartData.dashas.mahadashas;
    }

    // Otherwise generate from birth data (fallback)
    return generateDashaTimeline(chartData);
  }, [chartData]);

  // Get current dasha
  const currentDasha = useMemo(() => {
    if (dashaTimeline.length === 0) return null;

    // First check if currentDasha is in chart data
    if (chartData?.currentDasha) {
      // Calculate progress
      const mahadasha = dashaTimeline.find((d: any) => d.planet === chartData.currentDasha.mahadasha);
      if (mahadasha) {
        const startDate = new Date(mahadasha.startDate);
        const endDate = new Date(mahadasha.endDate);
        const now = new Date();
        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsed = now.getTime() - startDate.getTime();
        const progress = Math.max(0, Math.min(100, Math.round((elapsed / totalDuration) * 100)));

        return {
          ...chartData.currentDasha,
          mahadashaStart: startDate,
          mahadashaEnd: endDate,
          progress
        };
      }
    }

    return getCurrentDashaFromTimeline(dashaTimeline);
  }, [dashaTimeline, chartData]);

  const [expandedDasha, setExpandedDasha] = useState<number | null>(null);
  const toggleDasha = (index: number) => setExpandedDasha(expandedDasha === index ? null : index);

  const isLoading = authLoading || (isAuthenticated && profilesLoading);
  const hasData = isAuthenticated ? !!primaryProfile : hasGuestChart;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!hasData || !chartData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Profile Found</h2>
            <p className="text-muted-foreground mb-4">
              Create your birth chart to see timing predictions.
            </p>
            <Button asChild>
              <Link href="/onboarding">Create Chart</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center gap-4 h-16">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">Timing & Opportunities</h1>
            <p className="text-sm text-muted-foreground">Dasha periods and career timing</p>
          </div>
          {!isAuthenticated && hasGuestChart && (
            <Button variant="outline" size="sm" onClick={() => window.location.href = getLoginUrl()}>
              <Save className="w-4 h-4 mr-2" />
              Sign In to Save
            </Button>
          )}
        </div>
      </header>

      <main className="container py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Guest mode banner */}
          {!isAuthenticated && hasGuestChart && (
            <Card className="border-amber-500/50 bg-amber-500/10">
              <CardContent className="p-4 flex items-center gap-3">
                <Save className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Guest Mode</p>
                  <p className="text-sm text-amber-700">Sign in to save your timing analysis and receive notifications</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Period */}
          <Card className="cosmic-gradient text-white">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Current Planetary Period
              </h2>

              {currentDasha ? (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/10 rounded-lg">
                      <p className="text-white/80 text-sm mb-1">Mahadasha (Major Period)</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${PLANET_COLORS[currentDasha.mahadasha]}`} />
                        <span className="text-xl font-bold">{currentDasha.mahadasha}</span>
                      </div>
                      {currentDasha.mahadashaEnd && (
                        <p className="text-white/60 text-xs mt-1">
                          Until {formatDate(currentDasha.mahadashaEnd)}
                        </p>
                      )}
                    </div>
                    <div className="p-4 bg-white/10 rounded-lg">
                      <p className="text-white/80 text-sm mb-1">Antardasha (Sub Period)</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${PLANET_COLORS[currentDasha.antardasha]}`} />
                        <span className="text-xl font-bold">{currentDasha.antardasha}</span>
                      </div>
                      {currentDasha.antardashaEnd && (
                        <p className="text-white/60 text-xs mt-1">
                          Until {formatDate(currentDasha.antardashaEnd)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-white/80">Mahadasha Progress</span>
                      <span className="font-medium">{currentDasha.progress}%</span>
                    </div>
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${currentDasha.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/60 mt-1">
                      <span>{formatDate(currentDasha.mahadashaStart)}</span>
                      <span>{formatDate(currentDasha.mahadashaEnd)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-white/80">Calculating dasha periods...</p>
              )}
            </CardContent>
          </Card>

          {/* Period Interpretation */}
          {currentDasha && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Period Interpretation
                </CardTitle>
                <CardDescription>
                  What this period means for your career
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    {currentDasha.mahadasha} Mahadasha Effects
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {getPlanetCareerMeaning(currentDasha.mahadasha)}
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-500" />
                    {currentDasha.antardasha} Antardasha Influence
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {getPlanetCareerMeaning(currentDasha.antardasha)}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-green-200 bg-green-50/50 rounded-lg">
                    <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Favorable For
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      {getFavorableActions(currentDasha.mahadasha).map((action, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 border border-yellow-200 bg-yellow-50/50 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      Exercise Caution
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {getCautionAreas(currentDasha.mahadasha).map((area, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mahadasha Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Mahadasha Timeline
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Vimshottari Dasha - 120 year cycle based on Moon's nakshatra</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>
                Your major planetary periods (Vimshottari Dasha)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashaTimeline.length > 0 ? (
                  dashaTimeline.map((dasha: any, i: number) => {
                    const startDate = new Date(dasha.startDate);
                    const endDate = new Date(dasha.endDate);
                    const now = new Date();
                    const isCurrent = now >= startDate && now <= endDate;
                    const isPast = endDate < now;
                    const isFuture = startDate > now;

                    // Calculate progress for current dasha
                    let progress = 0;
                    if (isCurrent) {
                      const totalDuration = endDate.getTime() - startDate.getTime();
                      const elapsed = now.getTime() - startDate.getTime();
                      progress = Math.round((elapsed / totalDuration) * 100);
                    } else if (isPast) {
                      progress = 100;
                    }

                    const isExpanded = expandedDasha === i;

                    return (
                      <div
                        key={i}
                        className={`rounded-lg transition-all duration-200 overflow-hidden ${isExpanded ? "bg-card shadow-md ring-1 ring-primary/20" :
                          isCurrent
                            ? "bg-primary/10 border-2 border-primary"
                            : isPast
                              ? "bg-muted/30 opacity-60 hover:opacity-100"
                              : "bg-muted/50 hover:bg-muted"
                          } cursor-pointer`}
                        onClick={() => toggleDasha(i)}
                      >
                        <div className="p-4 flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full ${PLANET_COLORS[dasha.planet]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                            {dasha.planet.substring(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{dasha.planet}</span>
                              {isCurrent && (
                                <Badge className="bg-primary text-primary-foreground text-xs">Current</Badge>
                              )}
                              {isPast && (
                                <Badge variant="secondary" className="text-xs">Completed</Badge>
                              )}
                              {isFuture && (
                                <Badge variant="outline" className="text-xs">Upcoming</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(startDate)} - {formatDate(endDate)}
                            </p>
                            {isCurrent && !isExpanded && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="font-medium">{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-1.5" />
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-medium">{Math.round(dasha.years * 10) / 10} years</p>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                              {DASHA_PERIODS[dasha.planet]} year period
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>

                        {/* Expanded Antardasha Details */}
                        {isExpanded && dasha.subPeriods && (
                          <div className="px-4 pb-4 pt-0 border-t border-border/50 bg-background/50 animate-in slide-in-from-top-2 duration-200">
                            <div className="py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-2">
                              Antardashas (Sub-periods)
                            </div>
                            <div className="space-y-2 pl-4 border-l-2 border-border ml-6">
                              {dasha.subPeriods.map((sub: any, idx: number) => {
                                const subStart = new Date(sub.startDate);
                                const subEnd = new Date(sub.endDate);
                                const isSubCurrent = now >= subStart && now <= subEnd;

                                return (
                                  <div key={idx} className={`relative pl-4 py-1 ${isSubCurrent ? "text-primary font-medium" : "text-muted-foreground"}`}>
                                    {/* Dot indicator */}
                                    <div className={`absolute -left-[21px] top-2.5 w-2.5 h-2.5 rounded-full border-2 border-background ${isSubCurrent ? "bg-primary" : "bg-muted-foreground/30"}`} />

                                    <div className="flex items-center justify-between">
                                      <span className="text-sm">{sub.planet}</span>
                                      <span className="text-xs tabular-nums">
                                        {formatDate(subStart)} - {formatDate(subEnd)}
                                      </span>
                                    </div>
                                    {isSubCurrent && (
                                      <div className="mt-1 mb-1">
                                        <Progress value={Math.round((now.getTime() - subStart.getTime()) / (subEnd.getTime() - subStart.getTime()) * 100)} className="h-1 bg-primary/20" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Dasha timeline is being calculated...
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please ensure your birth data is complete.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Transitions */}
          {currentDasha && dashaTimeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Upcoming Transitions
                </CardTitle>
                <CardDescription>
                  Important period changes to watch for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getUpcomingTransitions(dashaTimeline, currentDasha).map((transition, i) => (
                    <div key={i} className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${PLANET_COLORS[transition.planet]} flex items-center justify-center text-white text-xs font-bold`}>
                        {transition.planet.substring(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{transition.type}: {transition.planet}</p>
                        <p className="text-xs text-muted-foreground">{transition.date}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {transition.timeUntil}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

// Helper functions
function formatDate(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric"
    });
  } catch {
    return "N/A";
  }
}

function getUpcomingTransitions(dashas: DashaPeriod[], currentDasha: any): Array<{
  type: string;
  planet: string;
  date: string;
  timeUntil: string;
}> {
  const transitions: Array<{
    type: string;
    planet: string;
    date: string;
    timeUntil: string;
  }> = [];

  const now = new Date();

  // Find current mahadasha and its antardashas
  const currentMaha = dashas.find(d => d.planet === currentDasha.mahadasha);

  if (currentMaha?.subPeriods) {
    // Find upcoming antardasha transitions
    for (const antar of currentMaha.subPeriods) {
      const startDate = new Date(antar.startDate);
      if (startDate > now) {
        const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 365 * 2) { // Show transitions within 2 years
          transitions.push({
            type: "Antardasha",
            planet: antar.planet,
            date: formatDate(startDate),
            timeUntil: daysUntil < 30 ? `${daysUntil} days` :
              daysUntil < 365 ? `${Math.round(daysUntil / 30)} months` :
                `${Math.round(daysUntil / 365 * 10) / 10} years`
          });
        }
      }
    }
  }

  // Find next mahadasha
  const currentMahaIndex = dashas.findIndex(d => d.planet === currentDasha.mahadasha);
  if (currentMahaIndex >= 0 && currentMahaIndex < dashas.length - 1) {
    const nextMaha = dashas[currentMahaIndex + 1];
    const startDate = new Date(nextMaha.startDate);
    const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    transitions.push({
      type: "Mahadasha",
      planet: nextMaha.planet,
      date: formatDate(startDate),
      timeUntil: daysUntil < 30 ? `${daysUntil} days` :
        daysUntil < 365 ? `${Math.round(daysUntil / 30)} months` :
          `${Math.round(daysUntil / 365 * 10) / 10} years`
    });
  }

  return transitions.slice(0, 5);
}

function getPlanetCareerMeaning(planet: string): string {
  const meanings: Record<string, string> = {
    Sun: "Period of authority, leadership opportunities, government connections, and recognition. Good for starting businesses or taking leadership roles. Focus on building your personal brand and reputation.",
    Moon: "Focus on public-facing roles, emotional intelligence, nurturing professions, and creative pursuits. Good for hospitality, healthcare, and customer-facing careers. Pay attention to work-life balance.",
    Mars: "High energy period for competitive fields, engineering, sports, real estate, and entrepreneurship. Take initiative but avoid conflicts. Good for technical and action-oriented careers.",
    Mercury: "Excellent for communication, writing, trading, technology, and intellectual pursuits. Good for learning new skills, networking, and analytical work. Business transactions are favored.",
    Jupiter: "Expansion, teaching, consulting, finance, and spiritual pursuits. Favorable for education, publishing, advisory roles, and positions of wisdom. Growth and opportunities abound.",
    Venus: "Creative arts, luxury goods, entertainment, beauty industry, and partnerships. Good for diplomacy, relationship-based careers, and aesthetic pursuits. Financial gains through creativity.",
    Saturn: "Discipline, hard work, and long-term career building. Good for traditional industries, law, and positions requiring persistence. Slow but steady progress with lasting results.",
    Rahu: "Unconventional paths, technology, foreign connections, and rapid growth. Good for innovation, research, and breaking new ground. Be cautious of shortcuts and deception.",
    Ketu: "Spiritual pursuits, research, healing, and letting go of material attachments. Good for specialized technical work, occult sciences, and detachment from worldly success."
  };
  return meanings[planet] || "Period of transformation and growth.";
}

function getFavorableActions(planet: string): string[] {
  const actions: Record<string, string[]> = {
    Sun: ["Starting a business", "Seeking promotions", "Government applications", "Leadership roles", "Building authority"],
    Moon: ["Public relations work", "Creative projects", "Healthcare careers", "Customer service", "Nurturing roles"],
    Mars: ["Physical activities", "Real estate deals", "Technical projects", "Competitive ventures", "Sports careers"],
    Mercury: ["Learning new skills", "Writing and publishing", "Trading activities", "Technology adoption", "Networking"],
    Jupiter: ["Higher education", "Teaching positions", "Financial planning", "Consulting work", "Spiritual growth"],
    Venus: ["Creative pursuits", "Partnership deals", "Beauty/fashion industry", "Diplomatic roles", "Art and music"],
    Saturn: ["Long-term planning", "Building foundations", "Legal matters", "Traditional careers", "Discipline"],
    Rahu: ["Technology ventures", "Foreign opportunities", "Unconventional paths", "Innovation", "Research"],
    Ketu: ["Research work", "Spiritual practices", "Specialized skills", "Letting go of old patterns", "Healing"]
  };
  return actions[planet] || ["General career development"];
}

function getCautionAreas(planet: string): string[] {
  const cautions: Record<string, string[]> = {
    Sun: ["Ego conflicts", "Overconfidence", "Authority clashes", "Burnout"],
    Moon: ["Emotional decisions", "Mood fluctuations", "Over-sensitivity", "Instability"],
    Mars: ["Impulsive actions", "Conflicts with colleagues", "Hasty decisions", "Aggression"],
    Mercury: ["Miscommunication", "Scattered focus", "Overcommitment", "Nervous tension"],
    Jupiter: ["Overexpansion", "Excessive optimism", "Financial overreach", "Complacency"],
    Venus: ["Indulgence", "Relationship complications", "Luxury spending", "Laziness"],
    Saturn: ["Delays and obstacles", "Pessimism", "Overwork", "Depression"],
    Rahu: ["Deception", "Unrealistic expectations", "Shortcuts", "Obsession"],
    Ketu: ["Confusion", "Detachment", "Lack of direction", "Isolation"]
  };
  return cautions[planet] || ["General caution advised"];
}
