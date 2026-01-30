import { createClient } from '@supabase/supabase-js';
import { ENV } from './env';

if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    console.warn('[Supabase Server] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

// Safely initialize Supabase Admin to prevent server startup crashes
export const supabaseAdmin = (ENV.supabaseUrl && ENV.supabaseServiceRoleKey)
    ? createClient(
        ENV.supabaseUrl,
        ENV.supabaseServiceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
    : null;

if (!supabaseAdmin) {
    console.warn('[Supabase Server] Failed to initialize supabaseAdmin: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.warn('[Supabase Server] Url present:', !!ENV.supabaseUrl);
    console.warn('[Supabase Server] Key present:', !!ENV.supabaseServiceRoleKey);
}
