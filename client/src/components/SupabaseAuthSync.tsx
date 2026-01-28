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
            console.log('[SupabaseAuthSync] Starting sync to backend...');
            isSyncingRef.current = true;
            setSyncStatus('syncing');

            const result = await syncMutation.mutateAsync({ accessToken });
            console.log('[SupabaseAuthSync] Sync mutation result:', result);

            // Mark as synced before invalidating
            hasSyncedRef.current = true;

            console.log('[SupabaseAuthSync] Invalidating auth.me cache...');
            await utils.auth.me.invalidate();

            console.log('[SupabaseAuthSync] Refetching user data...');
            await refresh();

            setSyncStatus('synced');
            toast.success('Session synchronized successfully');
            console.log('[SupabaseAuthSync] Sync complete!');
        } catch (error: any) {
            console.error('[SupabaseAuthSync] Sync failed:', error);
            setSyncStatus('error');
            hasSyncedRef.current = false; // Allow retry on error
            const msg = error?.message || error?.data?.message || 'Sync failed';
            toast.error(`Auth sync error: ${msg}`);
        } finally {
            isSyncingRef.current = false;
        }
    };

    // Check for existing Supabase session on mount
    useEffect(() => {
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
    }, []); // Only run once on mount

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

    // Debug Overlay
    return (
        <div className="fixed bottom-4 right-4 z-[9999] p-4 rounded-lg glass border border-border shadow-xl text-xs font-mono flex flex-col gap-1 min-w-[260px] transition-all opacity-80 hover:opacity-100 bg-background/80 backdrop-blur-md">
            <div className="font-bold border-b border-border pb-1 mb-1 text-primary">Auth Debug Console</div>
            <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Supabase:</span>
                <span className={supabaseUser ? 'text-green-500 truncate text-right flex-1' : 'text-red-500'}>
                    {supabaseUser ? supabaseUser.email : 'LOGGED_OUT'}
                </span>
            </div>
            <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">App Backend:</span>
                <span className={isAuthenticated ? 'text-green-500 truncate text-right flex-1' : 'text-red-500'}>
                    {isAuthenticated ? (user?.name || 'LOGGED_IN') : 'GUEST'}
                </span>
            </div>
            <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Sync Status:</span>
                <span className={
                    syncStatus === 'synced' || syncStatus === 'authenticated' ? 'text-green-500' :
                        syncStatus === 'syncing' ? 'text-amber-500' :
                            syncStatus === 'error' ? 'text-red-500' : 'text-muted-foreground'
                }>
                    {syncStatus.toUpperCase()}
                </span>
            </div>
            <div className="flex justify-between gap-4 border-t border-border mt-1 pt-1">
                <span className="text-muted-foreground">Loading:</span>
                <span className={loading ? 'text-amber-500' : 'text-muted-foreground'}>{loading ? 'YES' : 'NO'}</span>
            </div>
            {syncStatus === 'syncing' && (
                <div className="mt-2 text-amber-500 animate-pulse text-center font-bold bg-amber-500/10 py-1 rounded">
                    [ SYNCING TO BACKEND... ]
                </div>
            )}
            {isAuthenticated && (
                <div className="mt-2 text-green-500 text-center font-bold bg-green-500/10 py-1 rounded">
                    [ AUTHENTICATED ]
                </div>
            )}
            {syncStatus === 'error' && (
                <div className="mt-2 text-red-500 text-center font-bold bg-red-500/10 py-1 rounded">
                    [ SYNC FAILED - CHECK CONSOLE ]
                </div>
            )}
        </div>
    );
}
