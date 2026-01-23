import React, { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useGuestChart } from "@/contexts/GuestChartContext";
import {
  TrendingUp,
  ArrowLeft,
  DollarSign,
  Zap,
  Clock,
  Shuffle,
  CheckCircle,
  Save,
  Info
} from "lucide-react";
import { Link } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Briefcase, AlertTriangle, Lightbulb, XCircle } from "lucide-react";


const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700"
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  active: <Zap className="w-4 h-4" />,
  passive: <Clock className="w-4 h-4" />,
  hybrid: <Shuffle className="w-4 h-4" />
};

interface IncomeStream {
  id: number;
  name: string;
  description: string;
  category: "active" | "passive" | "hybrid";
  riskLevel: "low" | "medium" | "high";
  score?: number;
  reasons?: string[];
  planetarySupport?: string;
  astroLogic?: string[];
}

// Comprehensive income streams database
const INCOME_STREAMS_DATABASE: IncomeStream[] = [
  // Active Income Streams
  { id: 1, name: "Freelancing", description: "Offer your skills on platforms like Upwork, Fiverr", category: "active", riskLevel: "low" },
  { id: 2, name: "Consulting", description: "Provide expert advice in your field of expertise", category: "active", riskLevel: "low" },
  { id: 3, name: "Online Teaching", description: "Teach courses on Udemy, Skillshare, or tutoring platforms", category: "active", riskLevel: "low" },
  { id: 4, name: "Content Creation", description: "YouTube, podcasting, or blogging with monetization", category: "active", riskLevel: "medium" },
  { id: 5, name: "Service Business", description: "Offer services like coaching, design, or development", category: "active", riskLevel: "low" },
  { id: 6, name: "Executive Coaching", description: "Help executives and leaders achieve their goals", category: "active", riskLevel: "low" },
  { id: 7, name: "Technical Writing", description: "Create documentation, guides, and technical content", category: "active", riskLevel: "low" },
  { id: 8, name: "Virtual Assistant", description: "Provide administrative support remotely", category: "active", riskLevel: "low" },

  // Passive Income Streams
  { id: 9, name: "Dividend Investing", description: "Earn regular income from dividend-paying stocks", category: "passive", riskLevel: "medium" },
  { id: 10, name: "Real Estate Rentals", description: "Generate income from rental properties", category: "passive", riskLevel: "medium" },
  { id: 11, name: "Digital Products", description: "Sell ebooks, templates, or courses you create once", category: "passive", riskLevel: "low" },
  { id: 12, name: "Affiliate Marketing", description: "Earn commissions promoting other products", category: "passive", riskLevel: "low" },
  { id: 13, name: "Royalties", description: "Income from intellectual property, music, or books", category: "passive", riskLevel: "low" },
  { id: 14, name: "Index Fund Investing", description: "Long-term wealth building through market index funds", category: "passive", riskLevel: "medium" },
  { id: 15, name: "REITs", description: "Real estate investment trusts for passive property income", category: "passive", riskLevel: "medium" },
  { id: 16, name: "Peer-to-Peer Lending", description: "Earn interest by lending to individuals or businesses", category: "passive", riskLevel: "high" },

  // Hybrid Income Streams
  { id: 17, name: "SaaS Business", description: "Build software products with recurring revenue", category: "hybrid", riskLevel: "high" },
  { id: 18, name: "E-commerce Store", description: "Sell products online through your own store", category: "hybrid", riskLevel: "medium" },
  { id: 19, name: "Dropshipping", description: "E-commerce without inventory management", category: "hybrid", riskLevel: "medium" },
  { id: 20, name: "Agency Model", description: "Build a team to deliver services at scale", category: "hybrid", riskLevel: "medium" },
  { id: 21, name: "Membership Sites", description: "Create exclusive content for paying members", category: "hybrid", riskLevel: "medium" },
  { id: 22, name: "Print on Demand", description: "Sell custom-designed products without inventory", category: "hybrid", riskLevel: "low" },
  { id: 23, name: "App Development", description: "Create mobile apps with in-app purchases or ads", category: "hybrid", riskLevel: "high" },
  { id: 24, name: "Online Courses", description: "Create and sell comprehensive online courses", category: "hybrid", riskLevel: "low" }
];

