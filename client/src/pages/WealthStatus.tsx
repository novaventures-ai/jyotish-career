
import React from "react";
import { WealthAnalysis } from "@/components/WealthAnalysis";
import { useAuth } from "@/_core/hooks/useAuth";
import { useGuestChart } from "@/contexts/GuestChartContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { NavSidebar, MobileHeader, MobileNav } from "@/components/AppShell";


export default function WealthStatus() {
    const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
    const { guestChart, hasGuestChart } = useGuestChart();
    const [, setLocation] = useLocation();

    const handleLogout = async () => {
        await logout();
        setLocation("/");
    };



    // For authenticated users - fetch from database
    const { data: profiles, isLoading: profilesLoading } = trpc.profile.list.useQuery(
        undefined,
        { enabled: isAuthenticated }
    );

    const primaryProfile = profiles?.find(p => p.isPrimary) || profiles?.[0];
    const profileId = primaryProfile?.id;

    // Determine if we have data to display
    const hasData = isAuthenticated ? !!primaryProfile : hasGuestChart;

    if (authLoading || (isAuthenticated && profilesLoading)) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse">Loading wealth analysis...</div>
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

            <main className="lg:ml-64 pt-20 lg:pt-8 pb-20 lg:pb-8 px-4 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Wealth & Status Analysis</h1>
                            <p className="text-muted-foreground mt-1">
                                Unlock your financial potential, asset accumulation power, and social standing based on the Master Framework.
                            </p>
                        </div>
                        {!hasData && (
                            <Button onClick={() => setLocation("/onboarding")}>
                                Generate Chart
                            </Button>
                        )}
                    </div>

                    {!hasData ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="py-12 text-center">
                                <h3 className="text-xl font-semibold mb-2">No Chart Found</h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    Please generate your birth chart to unlock your wealth analysis.
                                </p>
                                <Button onClick={() => setLocation("/onboarding")}>
                                    Create Chart
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <WealthAnalysis profileId={profileId} guestChart={guestChart} />
                    )}
                </div>
            </main>

            <MobileNav />
        </div>
    );
}

