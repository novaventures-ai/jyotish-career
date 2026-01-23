import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useGuestChart } from "@/contexts/GuestChartContext";
import {
  Sparkles,
  ArrowLeft,
  Gem,
  Flower2,
  BookOpen,
  Heart,
  Save,
  Brain,
  CheckCircle2
} from "lucide-react";
import { Link } from "wouter";

export default function Remedies() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { guestChart, hasGuestChart } = useGuestChart();

  // For authenticated users
  const { data: profiles, isLoading: profilesLoading } = trpc.profile.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const primaryProfile = profiles?.find(p => p.isPrimary) || profiles?.[0];

  // Fetch Master Analysis (Auth)
  const { data: authAnalysis, isLoading: authAnalysisLoading } = trpc.chart.getMasterAnalysis.useQuery(
    { profileId: primaryProfile?.id || 0 },
    { enabled: !!primaryProfile && isAuthenticated }
  );

  // Fetch Master Analysis (Guest)
  const guestInput = guestChart?.birthData ? {
    birthDate: guestChart.birthData.birthDate,
    birthTime: guestChart.birthData.birthTime,
    birthPlace: guestChart.birthData.birthPlace,
    latitude: guestChart.birthData.latitude,
    longitude: guestChart.birthData.longitude,
    timezoneOffset: guestChart.birthData.timezoneOffset || 0, // Fallback if missing, though it should be there. Zod expects number.
    ayanamsa: guestChart.birthData.ayanamsa as any
  } : null;

  const { data: guestAnalysis, isLoading: guestAnalysisLoading } = trpc.chart.getGuestMasterAnalysis.useQuery(
    guestInput as any,
    { enabled: !!guestInput && !isAuthenticated }
  );

  // Derive final remedy data
  const advancedRemedies = isAuthenticated
    ? authAnalysis?.remedies
    : guestAnalysis?.remedies;

  // Structure: { behavioral: [], standard: [], gemstones: [], weakPlanets: [] }

  const isLoading = authLoading || (isAuthenticated ? profilesLoading || authAnalysisLoading : guestAnalysisLoading);
  const hasData = isAuthenticated ? !!primaryProfile : hasGuestChart;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="max-w-4xl w-full space-y-6">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!hasData || !advancedRemedies) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Analysis Pending</h2>
            <p className="text-muted-foreground mb-4">
              We need to analyze your chart to generate personalized remedies.
            </p>
            <Button asChild>
              <Link href="/onboarding">Analyze Chart</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <h1 className="font-semibold">Remedies & Corrections</h1>
            <p className="text-sm text-muted-foreground">Holistic measures for life balance</p>
          </div>
          {!isAuthenticated && hasGuestChart && (
            <Button variant="outline" size="sm" onClick={() => window.location.href = getLoginUrl()}>
              <Save className="w-4 h-4 mr-2" />
              Sign In to Save
            </Button>
          )}
        </div>
      </header>

      <main className="container py-6 max-w-5xl mx-auto">

        {/* Top Overview: Weak Planets */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Corrective Measures
            </h2>
            <p className="text-muted-foreground">
              Focusing on {advancedRemedies.strengtheningFocus || "Balance"}
            </p>
          </div>
          {advancedRemedies.weakPlanets?.length > 0 && (
            <div className="flex gap-2 items-center bg-secondary/30 px-4 py-2 rounded-full border">
              <span className="text-xs font-bold uppercase text-muted-foreground">Focus Areas:</span>
              {advancedRemedies.weakPlanets.map((p: string) => (
                <Badge key={p} variant="destructive" className="text-xs">
                  {p}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Tabs defaultValue="behavioral" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1 bg-muted/20 gap-1">
            <TabsTrigger value="behavioral" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5">
              <Brain className="w-4 h-4 mr-2" /> Behavioral
            </TabsTrigger>
            <TabsTrigger value="gemstones" className="py-2.5">
              <Gem className="w-4 h-4 mr-2" /> Gemstones
            </TabsTrigger>
            <TabsTrigger value="mantras" className="py-2.5">
              <BookOpen className="w-4 h-4 mr-2" /> Mantras
            </TabsTrigger>
            <TabsTrigger value="rituals" className="py-2.5">
              <Flower2 className="w-4 h-4 mr-2" /> Rituals
            </TabsTrigger>
            <TabsTrigger value="charity" className="py-2.5">
              <Heart className="w-4 h-4 mr-2" /> Charity
            </TabsTrigger>
          </TabsList>

          {/* 1. BEHAVIORAL REMEDIES (NEW) */}
          <TabsContent value="behavioral" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid md:grid-cols-2 gap-6">
              {advancedRemedies.behavioral?.map((remedy: any, idx: number) => (
                <Card key={idx} className={`border-l-4 shadow-sm hover:shadow-md transition-all ${remedy.priority === 'High' ? 'border-l-red-500 bg-red-50/10 dark:bg-red-900/10' : 'border-l-blue-500 bg-blue-50/10 dark:bg-blue-900/10'
                  }`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold">{remedy.title}</CardTitle>
                      {remedy.priority === 'High' && <Badge variant="outline" className="border-red-200 text-red-600">High Priority</Badge>}
                    </div>
                    <CardDescription className="text-base">{remedy.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">

                    <div className="bg-background/80 p-3 rounded-md border border-dashed">
                      <h4 className="flex items-center text-sm font-semibold text-primary mb-2">
                        <Brain className="w-4 h-4 mr-2" />
                        Psychological Shift
                      </h4>
                      <p className="text-sm italic text-muted-foreground">
                        "{remedy.psychologicalShift}"
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3 flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Actionable Steps
                      </h4>
                      <ul className="space-y-2">
                        {remedy.actionableSteps?.map((step: string, sIdx: number) => (
                          <li key={sIdx} className="text-sm flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!advancedRemedies.behavioral || advancedRemedies.behavioral.length === 0) && (
                <div className="col-span-2 text-center py-12 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No major behavioral corrections needed currently. Maintain a balanced lifestyle.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* 2. GEMSTONES */}
          <TabsContent value="gemstones" className="animate-in fade-in slide-in-from-bottom-2">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {advancedRemedies.gemstones?.map((gem: any, idx: number) => (
                <Card key={idx} className="overflow-hidden border-t-4 border-t-amber-500">
                  <CardHeader className="bg-muted/30 pb-3">
                    <CardTitle className="flex justify-between items-center text-lg">
                      {gem.gem}
                      <Badge variant="secondary">{gem.planet}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b border-dashed">
                      <span className="text-muted-foreground">Metal</span>
                      <span className="font-medium">{gem.metal}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dashed">
                      <span className="text-muted-foreground">Wear Day</span>
                      <span className="font-medium">{gem.wearDay}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 bg-amber-50/50 p-2 rounded">
                      ⚠️ Consult a qualified gemologist before wearing highly potent stones.
                    </p>
                  </CardContent>
                </Card>
              ))}
              {(!advancedRemedies.gemstones || advancedRemedies.gemstones.length === 0) && (
                <div className="col-span-3 text-center py-12 text-muted-foreground">
                  <Gem className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No gemstone recommendations found.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* 3. MANTRAS */}
          <TabsContent value="mantras" className="animate-in fade-in slide-in-from-bottom-2">
            <div className="grid md:grid-cols-2 gap-4">
              {advancedRemedies.standard?.filter((r: any) => r.type === 'Mantra').map((r: any, idx: number) => (
                <Card key={idx}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center justify-between">
                      Chant for {r.planet}
                      <Badge variant="outline">{r.type}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-serif text-primary italic mb-4 bg-primary/5 p-3 rounded text-center border">
                      {r.instructions?.[0]?.replace(/Recite "(.*)" \d+ times/, "$1") || r.description}
                    </p>
                    <ul className="text-sm space-y-1 text-muted-foreground pl-4 list-disc">
                      {r.instructions?.map((inst: string, i: number) => <li key={i}>{inst}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 4. RITUALS & CHARTIY (Combined logic for simplicity updates) */}
          <TabsContent value="rituals" className="animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-4">
              {advancedRemedies.standard?.filter((r: any) => r.type === 'Ritual').length === 0 && <p className="text-center text-muted-foreground">No specific rituals suggested.</p>}
              {/* Display logic similar to mantras if we had ritual data in 'standard' array */}
            </div>
          </TabsContent>
          <TabsContent value="charity" className="animate-in fade-in slide-in-from-bottom-2">
            <div className="grid md:grid-cols-2 gap-4">
              {advancedRemedies.standard?.filter((r: any) => r.type === 'Charity').map((r: any, idx: number) => (
                <Card key={idx} className="bg-emerald-50/30 border-emerald-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Heart className="w-4 h-4 text-emerald-600" />
                      Donation for {r.planet}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium mb-2">{r.description}</p>
                    <ul className="text-sm space-y-1 text-muted-foreground pl-4 list-disc">
                      {r.instructions?.map((inst: string, i: number) => <li key={i}>{inst}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
