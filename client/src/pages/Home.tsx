import { useAuth } from "@/_core/hooks/useAuth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useGuestChart } from "@/contexts/GuestChartContext";
import {
  Star,
  Compass,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
  Zap
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { hasGuestChart } = useGuestChart();

  // Check if user has any chart data (either as guest or authenticated)
  const hasChartData = hasGuestChart || isAuthenticated;

  const features = [
    {
      icon: <Star className="w-6 h-6" />,
      title: "Birth Chart Analysis",
      description: "Generate your complete Vedic birth chart with all 16 divisional charts (Vargas) for deep insights."
    },
    {
      icon: <Compass className="w-6 h-6" />,
      title: "Career Pathfinder",
      description: "Discover careers aligned with your planetary positions and cosmic blueprint."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Earning Sources",
      description: "Explore modern income streams that match your astrological profile and strengths."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Timing & Opportunities",
      description: "Know the best times for career moves based on Dasha periods and transits."
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Yoga Detection",
      description: "Identify powerful planetary combinations that indicate wealth and success."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Personalized Remedies",
      description: "Get tailored remedies to strengthen favorable planets and mitigate challenges."
    }
  ];

  const zodiacSigns = [
    "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full cosmic-gradient flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Jyotish Career</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {loading ? (
              <div className="w-24 h-10 shimmer rounded-lg" />
            ) : hasChartData ? (
              <Button asChild>
                <Link href="/dashboard">
                  View Dashboard <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/onboarding">Get Started</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 cosmic-gradient-light dark:cosmic-gradient opacity-50" />

        {/* Floating zodiac symbols */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {zodiacSigns.map((sign, i) => (
            <span
              key={i}
              className="absolute text-4xl opacity-10 star"
              style={{
                left: `${(i * 8) + 2}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.2}s`
              }}
            >
              {sign}
            </span>
          ))}
        </div>

        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Sun className="w-4 h-4" />
              <span className="text-sm font-medium">Vedic Astrology meets Modern Career Guidance</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
              Discover Your{" "}
              <span className="text-primary">Cosmic Career</span>{" "}
              Blueprint with Vedic Astrology
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-balance">
              Unlock personalized career insights based on your Vedic birth chart.
              Connect ancient wisdom with modern opportunities to find your true professional path.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {hasChartData ? (
                <Button size="lg" asChild className="text-lg px-8">
                  <Link href="/dashboard">
                    View Your Dashboard
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild className="text-lg px-8">
                  <Link href="/onboarding">
                    Create Your Chart Free
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <a href="#features">Learn More</a>
              </Button>
            </div>

            {!hasChartData && !isAuthenticated && (
              <div className="mt-6 max-w-sm mx-auto">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-sm text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <GoogleSignInButton variant="outline" className="max-w-sm mx-auto" />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Sign in to save your charts permanently
                </p>
              </div>
            )}

            {!hasChartData && (
              <p className="text-sm text-muted-foreground mt-4">
                No sign-up required. Generate your chart instantly.
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
            {[
              { value: "16", label: "Divisional Charts" },
              { value: "100+", label: "Yogas Detected" },
              { value: "900+", label: "Career Matches" },
              { value: "9", label: "Planets Analyzed" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Vedic Astrology Career Guidance Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform combines Vedic astrology calculations with modern career data
              to provide actionable insights for your professional journey. Explore birth charts, career pathfinder,
              earning sources, timing analysis, and personalized remedies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="card-hover border-border/50">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get your personalized career guidance in three simple steps. No sign-up required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                icon: <Moon className="w-8 h-8" />,
                title: "Enter Birth Details",
                description: "Provide your date, time, and place of birth to generate your accurate Vedic chart."
              },
              {
                step: "2",
                icon: <Star className="w-8 h-8" />,
                title: "Chart Analysis",
                description: "Our engine calculates your planetary positions, houses, and detects powerful yogas."
              },
              {
                step: "3",
                icon: <Compass className="w-8 h-8" />,
                title: "Get Recommendations",
                description: "Receive personalized career paths, income sources, and timing insights."
              }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="relative inline-flex mb-6">
                  <div className="w-20 h-20 rounded-full cosmic-gradient flex items-center justify-center text-white">
                    {item.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 cosmic-gradient text-white">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Discover Your Path?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands who have found career clarity through Vedic astrology.
            Your cosmic blueprint awaits. No sign-up required to get started.
          </p>
          <Button size="lg" variant="secondary" asChild className="text-lg px-8">
            <Link href="/onboarding">
              Start Your Journey Free
              <ChevronRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full cosmic-gradient flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Jyotish Career</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Connecting Vedic wisdom with modern opportunities
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
