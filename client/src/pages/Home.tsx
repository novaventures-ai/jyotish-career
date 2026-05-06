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
  Zap,
  Download,
  ScrollText,
  Quote,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Link } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LoginButton } from "@/components/LoginButton";

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

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-fade-in-up">
              <Sun className="w-4 h-4" />
              <span className="text-sm font-medium">Vedic Astrology meets Modern Career Guidance</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Discover Your{" "}
              <span className="text-primary">Cosmic Career</span>{" "}
              Blueprint
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-balance max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Unlock personalized career insights, wealth yoga detection, and timing analysis based on your precise Vedic birth chart.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              {hasChartData ? (
                <Button size="lg" asChild className="text-lg px-8 h-12">
                  <Link href="/dashboard">
                    View Your Dashboard
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild className="text-lg px-8 h-12 shadow-lg hover:shadow-primary/20 transition-all">
                  <Link href="/onboarding">
                    Create Chart Free
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              )}

              {!isAuthenticated && (
                <div className="w-full sm:w-auto">
                  <LoginButton />
                </div>
              )}

              <Button size="lg" variant="outline" asChild className="text-lg px-8 h-12">
                <a href="#features">Explore Features</a>
              </Button>
            </div>
          </div>

          <div className="mt-8 max-w-sm mx-auto animate-fade-in-up flex flex-col items-center gap-4" style={{ animationDelay: '0.35s' }}>
            {!hasChartData && !isAuthenticated && (
              <>
                <div className="w-full flex items-center gap-4 relative">
                  <div className="flex-1 h-px bg-border/50"></div>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest bg-background px-2">or continue with</span>
                  <div className="flex-1 h-px bg-border/50"></div>
                </div>
                <GoogleSignInButton variant="outline" className="w-full shadow-sm" />
              </>
            )}
          </div>


        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Complete Career Astology Toolkit
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform combines authentic Vedic astrology calculations with modern career data
              to provide actionable professional guidance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="card-hover border-border/50 bg-background/60 backdrop-blur-sm">
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


      {/* Testimonials Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Trusted by Career Seekers</h2>
            <p className="text-lg text-muted-foreground">See how Vedic insights have helped professionals navigate their journey.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                text: "I was confused between Tech and Management. The chart analysis correctly identified my Mars position favoring leadership not just coding. Spot on!",
                author: "Priya S.",
                role: "Product Manager"
              },
              {
                text: "The Dasha timing tool is incredible. It predicted my job change period to the exact month. The career remedies were simple and effective.",
                author: "Arjun K.",
                role: "Software Architect"
              },
              {
                text: "Finally, an astrology app that speaks modern career language. No vague predictions, just clear actionable pathfinding based on planetary strengths.",
                author: "Sarah M.",
                role: "UX Designer"
              }
            ].map((t, i) => (
              <Card key={i} className="border-border/50 bg-background/40">
                <CardContent className="p-8">
                  <Quote className="w-8 h-8 text-primary/40 mb-4" />
                  <p className="text-lg mb-6 leading-relaxed">"{t.text}"</p>
                  <div>
                    <div className="font-semibold">{t.author}</div>
                    <div className="text-sm text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>




      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-medium">Is this Vedic or Western Astrology?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                This platform follows <strong>Vedic Astrology (Sidereal Zodiac)</strong> using the Lahiri Ayanamsa. We believe this system offers superior accuracy for predictive timing (Dashas) and career-specific divisional chart analysis.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg font-medium">Why is my birth time important?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Your birth time determines your Ascendant (Lagna) and the structure of all divisional charts, especially the <strong>D10 Dasamsa</strong> (Career Chart). Even a few minutes can shift these charts, so precision helps us give you the most accurate career advice.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-medium">How secure is my personal data?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                We prioritize your privacy. Your birth details are used <strong>exclusively</strong> to generate your chart analysis. We do not sell, rent, or share your personal information with third parties.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg font-medium">Do you offer detailed reports?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Yes! Our analysis covers wealth potential, career strengths, and timing. We continuously update our algorithms to provide deeper insights into your professional life. Premium export options are also available for detailed offline study.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
        </div>
      </section>


      {/* Footer */}
      <footer className="py-12 border-t border-border bg-background">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full cosmic-gradient flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Jyotish Career</span>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4 text-sm text-muted-foreground">

              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            </div>

            <p className="text-sm text-muted-foreground">
              © 2026 Jyotish Career. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
