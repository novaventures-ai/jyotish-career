import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { toast } from 'sonner';

export function SupabaseAuthSync() {
    const { isAuthenticated, refresh, user, loading } = useAuth();
    const utils = trpc.useUtils();
    const syncMutation = trpc.auth.loginWithSupabase.useMutation();
    const [supabaseUser, setSupabaseUser] = useState<any>(null);
    const [syncStatus, setSyncStatus] = useState<string>('idle');

    // Use refs to track sync state without causing re-renders/stale closures
    const isSyncingRef = useRef(false);
    const hasSyncedRef = useRef(false);

    // Sync function that doesn't depend on state closures
    const syncToBackend = async (accessToken: string) => {
        // Check refs instead of state to avoid stale closures
        if (isSyncingRef.current) {
            console.log('[SupabaseAuthSync] Skipping - already syncing');
            return;
        }

        if (hasSyncedRef.current) {
            console.log('[SupabaseAuthSync] Skipping - already synced this session');
            return;
        }

        try {
            console.log('[SupabaseAuthSync] 🔄 Starting sync to backend...');
            isSyncingRef.current = true;
            setSyncStatus('syncing');
            toast.loading('Synchronizing your session...', { id: 'auth-sync' });

            const result = await syncMutation.mutateAsync({ accessToken });
            console.log('[SupabaseAuthSync] ✅ Sync mutation result:', result);

            // Mark as synced before invalidating
            hasSyncedRef.current = true;

            // Wait a moment for cookie to propagate
            console.log('[SupabaseAuthSync] ⏳ Waiting for cookie propagation...');
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log('[SupabaseAuthSync] 🔄 Invalidating auth.me cache...');
            await utils.auth.me.invalidate();

            console.log('[SupabaseAuthSync] 🔄 Force refetching user data...');
            const refetchResult = await refresh();
            console.log('[SupabaseAuthSync] Refetch result:', refetchResult);

            // Verify auth state updated
            console.log('[SupabaseAuthSync] 🔍 Verifying auth state...');
            const currentAuthState = await utils.auth.me.fetch();
            console.log('[SupabaseAuthSync] Current auth state:', currentAuthState);

            if (!currentAuthState) {
                console.warn('[SupabaseAuthSync] ⚠️ Auth state still null after sync - retrying...');
                // Retry once more
                await new Promise(resolve => setTimeout(resolve, 1000));
                await utils.auth.me.invalidate();
                const retryResult = await utils.auth.me.fetch();
                console.log('[SupabaseAuthSync] Retry result:', retryResult);

                if (!retryResult) {
                    console.error('[SupabaseAuthSync] ❌ Auth state still null after retry');
                    toast.error('Session sync completed but state not updated. Please refresh the page.', { id: 'auth-sync' });
                    setSyncStatus('error');
                    return;
                }
            }

            setSyncStatus('synced');
            toast.success('Session synchronized successfully!', { id: 'auth-sync' });
            console.log('[SupabaseAuthSync] ✅ Sync complete!');

            // Force query invalidation to ensure UI updates
            console.log('[SupabaseAuthSync] 🔄 UI should update via React Query...');

        } catch (error: any) {
            console.error('[SupabaseAuthSync] ❌ Sync failed:', error);
            setSyncStatus('error');
            hasSyncedRef.current = false; // Allow retry on error
            const msg = error?.message || error?.data?.message || 'Sync failed';
            toast.error(`Auth sync error: ${msg}`, { id: 'auth-sync' });
        } finally {
            isSyncingRef.current = false;
        }
    };

    // Check for existing Supabase session on mount
    useEffect(() => {
        // Wait for auth check to complete
        if (loading) return;

        const checkExistingSession = async () => {
            console.log('[SupabaseAuthSync] Checking for existing Supabase session...');
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.access_token) {
                console.log('[SupabaseAuthSync] Found existing session, user:', session.user?.email);
                setSupabaseUser(session.user);

                // Only sync if not already authenticated with backend
                if (!isAuthenticated && !hasSyncedRef.current) {
                    console.log('[SupabaseAuthSync] Backend not authenticated, triggering sync...');
                    await syncToBackend(session.access_token);
                } else {
                    console.log('[SupabaseAuthSync] Already authenticated or synced, skipping sync');
                    hasSyncedRef.current = true;
                }
            } else {
                console.log('[SupabaseAuthSync] No existing Supabase session');
            }
        };

        checkExistingSession();
    }, [loading, isAuthenticated]); // Re-run when loading finishes

    // Listen for auth state changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[SupabaseAuthSync] Auth event:', event, 'hasSession:', !!session, 'isAuthenticated:', isAuthenticated);
            setSupabaseUser(session?.user ?? null);

            if (event === 'SIGNED_IN') {
                // User just signed in (not initial session)
                if (session?.access_token && !isAuthenticated) {
                    hasSyncedRef.current = false; // Reset for new sign in
                    await syncToBackend(session.access_token);
                }
            } else if (event === 'TOKEN_REFRESHED') {
                // Token was refreshed, sync if needed
                if (session?.access_token && !isAuthenticated && !hasSyncedRef.current) {
                    await syncToBackend(session.access_token);
                }
            } else if (event === 'SIGNED_OUT') {
                console.log('[SupabaseAuthSync] User signed out, resetting sync state');
                hasSyncedRef.current = false;
                setSyncStatus('idle');
            }
        });

        return () => subscription.unsubscribe();
    }, [isAuthenticated]);

    // Update sync state when authentication changes
    useEffect(() => {
        if (isAuthenticated) {
            hasSyncedRef.current = true;
            setSyncStatus('authenticated');
        }
    }, [isAuthenticated]);

    // Logic is active, but UI is hidden as per user request
    return null;
}
