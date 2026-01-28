import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { toast } from 'sonner';

export function SupabaseAuthSync() {
    const { isAuthenticated, refresh, user, loading } = useAuth();
    const utils = trpc.useUtils();
    const syncMutation = trpc.auth.loginWithSupabase.useMutation();
    const [supabaseUser, setSupabaseUser] = useState<any>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [hasSynced, setHasSynced] = useState(false);

    // Stable callback for syncing to backend
    const syncToBackend = useCallback(async (accessToken: string) => {
        if (isSyncing || syncMutation.isPending || hasSynced) {
            console.log('[SupabaseAuthSync] Skipping sync - already syncing or synced');
            return;
        }

        try {
            console.log('[SupabaseAuthSync] Triggering sync...');
            setIsSyncing(true);
            await syncMutation.mutateAsync({ accessToken });
            console.log('[SupabaseAuthSync] Sync mutation successful, invalidating cache...');

            // First invalidate the cache to clear stale data
            await utils.auth.me.invalidate();

            // Then refresh to get fresh data with the new cookie
            await refresh();

            setHasSynced(true);
            toast.success('Session synchronized');
        } catch (error: any) {
            console.error('[SupabaseAuthSync] Sync failed:', error);
            const msg = error?.message || (error?.data?.message) || 'Verification failed';
            toast.error(`Sync error: ${msg}`);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, syncMutation, hasSynced, utils, refresh]);

    useEffect(() => {
        // Reset hasSynced when user becomes authenticated
        if (isAuthenticated) {
            setHasSynced(true);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // 1. Listen for Supabase auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[SupabaseAuthSync] Event:', event, 'Session:', !!session, 'isAuthenticated:', isAuthenticated);
            setSupabaseUser(session?.user ?? null);

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                if (session?.access_token && !isAuthenticated) {
                    await syncToBackend(session.access_token);
                }
            }

            // Handle sign out
            if (event === 'SIGNED_OUT') {
                setHasSynced(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [isAuthenticated, syncToBackend]);

    // Debug Overlay
    return (
        <div className="fixed bottom-4 right-4 z-[9999] p-4 rounded-lg glass border border-border shadow-xl text-xs font-mono flex flex-col gap-1 min-w-[240px] transition-all opacity-80 hover:opacity-100 bg-background/80 backdrop-blur-md">
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
            <div className="flex justify-between gap-4 border-t border-border mt-1 pt-1">
                <span className="text-muted-foreground">App Loading:</span>
                <span className={loading ? 'text-amber-500' : 'text-muted-foreground'}>{loading ? 'YES' : 'NO'}</span>
            </div>
            {(isSyncing || syncMutation.isPending) && (
                <div className="mt-2 text-amber-500 animate-pulse text-center font-bold bg-amber-500/10 py-1 rounded">
                    [ SYNCING TO BACKEND... ]
                </div>
            )}
            {isAuthenticated && (
                <div className="mt-2 text-green-500 text-center font-bold bg-green-500/10 py-1 rounded">
                    [ AUTHENTICATED ]
                </div>
            )}
        </div>
    );
}
