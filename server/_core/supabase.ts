import { createClient } from '@supabase/supabase-js';
import { ENV } from './env';

if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    console.warn('[Supabase Server] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

export const supabaseAdmin = createClient(
    ENV.supabaseUrl,
    ENV.supabaseServiceRoleKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);
