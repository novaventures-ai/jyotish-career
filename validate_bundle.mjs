
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock minimal environment
process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
process.env.VITE_APP_ID = "test-app";
process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
process.env.JWT_SECRET = "test-secret";
process.env.OAUTH_SERVER_URL = "https://oauth.example.com";

async function validate() {
    try {
        const bundlePath = path.resolve(__dirname, 'api/_lib/bundled_app.js');
        if (!fs.existsSync(bundlePath)) {
            throw new Error('Bundle file not found at ' + bundlePath);
        }
        console.log('Loading bundle from:', bundlePath);
        await import('file://' + bundlePath);
        console.log('✅ Bundle loaded successfully');
    } catch (e) {
        console.error('❌ Bundle failed to load');
        console.error(e);
        process.exit(1);
    }
}

validate();
