import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { trpc } from "@/lib/trpc";
import { useGuestChart } from "@/contexts/GuestChartContext";
import {
  Star,
  Compass,
  TrendingUp,
  Clock,
  Sparkles,
  Plus,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  User,
  LayoutDashboard,
  Save,
  RefreshCw,
  PlusCircle,
  Target,
  BrainCircuit,
  MessageCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { NavSidebar, MobileHeader, MobileNav } from "@/components/AppShell";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";



export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const { guestChart, hasGuestChart } = useGuestChart();
  const [, setLocation] = useLocation();

  // For authenticated users - fetch from database
  const { data: profiles, isLoading: profilesLoading } = trpc.profile.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const primaryProfile = profiles?.find(p => p.isPrimary) || profiles?.[0];

  // Use guest chart if not authenticated, OR if authenticated but no saved profile chart yet (and we have guest data)
  const chartData = (isAuthenticated && primaryProfile?.chartData)
    ? (primaryProfile.chartData as any)
    : guestChart?.chartData;

  const hasChartData = !!chartData;

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };



  const { clearGuestChart } = useGuestChart();

  const handleResetChart = () => {
    if (confirm("Are you sure you want to reset your chart? This will clear all your current data.")) {
      clearGuestChart();
      setLocation("/onboarding");
    }
  };

  const utils = trpc.useUtils();
  const createProfile = trpc.profile.create.useMutation({
    onSuccess: () => {
      toast.success("Chart saved to your profile!");
      utils.profile.list.invalidate();
      location.reload();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save");
    }
  });

  const handleSaveGuestChart = () => {
    if (!guestChart?.birthData) return;
    createProfile.mutate({
      ...guestChart.birthData,
      timezoneOffset: guestChart.birthData.timezoneOffset || 0,
      ayanamsa: guestChart.birthData.ayanamsa as "lahiri" | "raman" | "krishnamurti",
      isPrimary: true
    });
  };

  const handleNewChart = () => {
    setLocation("/onboarding");
  };

  // Redirect to onboarding if no chart data
  if (!authLoading && !profilesLoading && !hasChartData) {
    return (
      <div className="min-h-screen bg-background">
        <NavSidebar
          user={user}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />
        <MobileHeader
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />
        <main className="lg:ml-64 pt-20 lg:pt-8 pb-20 lg:pb-8 px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Welcome{isAuthenticated ? `, ${user?.name?.split(" ")[0] || "Seeker"}` : " to Jyotish Career"}
              </h1>
              <p className="text-muted-foreground">
                Your cosmic career guidance awaits
              </p>
            </div>

            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Your Birth Chart</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Enter your birth details to generate your Vedic chart and unlock personalized career insights.
                </p>
                <Button asChild>
                  <Link href="/onboarding">
                    Get Started
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full cosmic-gradient flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Star className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading your cosmic data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavSidebar
        user={user}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />
      <MobileHeader
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main className="lg:ml-64 pt-20 lg:pt-8 pb-20 lg:pb-8 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome{isAuthenticated ? ` back, ${user?.name?.split(" ")[0] || "Seeker"}` : ", Cosmic Explorer"}
            </h1>
            <p className="text-muted-foreground">
              Your cosmic career guidance awaits
            </p>
          </div>

          {/* Guest mode banner */}
          {hasGuestChart && (!isAuthenticated || !primaryProfile) && (
            <Card className="mb-6 border-amber-500/50 bg-amber-500/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Save className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">
                      {isAuthenticated ? "Unsaved Temporary Chart" : "You're viewing as a guest"}
                    </p>
                    <p className="text-sm text-amber-700">
                      {isAuthenticated
                        ? "Save this chart to your profile to keep it permanently."
                        : "Sign in to save your chart and access it anytime"}
                    </p>
                  </div>
                </div>
                {isAuthenticated ? (
                  <Button onClick={handleSaveGuestChart} disabled={createProfile.isPending} variant="default" className="bg-amber-600 hover:bg-amber-700 text-white border-none">
                    {createProfile.isPending ? "Saving..." : "Save to Profile"}
                  </Button>
                ) : (
                  <GoogleSignInButton variant="outline" className="border-amber-500 text-amber-700 hover:bg-amber-500/20" />
                )}
              </CardContent>
            </Card>
          )}

          {/* Chart Actions */}
          <div className="flex gap-3 mb-6">
            <Button variant="outline" onClick={handleResetChart} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Reset Chart
            </Button>
            <Button variant="outline" onClick={handleNewChart} className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              New Chart
            </Button>
          </div>

          {/* Dashboard content */}
          {chartData && (
            <div className="space-y-6">
              {/* Current Dasha Card */}


              {/* Quick stats */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Sun className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ascendant</p>
                        <p className="font-semibold">{chartData.d1?.ascendant?.sign || "—"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Moon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Moon Sign</p>
                        <p className="font-semibold">
                          {chartData.d1?.planets?.find((p: any) => p.planet === "Moon")?.sign || "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Yogas Found</p>
                        <p className="font-semibold">{chartData.yogas?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Star className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Nakshatra</p>
                        <p className="font-semibold">
                          {chartData.d1?.planets?.find((p: any) => p.planet === "Moon")?.nakshatra || "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick actions */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
                <Card className="card-hover">
                  <Link href="/chart">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Star className="w-5 h-5 text-primary" />
                        My Chart
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        View your complete Vedic birth chart with planetary positions and divisional charts.
                      </CardDescription>
                    </CardContent>
                  </Link>
                </Card>

                <Card className="card-hover">
                  <Link href="/career">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Compass className="w-5 h-5 text-primary" />
                        Career Pathfinder
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Discover careers aligned with your planetary strengths and cosmic blueprint.
                      </CardDescription>
                    </CardContent>
                  </Link>
                </Card>

                <Card className="card-hover">
                  <Link href="/earning">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Earning Sources
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Explore modern income streams that match your astrological profile.
                      </CardDescription>
                    </CardContent>
                  </Link>
                </Card>

                <Card className="card-hover">
                  <Link href="/wealth">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-emerald-700 font-bold text-xs">$</span>
                        </div>
                        Wealth Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Unlock your financial potential and wealth DNA architecture.
                      </CardDescription>
                    </CardContent>
                  </Link>
                </Card>

                <Card className="card-hover">
                  <Link href="/swot">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="w-5 h-5 text-primary" />
                        SWOT Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Strategic breakdown of your Strengths, Weaknesses, Opportunities, and Threats.
                      </CardDescription>
                    </CardContent>
                  </Link>
                </Card>

                <Card className="card-hover">
                  <Link href="/career-validator">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BrainCircuit className="w-5 h-5 text-primary" />
                        AI Validator
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Analyze the compatibility of any specific job role with your astrological chart using AI.
                      </CardDescription>
                    </CardContent>
                  </Link>
                </Card>

                <Card className="card-hover">
                  <Link href="/timing">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="w-5 h-5 text-primary" />
                        Timing
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Discover the best timing for career moves based on your planetary periods and transits.
                      </CardDescription>
                    </CardContent>
                  </Link>
                </Card>

                <Card className="card-hover">
                  <Link href="/remedies">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Remedies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Personalized Vedic remedies to elevate you to a prominent position; embrace this journey of transformation.
                      </CardDescription>
                    </CardContent>
                  </Link>
                </Card>
              </div>

              {/* Cosmic Counselor - Full Width */}
              <Card className="card-hover">
                <Link href="/counselor">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageCircle className="w-5 h-5 text-primary" />
                      Cosmic Counselor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Chat with your personal AI astrology counselor for real-time career guidance and cosmic insights.
                    </CardDescription>
                  </CardContent>
                </Link>
              </Card>



              {/* Yogas section */}
              {chartData.yogas && chartData.yogas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Detected Yogas
                    </CardTitle>
                    <CardDescription>
                      Powerful planetary combinations in your chart
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {chartData.yogas.slice(0, 5).map((yoga: any, index: number) => (
                        <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                          <div className={`w-2 h-2 rounded-full mt-2 ${yoga.category === "wealth" ? "bg-green-500" :
                            yoga.category === "career" ? "bg-blue-500" :
                              yoga.category === "knowledge" ? "bg-purple-500" : "bg-amber-500"
                            }`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{yoga.name}</h4>
                              <span className="text-xs px-2 py-1 rounded-full bg-muted">
                                {yoga.category}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {yoga.description}
                            </p>
                            <p className="text-sm text-primary mt-1">
                              {yoga.effects}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main >

      <MobileNav />
    </div >
  );
}
