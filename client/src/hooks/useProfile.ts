import { useAuth } from "@/_core/hooks/useAuth";
import { useGuestChart } from "@/contexts/GuestChartContext";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

export function useProfile() {
    const { isAuthenticated } = useAuth();
    const { guestChart } = useGuestChart();

    // Fetch profiles if authenticated
    const { data: profiles, isLoading } = trpc.profile.list.useQuery(
        undefined,
        { enabled: isAuthenticated }
    );

    const profile = useMemo(() => {
        if (isAuthenticated && profiles) {
            return profiles.find(p => p.isPrimary) || profiles[0] || null;
        }

        if (guestChart) {
            return {
                id: -1, // Mock ID for guest
                profileName: "Guest",
                chartData: guestChart.chartData,
                // Add other required fields if needed, but for validation simple ID/chartData usually suffices
            };
        }

        return null;
    }, [isAuthenticated, profiles, guestChart]);

    return { profile, isLoading };
}
