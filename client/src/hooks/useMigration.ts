import { useEffect, useRef } from "react";
import { useAuth } from "../_core/hooks/useAuth";
import { useGuestChart } from "../contexts/GuestChartContext";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

export function useMigration() {
    const { isAuthenticated, user, loading } = useAuth();
    const { guestChart, clearGuestChart } = useGuestChart();
    const migrateMutation = trpc.profile.migrate.useMutation();
    const utils = trpc.useUtils();

    // Use a ref to prevent multiple migration attempts in the same session transition
    const migrationStarted = useRef(false);

    useEffect(() => {
        // Only attempt migration if:
        // 1. User is authenticated
        // 2. We have a guest chart to migrate
        // 3. We haven't started this migration already
        // 4. Auth isn't in a loading state
        if (isAuthenticated && guestChart && !migrationStarted.current && !loading) {
            console.log("[Migration] Found guest data and authenticated user. Starting migration...");
            migrationStarted.current = true;

            const birthData = guestChart.birthData;

            migrateMutation.mutate({
                profileName: birthData.profileName || "My Profile",
                birthDate: birthData.birthDate,
                birthTime: birthData.birthTime,
                birthPlace: birthData.birthPlace,
                latitude: birthData.latitude,
                longitude: birthData.longitude,
                timezone: birthData.timezone,
                timezoneOffset: birthData.timezoneOffset || 0,
                ayanamsa: (birthData.ayanamsa as any) || "lahiri",
                isPrimary: true
            }, {
                onSuccess: () => {
                    toast.success("Successfully saved your chart to your account!");
                    clearGuestChart();
                    utils.profile.list.invalidate();
                    utils.auth.me.invalidate();
                },
                onError: (error) => {
                    console.error("[Migration] Error during migration:", error);
                    toast.error("Connected to your account, but couldn't save your guest chart.");
                    // We don't clear the guest chart on error so they can try again or manually save
                    migrationStarted.current = false;
                }
            });
        }
    }, [isAuthenticated, guestChart, loading, migrateMutation, clearGuestChart, utils]);
}