// Income stream scoring configuration based on planetary influences
const INCOME_SCORING: Record<string, { planets: string[], houses: number[], baseScore: number }> = {
  "Freelancing": { planets: ["Mercury", "Mars"], houses: [3, 6, 10], baseScore: 45 },
  "Consulting": { planets: ["Jupiter", "Mercury"], houses: [9, 10, 11], baseScore: 48 },
  "Online Teaching": { planets: ["Jupiter", "Mercury", "Moon"], houses: [5, 9, 10], baseScore: 46 },
  "Content Creation": { planets: ["Mercury", "Venus", "Moon"], houses: [3, 5, 10], baseScore: 44 },
  "Service Business": { planets: ["Sun", "Mars", "Saturn"], houses: [6, 10, 11], baseScore: 47 },
  "Executive Coaching": { planets: ["Sun", "Jupiter"], houses: [1, 9, 10], baseScore: 45 },
  "Technical Writing": { planets: ["Mercury", "Saturn"], houses: [3, 6, 10], baseScore: 43 },
  "Virtual Assistant": { planets: ["Mercury", "Moon"], houses: [3, 6, 12], baseScore: 42 },
  "Dividend Investing": { planets: ["Saturn", "Jupiter", "Venus"], houses: [2, 8, 11], baseScore: 50 },
  "Real Estate Rentals": { planets: ["Saturn", "Mars", "Venus"], houses: [4, 8, 11], baseScore: 48 },
  "Digital Products": { planets: ["Mercury", "Rahu", "Venus"], houses: [3, 5, 11], baseScore: 46 },
  "Affiliate Marketing": { planets: ["Mercury", "Rahu"], houses: [3, 7, 11], baseScore: 44 },
  "Royalties": { planets: ["Venus", "Jupiter", "Ketu"], houses: [5, 9, 11], baseScore: 43 },
  "Index Fund Investing": { planets: ["Saturn", "Jupiter"], houses: [2, 8, 11], baseScore: 52 },
  "REITs": { planets: ["Saturn", "Venus"], houses: [4, 8, 11], baseScore: 47 },
  "Peer-to-Peer Lending": { planets: ["Mercury", "Rahu"], houses: [2, 8, 11], baseScore: 40 },
  "SaaS Business": { planets: ["Mercury", "Rahu", "Mars"], houses: [3, 10, 11], baseScore: 42 },
  "E-commerce Store": { planets: ["Mercury", "Venus", "Mars"], houses: [3, 7, 10], baseScore: 45 },
  "Dropshipping": { planets: ["Mercury", "Rahu"], houses: [3, 7, 11], baseScore: 43 },
  "Agency Model": { planets: ["Sun", "Mars", "Mercury"], houses: [7, 10, 11], baseScore: 46 },
  "Membership Sites": { planets: ["Moon", "Jupiter", "Mercury"], houses: [5, 9, 11], baseScore: 44 },
  "Print on Demand": { planets: ["Venus", "Mercury"], houses: [3, 5, 11], baseScore: 42 },
  "App Development": { planets: ["Mercury", "Rahu", "Mars"], houses: [3, 5, 10], baseScore: 41 },
  "Online Courses": { planets: ["Jupiter", "Mercury", "Moon"], houses: [5, 9, 11], baseScore: 47 }
};

