export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  // Handle typo in Vercel Env Vars (JNT_SECRET)
  cookieSecret: process.env.JWT_SECRET ?? process.env.JNT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  supabaseUrl: process.env.VITE_SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
};

// Debug Environment Variables (Masked)
console.log('[ENV] Loading Environment configuration...');
console.log(`[ENV] DATABASE_URL present: ${!!ENV.databaseUrl}`);
console.log(`[ENV] JWT_SECRET present: ${!!ENV.cookieSecret}`);
console.log(`[ENV] SUPABASE_URL present: ${!!ENV.supabaseUrl}`);
console.log(`[ENV] SUPABASE_KEY present: ${!!ENV.supabaseServiceRoleKey}`);
