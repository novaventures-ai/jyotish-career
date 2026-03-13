import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

// ============================================
// AI ENDPOINT PATTERNS
// ============================================
// All tRPC procedures that trigger Gemini API calls
const AI_PROCEDURE_PATTERNS = [
  "ai.validateCareer",
  "ai.expandCareerList",
  "ai.validateBusiness",
  "ai.getSwotAnalysis",
  "ai.getWealthNarrative",
  "ai.chat",
  "chat.sendMessage",
];

/**
 * Check if a request path targets a Gemini-calling tRPC procedure.
 */
export function isAiRequest(req: Request): boolean {
  const path = req.path;
  return AI_PROCEDURE_PATTERNS.some((pattern) => path.includes(pattern));
}

// ============================================
// 1) IP-LEVEL RATE LIMIT (express-rate-limit)
//    Max 20 Gemini requests per IP per hour
// ============================================
export const aiIpRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  skip: (req: Request) => !isAiRequest(req), // Only count AI requests
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use X-Forwarded-For (Vercel/proxy) or fallback to socket IP
    return (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      "unknown"
    );
  },
  handler: (_req: Request, res: Response) => {
    console.warn(
      `[Rate Limit] IP limit exceeded: ${_req.ip} — blocked AI request`
    );
    res.status(429).json({
      error: {
        message:
          "You've reached the maximum of 20 AI consultations per hour. Please wait before trying again.",
        code: "RATE_LIMIT_IP",
        retryAfterMs: 60 * 60 * 1000,
      },
    });
  },
});

// ============================================
// 2) SESSION-LEVEL RATE LIMIT (in-memory)
//    Max 5 Gemini calls per session per hour
// ============================================
interface SessionEntry {
  count: number;
  windowStart: number;
}

const sessionStore = new Map<string, SessionEntry>();

const SESSION_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SESSION_MAX_CALLS = 5;

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  const keys = Array.from(sessionStore.keys());
  for (const key of keys) {
    const entry = sessionStore.get(key);
    if (entry && now - entry.windowStart > SESSION_WINDOW_MS) {
      sessionStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Check and increment session-level Gemini call count.
 * Returns { allowed: true } or { allowed: false, remaining, retryAfterMs }.
 */
export function checkSessionLimit(sessionKey: string): {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
} {
  const now = Date.now();
  let entry = sessionStore.get(sessionKey);

  // Reset window if expired
  if (!entry || now - entry.windowStart > SESSION_WINDOW_MS) {
    entry = { count: 0, windowStart: now };
    sessionStore.set(sessionKey, entry);
  }

  if (entry.count >= SESSION_MAX_CALLS) {
    const retryAfterMs = SESSION_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.count++;
  const remaining = SESSION_MAX_CALLS - entry.count;
  return { allowed: true, remaining };
}