// Generate income recommendations based on chart data
function generateIncomeRecommendations(chartData: any): IncomeStream[] {
  if (!chartData?.d1?.planets) return [];

  const planets = chartData.d1.planets;

  // Create planet position map
  const planetPositions: Record<string, { house: number, sign: string, isRetrograde: boolean }> = {};
  planets.forEach((p: any) => {
    planetPositions[p.planet] = { house: p.house, sign: p.sign, isRetrograde: p.isRetrograde };
  });

  // House strength multipliers
  const houseStrength: Record<number, number> = {
    1: 1.4, 4: 1.3, 7: 1.3, 10: 1.5, // Angular (Kendra)
    2: 1.2, 5: 1.3, 8: 0.9, 11: 1.4, // Succedent (11th is gains)
    3: 1.1, 6: 0.9, 9: 1.3, 12: 0.7  // Cadent
  };

  const scoredStreams: IncomeStream[] = INCOME_STREAMS_DATABASE.map(stream => {
    const config = INCOME_SCORING[stream.name];
    if (!config) return { ...stream, score: 50, reasons: ["General opportunity"] };

    let score = config.baseScore;
    const reasons: string[] = [];
    const astroLogicSet = new Set<string>();
    let planetarySupport = "";

    // Check planetary support (max 30 points)
    let planetBonus = 0;
    config.planets.forEach((planet, idx) => {
      const pos = planetPositions[planet];
      if (pos) {
        const strength = houseStrength[pos.house] || 1.0;
        const weight = idx === 0 ? 1.0 : 0.6; // Primary planet weighted more

        // Add basic trace
        if (config.houses.includes(pos.house)) {
          astroLogicSet.add(`${planet} in ${pos.house}th House (Favorable)`);
        } else if ([1, 4, 7, 10].includes(pos.house)) {
          astroLogicSet.add(`${planet} in Kendra (Strength)`);
        } else if ([5, 9].includes(pos.house)) {
          astroLogicSet.add(`${planet} in Trikona (Luck)`);
        } else if ([2, 11].includes(pos.house)) {
          astroLogicSet.add(`${planet} in Wealth House (${pos.house}th)`);
        }

        // Check if planet is in favorable house for this income type
        if (config.houses.includes(pos.house)) {
          planetBonus += 12 * weight * strength;
          if (idx === 0) {
            reasons.push(`${planet} supports in House ${pos.house}`);
            planetarySupport = `${planet} in House ${pos.house}`;
          }
        } else {
          planetBonus += 5 * weight * strength;
        }

        // Retrograde bonus for passive income
        if (pos.isRetrograde && stream.category === "passive") {
          planetBonus += 3;
          astroLogicSet.add(`${planet} Retrograde (Deep Review)`);
        }
      }
    });

    // Check D2 (Wealth) if available
    if (chartData.d2?.planets) {
      config.planets.forEach(planet => {
        const d2P = chartData.d2.planets.find((p: any) => p.planet === planet);
        if (d2P && [2, 11].includes(d2P.house)) {
          score += 5;
          astroLogicSet.add(`${planet} strong in D2 (Wealth)`);
        }
      });
    }

    // Check D10 (Career) if available
    if (chartData.d10?.planets) {
      config.planets.forEach(planet => {
        const d10P = chartData.d10.planets.find((p: any) => p.planet === planet);
        if (d10P && [1, 10].includes(d10P.house)) {
          score += 5;
          astroLogicSet.add(`${planet} strong in D10 (Career)`);
        }
      });
    }
    score += Math.min(planetBonus, 30);

    // Check house placements (max 15 points)
    let houseBonus = 0;
    config.houses.forEach(house => {
      const planetsInHouse = planets.filter((p: any) => p.house === house);
      if (planetsInHouse.length > 0) {
        houseBonus += 5 * planetsInHouse.length;
        if (reasons.length < 3) {
          reasons.push(`House ${house} activated`);
        }
      }
    });
    score += Math.min(houseBonus, 15);

    // Category-specific bonuses based on chart patterns
    if (stream.category === "passive") {
      // Check 8th house for passive income
      const eighthHousePlanets = planets.filter((p: any) => p.house === 8);
      if (eighthHousePlanets.length > 0) {
        score += 5;
      }
      // Saturn strength for long-term passive income
      const saturn = planetPositions["Saturn"];
      if (saturn && [2, 4, 8, 10, 11].includes(saturn.house)) {
        score += 5;
        if (reasons.length < 3) reasons.push("Saturn supports stability");
      }
    } else if (stream.category === "active") {
      // Mars and Sun for active income
      const mars = planetPositions["Mars"];
      const sun = planetPositions["Sun"];
      if (mars && [1, 3, 6, 10].includes(mars.house)) {
        score += 4;
      }
      if (sun && [1, 10, 11].includes(sun.house)) {
        score += 4;
      }
    } else if (stream.category === "hybrid") {
      // Mercury and Rahu for innovative hybrid income
      const mercury = planetPositions["Mercury"];
      const rahu = planetPositions["Rahu"];
      if (mercury && [3, 5, 10, 11].includes(mercury.house)) {
        score += 4;
      }
      if (rahu && [3, 10, 11].includes(rahu.house)) {
        score += 4;
        if (reasons.length < 3) reasons.push("Rahu favors innovation");
      }
    }

    // Risk tolerance based on chart
    const jupiter = planetPositions["Jupiter"];
    const saturn = planetPositions["Saturn"];
    if (stream.riskLevel === "high") {
      // High risk needs Jupiter protection
      if (jupiter && [1, 5, 9, 11].includes(jupiter.house)) {
        score += 5;
      } else {
        score -= 5;
      }
    } else if (stream.riskLevel === "low") {
      // Low risk favored by Saturn
      if (saturn && [2, 4, 10, 11].includes(saturn.house)) {
        score += 3;
      }
    }

    // Ensure score is within bounds (35-92)
    const finalScore = Math.max(35, Math.min(Math.round(score), 92));

    return {
      ...stream,
      score: finalScore,
      reasons: reasons.slice(0, 3),
      planetarySupport,
      astroLogic: Array.from(astroLogicSet).slice(0, 5)
    };
  });

  // Sort by score
  return scoredStreams.sort((a, b) => (b.score || 0) - (a.score || 0));
}

