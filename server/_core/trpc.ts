import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { COOKIE_NAME } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { checkSessionLimit } from "../middleware/rateLimit";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// ============================================
// SESSION-LEVEL RATE LIMIT FOR AI PROCEDURES
// Max 5 Gemini calls per session per hour
// ============================================
const requireAiLimit = t.middleware(async opts => {
  const { ctx, next } = opts;

  // Build a session key: prefer user ID, fallback to session cookie, then IP
  const sessionKey =
    ctx.user?.id?.toString() ||
    (ctx.req as any)?.cookies?.[COOKIE_NAME] ||
    (ctx.req as any)?.headers?.["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    (ctx.req as any)?.ip ||
    "anonymous";

  const result = checkSessionLimit(sessionKey);

  if (!result.allowed) {
    const retryMinutes = Math.ceil((result.retryAfterMs || 3600000) / 60000);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `You've used all 5 AI consultations for this session. Please wait ~${retryMinutes} minutes before your next consultation.`,
    });
  }

  // Pass remaining count in context for optional frontend display
  return next({
    ctx: {
      ...ctx,
      aiCallsRemaining: result.remaining,
    },
  });
});

/** Public procedure with session-level AI rate limit (for guest AI endpoints) */
export const aiPublicProcedure = t.procedure.use(requireAiLimit);

/** Protected procedure with session-level AI rate limit (for logged-in AI endpoints) */
const requireUserAndAiLimit = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Session key based on authenticated user ID
  const sessionKey = ctx.user.id.toString();
  const result = checkSessionLimit(sessionKey);

  if (!result.allowed) {
    const retryMinutes = Math.ceil((result.retryAfterMs || 3600000) / 60000);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `You've used all 5 AI consultations for this session. Please wait ~${retryMinutes} minutes before your next consultation.`,
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      aiCallsRemaining: result.remaining,
    },
  });
});

export const aiProtectedProcedure = t.procedure.use(requireUserAndAiLimit);
