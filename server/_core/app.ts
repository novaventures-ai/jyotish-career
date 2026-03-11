import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export const app = express();

// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

import { NextFunction, Request, Response } from "express";

// Debug logging
app.use((req: any, res: any, next: any) => {
    if (req.path.startsWith('/api')) {
        console.log(`[API Request] ${req.method} ${req.path}`);
    }
    next();
});

// OAuth callback under /api/oauth/callback
registerOAuthRoutes(app);

// Keep-alive endpoint for cron jobs to prevent Supabase from pausing
app.get("/api/keep-alive", async (_req: Request, res: Response) => {
    try {
        console.log('[Keep-Alive] Pinging database...');
        const dbClient = await getDb();
        if (!dbClient) {
            throw new Error("Database not available");
        }
        
        // Use a simple query that touches Supabase
        await dbClient.execute(sql`SELECT 1`);
        
        console.log('[Keep-Alive] ✅ Database ping successful');
        return res.status(200).json({ 
            success: true, 
            message: "Keep-alive successful",
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Keep-Alive] ❌ Failed:', error.message);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// tRPC API
app.use(
    "/api/trpc",
    createExpressMiddleware({
        router: appRouter,
        createContext,
    })
);

export default app;
