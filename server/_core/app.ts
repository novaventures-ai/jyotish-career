console.log('[App] Starting initialization...');
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";

console.log('[App] Imports complete');

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

console.log('[App] Middleware configured');

// OAuth callback under /api/oauth/callback
registerOAuthRoutes(app);

// Test endpoint to list available Gemini models
import { listAvailableModels } from "../services/test_models";
app.get("/api/test/models", listAvailableModels);

// tRPC API
/*
app.use(
    "/api/trpc",
    createExpressMiddleware({
        router: appRouter,
        createContext,
    })
);
*/

console.log('[App] Initialization complete');

export default app;