// Generate wealth indicators from chart
function generateWealthIndicators(chartData: any) {
  if (!chartData?.d1?.houses || !chartData?.d1?.planets) {
    return {
      secondHouse: "Analyzing...",
      eleventhHouse: "Analyzing...",
      incomeStyle: "Multiple Streams",
      wealthYogas: []
    };
  }

  const planets = chartData.d1.planets || [];

  // Check 2nd house strength (wealth accumulation)
  const secondHousePlanets = planets.filter((p: any) => p.house === 2);
  const beneficsIn2nd = secondHousePlanets.filter((p: any) =>
    ["Jupiter", "Venus", "Mercury", "Moon"].includes(p.planet)
  );
  const secondHouseStrength = beneficsIn2nd.length >= 2 ? "Very Strong" :
    beneficsIn2nd.length === 1 ? "Strong" :
      secondHousePlanets.length > 0 ? "Moderate" : "Developing";

  // Check 11th house strength (gains and income)
  const eleventhHousePlanets = planets.filter((p: any) => p.house === 11);
  const beneficsIn11th = eleventhHousePlanets.filter((p: any) =>
    ["Jupiter", "Venus", "Mercury", "Moon"].includes(p.planet)
  );
  const eleventhHouseStrength = beneficsIn11th.length >= 2 ? "Very Strong" :
    beneficsIn11th.length === 1 ? "Strong" :
      eleventhHousePlanets.length > 0 ? "Moderate" : "Developing";

  // Determine income style
  const wealthHouses = [2, 5, 8, 9, 11];
  const planetsInWealthHouses = planets.filter((p: any) => wealthHouses.includes(p.house));

  let incomeStyle = "Balanced Approach";
  if (planetsInWealthHouses.length >= 4) {
    incomeStyle = "Multiple Streams";
  } else if (planets.some((p: any) => p.planet === "Saturn" && [2, 10, 11].includes(p.house))) {
    incomeStyle = "Steady & Stable";
  } else if (planets.some((p: any) => p.planet === "Rahu" && [2, 10, 11].includes(p.house))) {
    incomeStyle = "Innovative & Bold";
  }

  // Check for wealth yogas
  const wealthYogas: string[] = [];

  // Dhana Yoga - 2nd and 11th lord connection
  const jupiter = planets.find((p: any) => p.planet === "Jupiter");
  const venus = planets.find((p: any) => p.planet === "Venus");
  if (jupiter && venus && Math.abs(jupiter.house - venus.house) <= 2) {
    wealthYogas.push("Dhana Yoga (Jupiter-Venus)");
  }

  // Lakshmi Yoga - Venus in own sign or exalted
  if (venus && ["Taurus", "Libra", "Pisces"].includes(venus.sign)) {
    wealthYogas.push("Lakshmi Yoga");
  }

  return {
    secondHouse: secondHouseStrength,
    eleventhHouse: eleventhHouseStrength,
    incomeStyle,
    wealthYogas
  };
}

export default function EarningSources() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { guestChart, hasGuestChart } = useGuestChart();

  const utils = trpc.useUtils();
  const createProfile = trpc.profile.create.useMutation({
    onSuccess: () => {
      toast.success("Chart saved to your profile!");
      utils.profile.list.invalidate();
      location.reload(); // Simple reload to refresh state
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save");
    }
  });

  const [activeTab, setActiveTab] = useState<string>("recommended");
  const [businessIdea, setBusinessIdea] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);

  const validateBusiness = trpc.ai.validateBusiness.useMutation({
    onSuccess: (data) => {
      setValidationResult({ ...data, idea: businessIdea });
      toast.success("Analysis complete!");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  // For authenticated users
  const { data: profiles, isLoading: profilesLoading } = trpc.profile.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const primaryProfile = profiles?.find(p => p.isPrimary) || profiles?.[0];

  const handleValidateBusiness = () => {
    if (!businessIdea.trim()) return;

    // Determine which data to use (auth vs guest)
    if (isAuthenticated && primaryProfile?.id) {
      validateBusiness.mutate({
        profileId: primaryProfile.id,
        businessIdea: businessIdea
      });
    } else if (guestChart?.birthData) {
      validateBusiness.mutate({
        birthData: {
          ...guestChart.birthData,
          timezoneOffset: guestChart.birthData.timezoneOffset || 0,
          ayanamsa: guestChart.birthData.ayanamsa || "lahiri"
        },
        businessIdea: businessIdea
      });
    } else {
      toast.error("Please create a chart first to validate ideas.");
    }
  };

  const { data: recommendations, isLoading: recsLoading } = trpc.income.getRecommendations.useQuery(
    { profileId: primaryProfile?.id || 0, limit: 20 },
    { enabled: isAuthenticated && !!primaryProfile?.id }
  );

  // Guest mode data
  const guestRecommendations = useMemo(() => {
    if (!isAuthenticated && hasGuestChart && guestChart?.chartData) {
      return generateIncomeRecommendations(guestChart.chartData);
    }
    return [];
  }, [isAuthenticated, hasGuestChart, guestChart]);

  // Determine chart data for both uses
  const chartData = (isAuthenticated && primaryProfile?.chartData)
    ? (primaryProfile.chartData as any)
    : guestChart?.chartData;

  const wealthIndicators = useMemo(() => {
    return generateWealthIndicators(chartData);
  }, [chartData]);

  // Use appropriate data
  const allRecommendations = isAuthenticated
    ? (recommendations || [])
    : guestRecommendations;

  // Filter by category
  const activeStreams = allRecommendations.filter((s: any) => s.category === "active");
  const passiveStreams = allRecommendations.filter((s: any) => s.category === "passive");
  const hybridStreams = allRecommendations.filter((s: any) => s.category === "hybrid");
  const topRecommendations = allRecommendations.slice(0, 8);

  const isLoading = authLoading || (isAuthenticated && (profilesLoading || recsLoading));
  const hasData = !!chartData;

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

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Profile Found</h2>
            <p className="text-muted-foreground mb-4">
              Create your birth chart to discover earning opportunities.
            </p>
            <Button asChild>
              <Link href="/onboarding">Create Chart</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderIncomeCard = (stream: IncomeStream, showScore: boolean = true) => (
    <div
      key={stream.id}
      className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-semibold">{stream.name}</h3>
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              {CATEGORY_ICONS[stream.category]}
              {stream.category}
            </Badge>
            <Badge className={`text-xs ${RISK_COLORS[stream.riskLevel]}`}>
              {stream.riskLevel} risk
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{stream.description}</p>
          {showScore && stream.score && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Progress value={stream.score} className="h-2 flex-1 max-w-[200px]" />
                <span className={`text-sm font-medium ${stream.score >= 75 ? "text-green-600" :
                  stream.score >= 55 ? "text-primary" :
                    "text-muted-foreground"
                  }`}>{stream.score}% match</span>
              </div>

              {stream.astroLogic && stream.astroLogic.length > 0 && (
                <div className="mb-2 p-2 bg-purple-50 dark:bg-purple-900/10 rounded text-xs border border-purple-100 dark:border-purple-800/30">
                  <p className="font-medium text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
                    <span className="text-[10px]">✨</span> Cosmic logic:
                  </p>
                  <ul className="space-y-0.5">
                    {stream.astroLogic.slice(0, 3).map((logic, idx) => (
                      <li key={idx} className="text-muted-foreground flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                        <span>{logic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {stream.planetarySupport && !stream.astroLogic?.length && (
                <p className="text-xs text-muted-foreground">
                  Supported by {stream.planetarySupport}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );


  const handleSaveGuestChart = () => {
    if (!guestChart?.birthData) return;
    createProfile.mutate({
      ...guestChart.birthData,
      timezoneOffset: guestChart.birthData.timezoneOffset || 0,
      ayanamsa: guestChart.birthData.ayanamsa as "lahiri" | "raman" | "krishnamurti",
      isPrimary: true
    });
  };

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
            <h1 className="font-semibold">Earning Sources</h1>
            <p className="text-sm text-muted-foreground">Modern income streams for your profile</p>
          </div>
          {!isAuthenticated && hasGuestChart && (
            <Button variant="outline" size="sm" onClick={() => window.location.href = getLoginUrl()}>
              <Save className="w-4 h-4 mr-2" />
              Sign In to Save
            </Button>
          )}
          {isAuthenticated && hasData && !primaryProfile && (
            <Button variant="default" size="sm" onClick={handleSaveGuestChart} disabled={createProfile.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {createProfile.isPending ? "Saving..." : "Save to Profile"}
            </Button>
          )}
        </div>
      </header>

      <main className="container py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Guest mode banner */}
          {hasGuestChart && (!isAuthenticated || !primaryProfile) && (
            <Card className="border-amber-500/50 bg-amber-500/10">
              <CardContent className="p-4 flex items-center gap-3">
                <Save className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Unsaved Chart</p>
                  <p className="text-sm text-amber-700">
                    {isAuthenticated
                      ? "You are viewing a guest chart. Save it to your profile to keep it."
                      : "Sign in to save your income analysis and track opportunities"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wealth indicators */}
          <Card className="cosmic-gradient text-white">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-6 h-6" />
                Your Wealth Indicators
              </h2>
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-white/10 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-white/80 text-sm">2nd House (Wealth)</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-white/60" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Indicates wealth accumulation potential</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="font-semibold">{wealthIndicators.secondHouse}</p>
                </div>
                <div className="p-3 bg-white/10 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-white/80 text-sm">11th House (Gains)</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-white/60" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Indicates income and gains potential</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="font-semibold">{wealthIndicators.eleventhHouse}</p>
                </div>
                <div className="p-3 bg-white/10 rounded-lg">
                  <p className="text-white/80 text-sm mb-1">Income Style</p>
                  <p className="font-semibold">{wealthIndicators.incomeStyle}</p>
                </div>
              </div>
              {wealthIndicators.wealthYogas && wealthIndicators.wealthYogas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {wealthIndicators.wealthYogas.map((yoga, i) => (
                    <Badge key={i} className="bg-white/20 text-white border-white/30">
                      {yoga}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cosmic Business Validator */}
          <Card className="bg-gradient-to-r from-purple-900/10 to-blue-900/10 border-blue-500/20 mb-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-24 h-24" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                Cosmic Business Validator
              </CardTitle>
              <CardDescription>
                Have a specific business idea? Test it against your astrological chart to see if the stars align.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Input
                    placeholder="e.g. Starting a Coffee Shop, Launching a SaaS App..."
                    value={businessIdea}
                    onChange={(e) => setBusinessIdea(e.target.value)}
                    className="bg-background"
                    onKeyDown={(e) => e.key === "Enter" && handleValidateBusiness()}
                  />
                </div>
                <Button
                  onClick={handleValidateBusiness}
                  disabled={validateBusiness.isPending || !businessIdea.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {validateBusiness.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Validate Idea</>
                  )}
                </Button>
              </div>

              {/* Validation Result */}
              {validationResult && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-background/50 rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4 border-b pb-4">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        Results for: <span className="text-purple-600">"{validationResult.idea}"</span>
                      </h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Compatibility</div>
                        <div className={`text-2xl font-bold ${validationResult.score >= 80 ? "text-green-600" :
                          validationResult.score >= 50 ? "text-amber-500" : "text-red-500"
                          }`}>
                          {validationResult.score}%
                        </div>
                      </div>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${validationResult.score >= 80 ? "bg-green-100 text-green-600" :
                        validationResult.score >= 50 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                        }`}>
                        {validationResult.score >= 80 ? <CheckCircle className="w-6 h-6" /> :
                          validationResult.score >= 50 ? <Info className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3 bg-primary/5 rounded-md italic text-muted-foreground border-l-2 border-primary">
                      "{validationResult.analysis}"
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-sm text-green-600 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" /> Cosmic Strengths
                        </h4>
                        <ul className="space-y-2">
                          {validationResult.strengths && Array.isArray(validationResult.strengths) ? (
                            validationResult.strengths.map((s: string, i: number) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                {s}
                              </li>
                            ))
                          ) : (
                            <li className="text-xs text-muted-foreground italic">No strengths identified.</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-amber-600 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Challenges to Watch
                        </h4>
                        <ul className="space-y-2">
                          {validationResult.challenges && Array.isArray(validationResult.challenges) ? (
                            validationResult.challenges.map((c: string, i: number) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                {c}
                              </li>
                            ))
                          ) : (
                            <li className="text-xs text-muted-foreground italic">No specific challenges identified.</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-2">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" /> Success Tips
                      </h4>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {validationResult.tips && Array.isArray(validationResult.tips) ? (
                          validationResult.tips.map((tip: string, i: number) => (
                            <div key={i} className="bg-background border rounded p-2 text-xs text-muted-foreground">
                              {tip}
                            </div>
                          ))
                        ) : (
                          <div className="bg-background border rounded p-2 text-xs text-muted-foreground italic">
                            No specific success tips generated.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Income Streams Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="recommended" className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Top Picks
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                Active ({activeStreams.length})
              </TabsTrigger>
              <TabsTrigger value="passive" className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Passive ({passiveStreams.length})
              </TabsTrigger>
              <TabsTrigger value="hybrid" className="flex items-center gap-1">
                <Shuffle className="w-4 h-4" />
                Hybrid ({hybridStreams.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recommended" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Recommended for You
                  </CardTitle>
                  <CardDescription>
                    Top income streams aligned with your planetary positions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {(() => {
                      const highMatch = topRecommendations.filter((s: any) => s.score >= 75);
                      const goodMatch = topRecommendations.filter((s: any) => s.score >= 60 && s.score < 75);
                      const moderateMatch = topRecommendations.filter((s: any) => s.score < 60);

                      if (topRecommendations.length === 0) {
                        return (
                          <p className="text-center text-muted-foreground py-8">
                            No recommendations available. Please ensure your chart data is complete.
                          </p>
                        );
                      }

                      return (
                        <>
                          {highMatch.length > 0 && (
                            <div className="space-y-3">
                              <h3 className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded inline-block">
                                High Potential Matches
                              </h3>
                              {highMatch.map((stream: any) => renderIncomeCard(stream, true))}
                            </div>
                          )}

                          {goodMatch.length > 0 && (
                            <div className="space-y-3">
                              <h3 className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded inline-block">
                                Good Potential Matches
                              </h3>
                              {goodMatch.map((stream: any) => renderIncomeCard(stream, true))}
                            </div>
                          )}

                          {moderateMatch.length > 0 && (
                            <div className="space-y-3">
                              <h3 className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded inline-block">
                                Moderate Potential Matches
                              </h3>
                              {moderateMatch.map((stream: any) => renderIncomeCard(stream, true))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="active" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Active Income Streams
                  </CardTitle>
                  <CardDescription>
                    Income that requires ongoing time and effort - trading time for money
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeStreams.map((stream: any) => renderIncomeCard(stream, true))}
                    {activeStreams.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No active income streams found for your profile.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="passive" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Passive Income Streams
                  </CardTitle>
                  <CardDescription>
                    Income that continues with minimal ongoing effort - money working for you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {passiveStreams.map((stream: any) => renderIncomeCard(stream, true))}
                    {passiveStreams.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No passive income streams found for your profile.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hybrid" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shuffle className="w-5 h-5 text-purple-500" />
                    Hybrid Income Streams
                  </CardTitle>
                  <CardDescription>
                    Combination of active work and passive income potential - scalable models
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {hybridStreams.map((stream: any) => renderIncomeCard(stream, true))}
                    {hybridStreams.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No hybrid income streams found for your profile.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
