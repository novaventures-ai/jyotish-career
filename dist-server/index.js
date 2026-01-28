// server/_core/index.ts
import "dotenv/config";
import { createServer } from "http";
import net from "net";

// server/_core/app.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var birthProfiles = mysqlTable("birth_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileName: varchar("profileName", { length: 100 }).default("My Profile"),
  // Birth details
  birthDate: varchar("birthDate", { length: 10 }).notNull(),
  // YYYY-MM-DD
  birthTime: varchar("birthTime", { length: 8 }).notNull(),
  // HH:MM:SS
  birthPlace: varchar("birthPlace", { length: 255 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  timezone: varchar("timezone", { length: 50 }).notNull(),
  timezoneOffset: decimal("timezoneOffset", { precision: 4, scale: 2 }).notNull(),
  // Ayanamsa preference
  ayanamsa: mysqlEnum("ayanamsa", ["lahiri", "raman", "krishnamurti"]).default("lahiri"),
  // Calculated chart data (cached)
  chartData: json("chartData"),
  // Full chart JSON
  dashaData: json("dashaData"),
  // Dasha periods JSON
  isPrimary: boolean("isPrimary").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var careerCategories = mysqlTable("career_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  iconName: varchar("iconName", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var occupations = mysqlTable("occupations", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  // Career attributes
  skills: json("skills"),
  // Array of required skills
  interests: json("interests"),
  // Holland codes (RIASEC)
  workValues: json("workValues"),
  // Work value scores
  // Market data
  salaryRange: varchar("salaryRange", { length: 100 }),
  jobOutlook: varchar("jobOutlook", { length: 100 }),
  educationLevel: varchar("educationLevel", { length: 100 }),
  // Astrological mappings
  primaryPlanets: json("primaryPlanets"),
  // Planets that favor this career
  primaryHouses: json("primaryHouses"),
  // Houses that indicate this career
  favorableYogas: json("favorableYogas"),
  // Yogas that support this career
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var incomeStreams = mysqlTable("income_streams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  category: mysqlEnum("category", ["active", "passive", "hybrid"]).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  description: text("description"),
  // Income details
  incomePotential: varchar("incomePotential", { length: 100 }),
  timeInvestment: varchar("timeInvestment", { length: 100 }),
  upfrontInvestment: mysqlEnum("upfrontInvestment", ["none", "low", "medium", "high"]),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]),
  // Requirements
  skillRequirements: json("skillRequirements"),
  platforms: json("platforms"),
  // Relevant platforms
  // Astrological indicators
  favorablePlanets: json("favorablePlanets"),
  favorableHouses: json("favorableHouses"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var astroCareerMappings = mysqlTable("astro_career_mappings", {
  id: int("id").autoincrement().primaryKey(),
  // Astrological indicator
  indicatorType: mysqlEnum("indicatorType", [
    "planet_in_house",
    "planet_in_sign",
    "house_lord",
    "yoga",
    "dasha_lord",
    "nakshatra"
  ]).notNull(),
  indicatorValue: varchar("indicatorValue", { length: 100 }).notNull(),
  // Career attribute mapping
  attributeType: mysqlEnum("attributeType", [
    "holland_code",
    "skill",
    "work_value",
    "industry",
    "work_style"
  ]).notNull(),
  attributeValue: varchar("attributeValue", { length: 100 }).notNull(),
  // Mapping strength
  weight: decimal("weight", { precision: 3, scale: 2 }).default("1.00"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var yogas = mysqlTable("yogas", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: mysqlEnum("category", ["wealth", "career", "raja", "spiritual", "other"]).notNull(),
  description: text("description"),
  // Detection rules (JSON format)
  detectionRules: json("detectionRules"),
  // Effects
  positiveEffects: text("positiveEffects"),
  negativeEffects: text("negativeEffects"),
  // Career implications
  careerImplications: text("careerImplications"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var userCareerRecommendations = mysqlTable("user_career_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileId: int("profileId").notNull(),
  // Recommendation data
  occupationId: int("occupationId"),
  incomeStreamId: int("incomeStreamId"),
  matchScore: decimal("matchScore", { precision: 5, scale: 2 }),
  matchReasons: json("matchReasons"),
  // Array of reasons
  // User interaction
  isSaved: boolean("isSaved").default(false),
  isHidden: boolean("isHidden").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var remedies = mysqlTable("remedies", {
  id: int("id").autoincrement().primaryKey(),
  // Target
  targetType: mysqlEnum("targetType", ["planet", "house", "yoga"]).notNull(),
  targetValue: varchar("targetValue", { length: 50 }).notNull(),
  // Remedy details
  remedyType: mysqlEnum("remedyType", [
    "mantra",
    "gemstone",
    "charity",
    "fasting",
    "deity_worship",
    "lifestyle"
  ]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  // Effectiveness
  difficulty: mysqlEnum("difficulty", ["easy", "moderate", "advanced"]),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createBirthProfile(profile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (profile.isPrimary) {
    await db.update(birthProfiles).set({ isPrimary: false }).where(eq(birthProfiles.userId, profile.userId));
  }
  const result = await db.insert(birthProfiles).values(profile);
  return result[0].insertId;
}
async function getBirthProfilesByUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(birthProfiles).where(eq(birthProfiles.userId, userId)).orderBy(desc(birthProfiles.isPrimary), desc(birthProfiles.createdAt));
}
async function getBirthProfileById(profileId, userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(birthProfiles).where(and(
    eq(birthProfiles.id, profileId),
    eq(birthProfiles.userId, userId)
  )).limit(1);
  return result[0];
}
async function updateBirthProfile(profileId, userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(birthProfiles).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(and(
    eq(birthProfiles.id, profileId),
    eq(birthProfiles.userId, userId)
  ));
}
async function setPrimaryProfile(profileId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(birthProfiles).set({ isPrimary: false }).where(eq(birthProfiles.userId, userId));
  await db.update(birthProfiles).set({ isPrimary: true }).where(and(
    eq(birthProfiles.id, profileId),
    eq(birthProfiles.userId, userId)
  ));
}
async function deleteBirthProfile(profileId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(birthProfiles).where(and(
    eq(birthProfiles.id, profileId),
    eq(birthProfiles.userId, userId)
  ));
}
async function getCareerCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(careerCategories);
}
async function getOccupations(categoryId) {
  const db = await getDb();
  if (!db) return [];
  if (categoryId) {
    return db.select().from(occupations).where(eq(occupations.categoryId, categoryId));
  }
  return db.select().from(occupations);
}
async function getIncomeStreams(category) {
  const db = await getDb();
  if (!db) return [];
  if (category) {
    return db.select().from(incomeStreams).where(eq(incomeStreams.category, category));
  }
  return db.select().from(incomeStreams);
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z2 } from "zod";

// server/astro/sweph.ts
import SwissEPH from "sweph-wasm";
import initSwisseph from "sweph-wasm/wasm/swisseph";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var require2 = createRequire(import.meta.url);
var SwissEphemeris = class _SwissEphemeris {
  static instance = null;
  static async getInstance() {
    if (!_SwissEphemeris.instance) {
      const wasmPath = require2.resolve("sweph-wasm/dist/wasm/swisseph.wasm");
      const wasmBinary = fs.readFileSync(wasmPath);
      const module = await initSwisseph({
        wasmBinary
      });
      _SwissEphemeris.instance = new SwissEPH(module);
    }
    return _SwissEphemeris.instance;
  }
  /**
   * Calculate Julian Day for UTC time
   */
  static async getJulianDay(date) {
    const swe = await this.getInstance();
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    return swe.swe_julday(year, month, day, hour, 1);
  }
  /**
   * Calculate Ayanamsa (Sidereal Offset)
   * Default: Lahiri (2)
   */
  static async getAyanamsa(jd) {
    const swe = await this.getInstance();
    swe.swe_set_sid_mode(1, 0, 0);
    return swe.swe_get_ayanamsa_ut(jd);
  }
  /**
   * Get Sidereal Planetary Positions
   */
  static async getPlanetPosition(jd, planetId) {
    const swe = await this.getInstance();
    swe.swe_set_sid_mode(1, 0, 0);
    const flags = 65536 | 256 | 2;
    const result = swe.swe_calc_ut(jd, planetId, flags);
    return {
      longitude: result[0],
      latitude: result[1],
      distance: result[2],
      speedLong: result[3],
      speedLat: result[4],
      speedDist: result[5]
    };
  }
  /**
   * Calculate Houses and Ascendant
   */
  static async getHouses(jd, lat, lon) {
    const swe = await this.getInstance();
    swe.swe_set_sid_mode(1, 0, 0);
    const ayanamsa = swe.swe_get_ayanamsa_ut(jd);
    const result = swe.swe_houses(jd, lat, lon, "W");
    const normalize = (deg) => (deg % 360 + 360) % 360;
    const siderealAscendant = normalize(result.ascmc[0] - ayanamsa);
    const siderealCusps = Array.from(result.cusps).slice(1).map((c) => normalize(c - ayanamsa));
    return {
      ascendant: siderealAscendant,
      cusps: siderealCusps
    };
  }
  /**
   * Map standard planet names to Swiss Ephemeris IDs
   */
  static getPlanetId(name) {
    const mapping = {
      "Sun": 0,
      "Moon": 1,
      "Mars": 4,
      "Mercury": 2,
      "Jupiter": 5,
      "Venus": 3,
      "Saturn": 6,
      "Rahu": 10,
      // Mean North Node
      "Ketu": -1,
      "Uranus": 7,
      "Neptune": 8,
      "Pluto": 9
    };
    return mapping[name] ?? -1;
  }
};

// server/astro/calculations.ts
var ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces"
];
var NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati"
];
var PLANET_DIGNITY = {
  "Sun": { exalted: "Aries", debilitated: "Libra", own: ["Leo"] },
  "Moon": { exalted: "Taurus", debilitated: "Scorpio", own: ["Cancer"] },
  "Mars": { exalted: "Capricorn", debilitated: "Cancer", own: ["Aries", "Scorpio"] },
  "Mercury": { exalted: "Virgo", debilitated: "Pisces", own: ["Gemini", "Virgo"] },
  "Jupiter": { exalted: "Cancer", debilitated: "Capricorn", own: ["Sagittarius", "Pisces"] },
  "Venus": { exalted: "Pisces", debilitated: "Virgo", own: ["Taurus", "Libra"] },
  "Saturn": { exalted: "Libra", debilitated: "Aries", own: ["Capricorn", "Aquarius"] },
  "Rahu": { exalted: "Taurus", debilitated: "Scorpio", own: ["Aquarius"] },
  // Common view
  "Ketu": { exalted: "Scorpio", debilitated: "Taurus", own: ["Scorpio"] }
  // Common view
};
var NAKSHATRA_LORDS = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury"
];
var DASHA_PERIODS = {
  "Ketu": 7,
  "Venus": 20,
  "Sun": 6,
  "Moon": 10,
  "Mars": 7,
  "Rahu": 18,
  "Jupiter": 16,
  "Saturn": 19,
  "Mercury": 17
};
var TOTAL_DASHA_YEARS = 120;
var SIGN_LORDS = [
  "Mars",
  // Aries
  "Venus",
  // Taurus
  "Mercury",
  // Gemini
  "Moon",
  // Cancer
  "Sun",
  // Leo
  "Mercury",
  // Virgo
  "Venus",
  // Libra
  "Mars",
  // Scorpio
  "Jupiter",
  // Sagittarius
  "Saturn",
  // Capricorn
  "Saturn",
  // Aquarius
  "Jupiter"
  // Pisces
];
function getSignLord(signIndex) {
  return SIGN_LORDS[signIndex % 12];
}
async function calculateAscendantPrecision(jd, latitude, longitude) {
  const result = await SwissEphemeris.getHouses(jd, latitude, longitude);
  return {
    siderealDegree: result.ascendant
  };
}
async function calculatePlanetaryPositionsPrecision(jd) {
  const planets = [];
  const planetNames = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Uranus", "Neptune", "Pluto"];
  for (const name of planetNames) {
    const id = SwissEphemeris.getPlanetId(name);
    const pos = await SwissEphemeris.getPlanetPosition(jd, id);
    const signIndex = Math.floor(pos.longitude / 30);
    const degreeInSign = pos.longitude % 30;
    const nakIndex = Math.floor(pos.longitude / (360 / 27));
    planets.push({
      planet: name,
      longitude: pos.longitude,
      sign: ZODIAC_SIGNS[signIndex],
      signIndex,
      degree: Math.floor(degreeInSign),
      minute: Math.floor(degreeInSign % 1 * 60),
      nakshatra: NAKSHATRAS[nakIndex],
      nakshatraIndex: nakIndex,
      nakshatraPada: Math.min(Math.floor(pos.longitude % (360 / 27) / (360 / (27 * 4))) + 1, 4),
      isRetrograde: pos.speedLong < 0,
      house: 1
      // Will be set later
    });
  }
  const rahu = planets.find((p) => p.planet === "Rahu");
  if (rahu) {
    const ketuLong = (rahu.longitude + 180) % 360;
    const signIndex = Math.floor(ketuLong / 30);
    const degreeInSign = ketuLong % 30;
    const nakIndex = Math.floor(ketuLong / (360 / 27));
    planets.push({
      planet: "Ketu",
      longitude: ketuLong,
      sign: ZODIAC_SIGNS[signIndex],
      signIndex,
      degree: Math.floor(degreeInSign),
      minute: Math.floor(degreeInSign % 1 * 60),
      nakshatra: NAKSHATRAS[nakIndex],
      nakshatraIndex: nakIndex,
      nakshatraPada: Math.min(Math.floor(ketuLong % (360 / 27) / (360 / (27 * 4))) + 1, 4),
      isRetrograde: rahu.isRetrograde,
      // Ketu is retrograde if Rahu is
      house: 1
    });
  }
  return planets;
}
function calculateHouseCusps(ascendantSignIndex) {
  const houses = [];
  for (let i = 0; i < 12; i++) {
    const signIndex = (ascendantSignIndex + i) % 12;
    const sign = ZODIAC_SIGNS[signIndex];
    houses.push({
      house: i + 1,
      sign,
      signIndex,
      degree: 0,
      minute: 0,
      // For whole sign, cusps are at 0 degrees, 0 minutes, 0 seconds
      second: 0,
      lord: getSignLord(signIndex)
    });
  }
  return houses;
}
function assignPlanetsToHouses(planets, ascendantSignIndex) {
  return planets.map((planet) => {
    let house = planet.signIndex - ascendantSignIndex + 1;
    if (house <= 0) house += 12;
    return { ...planet, house };
  });
}
function calculateDashas(moonLongitude, birthDate, depth = 3) {
  const nakshatraSpan = 360 / 27;
  const nakshatraIndex = Math.floor(moonLongitude / nakshatraSpan);
  const nakshatraLord = NAKSHATRA_LORDS[nakshatraIndex];
  const positionInNakshatra = moonLongitude % nakshatraSpan;
  const portionTraversed = positionInNakshatra / nakshatraSpan;
  const remainingPortion = 1 - portionTraversed;
  const dashaPeriod = DASHA_PERIODS[nakshatraLord];
  const balanceYears = dashaPeriod * remainingPortion;
  const dashaSequence = [
    "Ketu",
    "Venus",
    "Sun",
    "Moon",
    "Mars",
    "Rahu",
    "Jupiter",
    "Saturn",
    "Mercury"
  ];
  const startIndex = dashaSequence.indexOf(nakshatraLord);
  const orderedSequence = [
    ...dashaSequence.slice(startIndex),
    ...dashaSequence.slice(0, startIndex)
  ];
  const dashas = [];
  let currentDate = new Date(birthDate);
  const balanceDays = balanceYears * 365.25;
  const firstEndDate = new Date(currentDate.getTime() + balanceDays * 24 * 60 * 60 * 1e3);
  dashas.push({
    planet: orderedSequence[0],
    startDate: new Date(currentDate),
    endDate: firstEndDate,
    level: "mahadasha",
    years: balanceYears,
    subPeriods: calculateAntardashas(orderedSequence[0], currentDate, firstEndDate, balanceYears, depth)
  });
  currentDate = new Date(firstEndDate);
  for (let i = 1; i < 9; i++) {
    const planet = orderedSequence[i];
    const years = DASHA_PERIODS[planet];
    const days = years * 365.25;
    const endDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1e3);
    dashas.push({
      planet,
      startDate: new Date(currentDate),
      endDate,
      level: "mahadasha",
      years,
      subPeriods: calculateAntardashas(planet, currentDate, endDate, years, depth)
    });
    currentDate = new Date(endDate);
  }
  return dashas;
}
function calculateAntardashas(mahadashaLord, startDate, endDate, totalYears, depth = 3) {
  const dashaSequence = [
    "Ketu",
    "Venus",
    "Sun",
    "Moon",
    "Mars",
    "Rahu",
    "Jupiter",
    "Saturn",
    "Mercury"
  ];
  const startIndex = dashaSequence.indexOf(mahadashaLord);
  const orderedSequence = [
    ...dashaSequence.slice(startIndex),
    ...dashaSequence.slice(0, startIndex)
  ];
  const antardashas = [];
  let currentDate = new Date(startDate);
  for (const planet of orderedSequence) {
    const antarYears = totalYears * DASHA_PERIODS[planet] / TOTAL_DASHA_YEARS;
    const antarDays = antarYears * 365.25;
    const antarEndDate = new Date(currentDate.getTime() + antarDays * 24 * 60 * 60 * 1e3);
    antardashas.push({
      planet,
      startDate: new Date(currentDate),
      endDate: antarEndDate,
      level: "antardasha",
      years: antarYears,
      subPeriods: depth > 2 ? calculatePratyantardashas(mahadashaLord, planet, currentDate, antarEndDate, antarYears, depth) : void 0
    });
    currentDate = new Date(antarEndDate);
  }
  return antardashas;
}
function calculatePratyantardashas(mahadashaLord, antardashaLord, startDate, endDate, totalYears, depth = 3) {
  const dashaSequence = [
    "Ketu",
    "Venus",
    "Sun",
    "Moon",
    "Mars",
    "Rahu",
    "Jupiter",
    "Saturn",
    "Mercury"
  ];
  const startIndex = dashaSequence.indexOf(antardashaLord);
  const orderedSequence = [
    ...dashaSequence.slice(startIndex),
    ...dashaSequence.slice(0, startIndex)
  ];
  const pratyantardashas = [];
  let currentDate = new Date(startDate);
  for (const planet of orderedSequence) {
    const pratyantarYears = totalYears * DASHA_PERIODS[planet] / TOTAL_DASHA_YEARS;
    const pratyantarDays = pratyantarYears * 365.25;
    const pratyantarEndDate = new Date(currentDate.getTime() + pratyantarDays * 24 * 60 * 60 * 1e3);
    pratyantardashas.push({
      planet,
      startDate: new Date(currentDate),
      endDate: pratyantarEndDate,
      level: "pratyantardasha",
      years: pratyantarYears,
      subPeriods: depth > 3 ? calculateSookshmadashas(mahadashaLord, antardashaLord, planet, currentDate, pratyantarEndDate, pratyantarYears, depth) : void 0
    });
    currentDate = new Date(pratyantarEndDate);
  }
  return pratyantardashas;
}
function calculateSookshmadashas(mdLord, adLord, pdLord, startDate, endDate, totalYears, depth = 3) {
  const dashaSequence = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
  const startIndex = dashaSequence.indexOf(pdLord);
  const orderedSequence = [...dashaSequence.slice(startIndex), ...dashaSequence.slice(0, startIndex)];
  const sookshmadashas = [];
  let currentDate = new Date(startDate);
  for (const planet of orderedSequence) {
    const years = totalYears * DASHA_PERIODS[planet] / TOTAL_DASHA_YEARS;
    const days = years * 365.25;
    const nextEndDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1e3);
    sookshmadashas.push({
      planet,
      startDate: new Date(currentDate),
      endDate: nextEndDate,
      level: "sookshmadasha",
      years,
      subPeriods: depth > 4 ? calculatePraanadashas(mdLord, adLord, pdLord, planet, currentDate, nextEndDate, years, depth) : void 0
    });
    currentDate = new Date(nextEndDate);
  }
  return sookshmadashas;
}
function calculatePraanadashas(mdLord, adLord, pdLord, sdLord, startDate, endDate, totalYears, depth = 3) {
  const dashaSequence = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
  const startIndex = dashaSequence.indexOf(sdLord);
  const orderedSequence = [...dashaSequence.slice(startIndex), ...dashaSequence.slice(0, startIndex)];
  const praanadashas = [];
  let currentDate = new Date(startDate);
  for (const planet of orderedSequence) {
    const years = totalYears * DASHA_PERIODS[planet] / TOTAL_DASHA_YEARS;
    const days = years * 365.25;
    const nextEndDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1e3);
    praanadashas.push({
      planet,
      startDate: new Date(currentDate),
      endDate: nextEndDate,
      level: "praanadasha",
      years
    });
    currentDate = new Date(nextEndDate);
  }
  return praanadashas;
}
function getCurrentDasha(dashas, date = /* @__PURE__ */ new Date()) {
  let result = {
    mahadasha: "",
    mahadashaStart: /* @__PURE__ */ new Date(),
    mahadashaEnd: /* @__PURE__ */ new Date(),
    antardasha: "",
    antardashaStart: /* @__PURE__ */ new Date(),
    antardashaEnd: /* @__PURE__ */ new Date(),
    pratyantardasha: "",
    sookshmadasha: "",
    praanadasha: "",
    progress: 0
  };
  for (const dasha of dashas) {
    if (date >= dasha.startDate && date <= dasha.endDate) {
      result.mahadasha = dasha.planet;
      result.mahadashaStart = dasha.startDate;
      result.mahadashaEnd = dasha.endDate;
      const totalDuration = dasha.endDate.getTime() - dasha.startDate.getTime();
      const elapsed = date.getTime() - dasha.startDate.getTime();
      result.progress = Math.round(elapsed / totalDuration * 100);
      if (dasha.subPeriods) {
        for (const antar of dasha.subPeriods) {
          if (date >= antar.startDate && date <= antar.endDate) {
            result.antardasha = antar.planet;
            result.antardashaStart = antar.startDate;
            result.antardashaEnd = antar.endDate;
            if (antar.subPeriods) {
              for (const pratyantar of antar.subPeriods) {
                if (date >= pratyantar.startDate && date <= pratyantar.endDate) {
                  result.pratyantardasha = pratyantar.planet;
                  if (pratyantar.subPeriods) {
                    for (const sookshma of pratyantar.subPeriods) {
                      if (date >= sookshma.startDate && date <= sookshma.endDate) {
                        result.sookshmadasha = sookshma.planet;
                        if (sookshma.subPeriods) {
                          for (const praana of sookshma.subPeriods) {
                            if (date >= praana.startDate && date <= praana.endDate) {
                              result.praanadasha = praana.planet;
                              break;
                            }
                          }
                        }
                        break;
                      }
                    }
                  }
                  break;
                }
              }
            }
            break;
          }
        }
      }
      break;
    }
  }
  return result;
}
function pruneDashaTree(dasha, currentDate = /* @__PURE__ */ new Date()) {
  if (!dasha) return null;
  const pruned = { ...dasha };
  if (pruned.subPeriods) {
    pruned.subPeriods = pruned.subPeriods.map((antar) => {
      const prunedAntar = { ...antar };
      const isCurrentAntar = currentDate >= new Date(antar.startDate) && currentDate <= new Date(antar.endDate);
      if (prunedAntar.subPeriods) {
        if (isCurrentAntar) {
          prunedAntar.subPeriods = prunedAntar.subPeriods.map((pratyantar) => {
            const prunedPratyantar = { ...pratyantar };
            const isCurrentPratyantar = currentDate >= new Date(pratyantar.startDate) && currentDate <= new Date(pratyantar.endDate);
            if (prunedPratyantar.subPeriods) {
              if (isCurrentPratyantar) {
                prunedPratyantar.subPeriods = prunedPratyantar.subPeriods.map((sookshma) => {
                  const prunedSookshma = { ...sookshma };
                  const isCurrentSookshma = currentDate >= new Date(sookshma.startDate) && currentDate <= new Date(sookshma.endDate);
                  if (!isCurrentSookshma && prunedSookshma.subPeriods) {
                    delete prunedSookshma.subPeriods;
                  }
                  return prunedSookshma;
                });
              } else {
                delete prunedPratyantar.subPeriods;
              }
            }
            return prunedPratyantar;
          });
        } else {
          delete prunedAntar.subPeriods;
        }
      }
      return prunedAntar;
    });
  }
  return pruned;
}
function calculateVargaChart(d1Planets, ascendantLongitude, division, name) {
  const vargaPlanets = d1Planets.map((planet) => {
    const totalDegree = planet.longitude;
    let vargaSignIndex;
    const degreeInSign = totalDegree % 30;
    const d1SignIndex = Math.floor(totalDegree / 30);
    switch (division) {
      case 2:
        if (d1SignIndex % 2 === 0) {
          vargaSignIndex = degreeInSign < 15 ? 4 : 3;
        } else {
          vargaSignIndex = degreeInSign < 15 ? 3 : 4;
        }
        break;
      case 3:
        const d3Part = Math.floor(degreeInSign / 10);
        const d3Offsets = [0, 4, 8];
        vargaSignIndex = (d1SignIndex + d3Offsets[d3Part]) % 12;
        break;
      case 4:
        const chaturPart = Math.floor(degreeInSign / 7.5);
        vargaSignIndex = (d1SignIndex + chaturPart * 3) % 12;
        break;
      case 7:
        const d7Part = Math.floor(degreeInSign / (30 / 7));
        if (d1SignIndex % 2 === 0) {
          vargaSignIndex = (d1SignIndex + d7Part) % 12;
        } else {
          vargaSignIndex = (d1SignIndex + 6 + d7Part) % 12;
        }
        break;
      case 8:
        const d8Part = Math.floor(degreeInSign / 3.75);
        if (d1SignIndex % 3 === 0) {
          vargaSignIndex = (0 + d8Part) % 12;
        } else if (d1SignIndex % 3 === 1) {
          vargaSignIndex = (8 + d8Part) % 12;
        } else {
          vargaSignIndex = (4 + d8Part) % 12;
        }
        break;
      case 9:
        const d9Part = Math.floor(degreeInSign / (30 / 9));
        const element = d1SignIndex % 4;
        const startSign = [0, 9, 6, 3][element];
        vargaSignIndex = (startSign + d9Part) % 12;
        break;
      case 10:
        const d10Part = Math.floor(degreeInSign / 3);
        if (d1SignIndex % 2 === 0) {
          vargaSignIndex = (d1SignIndex + d10Part) % 12;
        } else {
          vargaSignIndex = (d1SignIndex + 8 + d10Part) % 12;
        }
        break;
      case 12:
        const d12Part = Math.floor(degreeInSign / 2.5);
        vargaSignIndex = (d1SignIndex + d12Part) % 12;
        break;
      case 16:
        const d16Part = Math.floor(degreeInSign / 1.875);
        if (d1SignIndex % 3 === 0) {
          vargaSignIndex = (0 + d16Part) % 12;
        } else if (d1SignIndex % 3 === 1) {
          vargaSignIndex = (4 + d16Part) % 12;
        } else {
          vargaSignIndex = (8 + d16Part) % 12;
        }
        break;
      case 24:
        const d24Part = Math.floor(degreeInSign / 1.25);
        if (d1SignIndex % 2 === 0) {
          vargaSignIndex = (4 + d24Part) % 12;
        } else {
          vargaSignIndex = (3 + d24Part) % 12;
        }
        break;
      case 60:
        const d60Part = Math.floor(degreeInSign / 0.5);
        vargaSignIndex = (d1SignIndex + d60Part) % 12;
        break;
      default:
        const defaultPart = Math.floor(degreeInSign / (30 / division));
        vargaSignIndex = (d1SignIndex * division + defaultPart) % 12;
    }
    const vargaDegreeInSign = degreeInSign * division % 30;
    return {
      ...planet,
      longitude: vargaSignIndex * 30 + vargaDegreeInSign,
      sign: ZODIAC_SIGNS[vargaSignIndex],
      signIndex: vargaSignIndex,
      degree: Math.floor(vargaDegreeInSign),
      minute: Math.floor(vargaDegreeInSign % 1 * 60),
      second: Math.round(vargaDegreeInSign % 1 * 60 % 1 * 60),
      house: 1
    };
  });
  const ascDegreeInSign = ascendantLongitude % 30;
  const ascD1SignIndex = Math.floor(ascendantLongitude / 30);
  console.log(`[DEBUG] Chart: ${name}, division: ${division}, ascD1SignIndex: ${ascD1SignIndex}, ascDegreeInSign: ${ascDegreeInSign}`);
  let vargaAscSignIndex;
  switch (division) {
    case 2:
      vargaAscSignIndex = ascD1SignIndex % 2 === 0 ? ascDegreeInSign < 15 ? 4 : 3 : ascDegreeInSign < 15 ? 3 : 4;
      break;
    case 3:
      const ascD3Part = Math.floor(ascDegreeInSign / 10);
      const ascD3Offsets = [0, 4, 8];
      vargaAscSignIndex = (ascD1SignIndex + ascD3Offsets[ascD3Part]) % 12;
      break;
    case 4:
      vargaAscSignIndex = (ascD1SignIndex + Math.floor(ascDegreeInSign / 7.5) * 3) % 12;
      break;
    case 7:
      const v7Part = Math.floor(ascDegreeInSign / (30 / 7));
      vargaAscSignIndex = ascD1SignIndex % 2 === 0 ? (ascD1SignIndex + v7Part) % 12 : (ascD1SignIndex + 6 + v7Part) % 12;
      break;
    case 8:
      const ascD8Part = Math.floor(ascDegreeInSign / 3.75);
      if (ascD1SignIndex % 3 === 0) {
        vargaAscSignIndex = (0 + ascD8Part) % 12;
      } else if (ascD1SignIndex % 3 === 1) {
        vargaAscSignIndex = (8 + ascD8Part) % 12;
      } else {
        vargaAscSignIndex = (4 + ascD8Part) % 12;
      }
      break;
    case 9:
      const ascNavamsaPart = Math.floor(ascDegreeInSign / (30 / 9));
      const ascElement = ascD1SignIndex % 4;
      const ascStartSign = [0, 9, 6, 3][ascElement];
      vargaAscSignIndex = (ascStartSign + ascNavamsaPart) % 12;
      break;
    case 10:
      const ascDasamsaPart = Math.floor(ascDegreeInSign / 3);
      vargaAscSignIndex = ascD1SignIndex % 2 === 0 ? (ascD1SignIndex + ascDasamsaPart) % 12 : (ascD1SignIndex + 8 + ascDasamsaPart) % 12;
      break;
    case 12:
      vargaAscSignIndex = (ascD1SignIndex + Math.floor(ascDegreeInSign / 2.5)) % 12;
      break;
    case 16:
      const v16Part = Math.floor(ascDegreeInSign / 1.875);
      if (ascD1SignIndex % 3 === 0) {
        vargaAscSignIndex = (0 + v16Part) % 12;
      } else if (ascD1SignIndex % 3 === 1) {
        vargaAscSignIndex = (4 + v16Part) % 12;
      } else {
        vargaAscSignIndex = (8 + v16Part) % 12;
      }
      break;
    case 24:
      const ascD24Part = Math.floor(ascDegreeInSign / 1.25);
      vargaAscSignIndex = ascD1SignIndex % 2 === 0 ? (4 + ascD24Part) % 12 : (3 + ascD24Part) % 12;
      break;
    case 60:
      vargaAscSignIndex = (ascD1SignIndex + Math.floor(ascDegreeInSign / 0.5)) % 12;
      break;
    default:
      const ascPart = Math.floor(ascDegreeInSign / (30 / division));
      vargaAscSignIndex = (ascD1SignIndex * division + ascPart) % 12;
  }
  const planetsWithHouses = assignPlanetsToHouses(vargaPlanets, vargaAscSignIndex);
  return {
    name,
    division,
    planets: planetsWithHouses,
    ascendant: {
      sign: ZODIAC_SIGNS[vargaAscSignIndex],
      signIndex: vargaAscSignIndex,
      degree: Math.floor(ascDegreeInSign * division % 30),
      minute: Math.floor(ascDegreeInSign * division % 30 % 1 * 60),
      second: Math.round(ascDegreeInSign * division % 30 % 1 * 60 % 1 * 60)
    }
  };
}
function detectYogas(chart) {
  const yogas2 = [];
  const planets = chart.planets;
  const houses = chart.houses;
  const getPlanetByName = (name) => planets.find((p) => p.planet === name);
  const getPlanetsInHouse = (house) => planets.filter((p) => p.house === house);
  const getHouseLord = (house) => houses[house - 1]?.lord;
  const areInKendra = (house1, house2) => {
    const diff = Math.abs(house1 - house2);
    return [0, 3, 6, 9].includes(diff) || [0, 3, 6, 9].includes(12 - diff);
  };
  const lord2 = getHouseLord(2);
  const lord11 = getHouseLord(11);
  const planet2 = getPlanetByName(lord2 || "");
  const planet11 = getPlanetByName(lord11 || "");
  if (planet2 && planet11 && planet2.house === planet11.house) {
    yogas2.push({
      name: "Dhana Yoga",
      category: "wealth",
      strength: "strong",
      description: "Lords of 2nd and 11th houses are conjunct, indicating strong wealth potential.",
      effects: "Accumulation of wealth through multiple sources.",
      careerImplication: "Favorable for careers in finance, business, and wealth management."
    });
  }
  const jupiter = getPlanetByName("Jupiter");
  const moon = getPlanetByName("Moon");
  if (jupiter && moon && areInKendra(jupiter.house, moon.house)) {
    yogas2.push({
      name: "Gaja Kesari Yoga",
      category: "career",
      strength: "strong",
      description: "Jupiter in kendra from Moon, bestowing wisdom, fame, and prosperity.",
      effects: "Recognition, respect, and success in endeavors.",
      careerImplication: "Success in teaching, advisory roles, and positions of authority."
    });
  }
  const trikonaHouses = [1, 5, 9];
  const kendraHouses = [1, 4, 7, 10];
  const trikonaLords = trikonaHouses.map((h) => getHouseLord(h));
  const kendraLords = kendraHouses.map((h) => getHouseLord(h));
  for (const tLord of trikonaLords) {
    for (const kLord of kendraLords) {
      if (tLord && kLord && tLord !== kLord) {
        const tPlanet = getPlanetByName(tLord);
        const kPlanet = getPlanetByName(kLord);
        if (tPlanet && kPlanet && tPlanet.house === kPlanet.house) {
          yogas2.push({
            name: "Raja Yoga",
            category: "raja",
            strength: "strong",
            description: `Lords of trikona and kendra houses (${tLord} and ${kLord}) are conjunct.`,
            effects: "Rise to positions of power and authority.",
            careerImplication: "Indicates rise to positions of power and leadership."
          });
          break;
        }
      }
    }
  }
  const sun = getPlanetByName("Sun");
  const mercury = getPlanetByName("Mercury");
  if (sun && mercury && sun.house === mercury.house) {
    yogas2.push({
      name: "Nipuna (Budha-Aditya) Yoga",
      category: "career",
      strength: "moderate",
      description: "Sun and Mercury conjunction, bestowing intelligence and communication skills.",
      effects: "Sharp intellect, good communication, and analytical abilities.",
      careerImplication: "Excellent for careers in communication, writing, and intellectual pursuits."
    });
  }
  const mars = getPlanetByName("Mars");
  if (moon && mars && moon.house === mars.house) {
    yogas2.push({
      name: "Chandra-Mangala Yoga",
      category: "wealth",
      strength: "moderate",
      description: "Moon and Mars conjunction, indicating earning through courage and initiative.",
      effects: "Wealth through bold actions and entrepreneurship.",
      careerImplication: "Success in real estate, manufacturing, and entrepreneurial ventures."
    });
  }
  const benefics = ["Jupiter", "Venus", "Mercury"];
  const upachayas = [3, 6, 10, 11];
  let beneficsInUpachaya = 0;
  if (moon) {
    for (const benefic of benefics) {
      const planet = getPlanetByName(benefic);
      if (planet) {
        let houseFromMoon = planet.house - moon.house + 1;
        if (houseFromMoon <= 0) houseFromMoon += 12;
        if (upachayas.includes(houseFromMoon)) beneficsInUpachaya++;
      }
    }
  }
  if (beneficsInUpachaya >= 2) {
    yogas2.push({
      name: "Vasumati Yoga",
      category: "wealth",
      strength: beneficsInUpachaya >= 3 ? "strong" : "moderate",
      description: "Benefic planets in upachaya houses from Moon, indicating wealth accumulation.",
      effects: "Steady growth of wealth over time.",
      careerImplication: "Financial success through multiple income streams."
    });
  }
  const saraswatiPlanets = ["Jupiter", "Venus", "Mercury"];
  const kendraTrikonas = [1, 4, 5, 7, 9, 10];
  let saraswatiCount = 0;
  for (const pName of saraswatiPlanets) {
    const planet = getPlanetByName(pName);
    if (planet && kendraTrikonas.includes(planet.house)) {
      saraswatiCount++;
    }
  }
  if (saraswatiCount >= 2) {
    yogas2.push({
      name: "Saraswati Yoga",
      category: "knowledge",
      strength: saraswatiCount >= 3 ? "strong" : "moderate",
      description: "Jupiter, Venus, and Mercury well-placed, bestowing knowledge and artistic talents.",
      effects: "Excellence in learning, arts, and creative expression.",
      careerImplication: "Excellence in education, arts, music, and creative fields."
    });
  }
  const lord9 = getHouseLord(9);
  const planet9 = getPlanetByName(lord9 || "");
  if (planet9 && kendraTrikonas.includes(planet9.house)) {
    yogas2.push({
      name: "Lakshmi Yoga",
      category: "wealth",
      strength: "strong",
      description: "9th lord well-placed in kendra or trikona, blessing with fortune and prosperity.",
      effects: "Good fortune, wealth, and spiritual growth.",
      careerImplication: "Success in politics, government, and public service."
    });
  }
  for (let h1 = 1; h1 <= 12; h1++) {
    for (let h2 = h1 + 1; h2 <= 12; h2++) {
      const lord1 = getHouseLord(h1);
      const lord22 = getHouseLord(h2);
      const p1 = getPlanetByName(lord1 || "");
      const p2 = getPlanetByName(lord22 || "");
      if (lord1 && lord22 && p1 && p2 && !lord1.includes("Rahu") && !lord1.includes("Ketu") && !lord22.includes("Rahu") && !lord22.includes("Ketu")) {
        if (p1.house === h2 && p2.house === h1) {
          let type = "Maha Parivartana";
          const dusthanas = [6, 8, 12];
          const third = 3;
          if (dusthanas.includes(h1) || dusthanas.includes(h2)) {
            type = "Dainya Parivartana";
          } else if (h1 === 3 || h2 === 3) {
            type = "Khala Parivartana";
          }
          yogas2.push({
            name: `${type} (Exchange)`,
            category: "wealth",
            strength: type === "Maha Parivartana" ? "strong" : "moderate",
            description: `Exchange of lords between house ${h1} and ${h2}. Money generates money loop.`,
            effects: type === "Maha Parivartana" ? "Great prosperity and success." : "Mixed results with some struggles.",
            careerImplication: "Indicates strong interconnected ventures or career paths."
          });
        }
      }
    }
  }
  const lagnaLordName = getHouseLord(1);
  const moonPlanet = getPlanetByName("Moon");
  if (lagnaLordName && moonPlanet) {
    const lagnaLord = getPlanetByName(lagnaLordName);
    const signLords = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
    const moonSignLordName = signLords[moonPlanet.signIndex];
    const msLord = getPlanetByName(moonSignLordName);
    if (lagnaLord && msLord && lagnaLord.house === msLord.house) {
      if ([1, 4, 7, 10, 5, 9].includes(lagnaLord.house)) {
        yogas2.push({
          name: "Pushkala Yoga",
          category: "status",
          strength: "strong",
          description: "Moon sign lord and Lagna lord are conjunct in a good house.",
          effects: "Wealth, honor, and sweet speech.",
          careerImplication: "High status and reputation."
        });
      }
    }
  }
  const dusthanaLords = [6, 8, 12].map((h) => getHouseLord(h));
  for (const lordName of dusthanaLords) {
    if (lordName) {
      const planet = getPlanetByName(lordName);
      if (planet && [6, 8, 12].includes(planet.house)) {
        yogas2.push({
          name: "Vipareeta Rajayoga",
          category: "raja",
          strength: "moderate",
          // Depends on if lagna lord is strong
          description: `Lord of dusthana (${lordName}) placed in dusthana house (${planet.house}).`,
          effects: "Success through obstacles or competitors' failures.",
          careerImplication: "Success in crisis management, law, or competitive fields."
        });
        break;
      }
    }
  }
  if (sun) {
    const house2FromSun = sun.house % 12 + 1;
    const vesiPlanets = planets.filter(
      (p) => p.house === house2FromSun && !["Moon", "Rahu", "Ketu"].includes(p.planet)
    );
    if (vesiPlanets.length > 0) {
      yogas2.push({
        name: "Vesi Yoga",
        category: "personality",
        strength: "moderate",
        description: `Formed by ${vesiPlanets.map((p) => p.planet).join(", ")} in 2nd house from Sun.`,
        effects: "May have weak eyesight but firm in word and hardworking. Financially stable.",
        careerImplication: "Success through hard work and persistence."
      });
    }
  }
  if (mercury) {
    const mercurySignIndex = mercury.signIndex;
    const isStrongSign = [2, 5].includes(mercury.signIndex);
    const isInKendra = [1, 4, 7, 10].includes(mercury.house);
    if (isStrongSign && isInKendra) {
      yogas2.push({
        name: "Bhadra Maha Purusha Yoga",
        category: "mahapurusha",
        strength: "strong",
        description: "Mercury in Kendra (1, 4, 7, 10) in its own or exalted sign (Gemini/Virgo).",
        effects: "Knowledgeable, joyful, supportive of family. Excellent communication skills, analytical mind, good sense of humor.",
        careerImplication: "Excellent for analytics, mathematics, communication, and business."
      });
    }
  }
  const getConjunction = (pNames) => {
    const pObjs = pNames.map((n) => getPlanetByName(n)).filter((p) => p !== void 0);
    if (pObjs.length !== pNames.length) return false;
    const firstHouse = pObjs[0].house;
    return pObjs.every((p) => p.house === firstHouse);
  };
  if (getConjunction(["Sun", "Mercury", "Venus"])) {
    yogas2.push({
      name: "Sun + Mercury + Venus Yoga",
      category: "conjunction",
      strength: "strong",
      description: "Sun, Mercury, and Venus conjunction.",
      effects: "Insatiable nature, talkative demeanor, inclination towards travel. Skilled in arts and luxury.",
      careerImplication: "Success in media, travel, or luxury industries."
    });
  }
  if (getConjunction(["Sun", "Venus"])) {
    yogas2.push({
      name: "Sun + Venus (Dwi Graha)",
      category: "conjunction",
      strength: "moderate",
      description: "Sun and Venus conjunction.",
      effects: "Charming personality, skilled in arts, attraction to luxury. Potential for leadership.",
      careerImplication: "Arts, entertainment, and diplomacy."
    });
  }
  if (getConjunction(["Mercury", "Venus"])) {
    yogas2.push({
      name: "Mercury + Venus (Dwi Graha)",
      category: "conjunction",
      strength: "strong",
      description: "Mercury and Venus conjunction.",
      effects: "Considerable wealth, eloquence in speech, talents in singing/humor.",
      careerImplication: "Politics, public speaking, arts, and commerce."
    });
  }
  return yogas2;
}
async function generateBirthChart(birthData) {
  const [year, month, day] = birthData.date.split("-").map(Number);
  const [hour, min, sec] = birthData.time.split(":").map(Number);
  const birthDate = new Date(Date.UTC(year, month - 1, day, hour, min, sec || 0));
  const localJd = await SwissEphemeris.getJulianDay(birthDate);
  const jd = localJd - birthData.timezone / 24;
  const ayanamsaValue = await SwissEphemeris.getAyanamsa(jd);
  const ascResult = await calculateAscendantPrecision(jd, birthData.latitude, birthData.longitude);
  const ascSidereal = ascResult.siderealDegree;
  const ascSignIndex = Math.floor(ascSidereal / 30);
  const ascDegreeInSign = ascSidereal % 30;
  const ascNakIndex = Math.floor(ascSidereal / (360 / 27));
  let planets = await calculatePlanetaryPositionsPrecision(jd);
  const houses = calculateHouseCusps(ascSignIndex);
  planets = assignPlanetsToHouses(planets, ascSignIndex);
  return {
    birthData,
    ascendant: {
      sign: ZODIAC_SIGNS[ascSignIndex],
      signIndex: ascSignIndex,
      degree: Math.floor(ascDegreeInSign),
      minute: Math.floor(ascDegreeInSign % 1 * 60),
      second: Math.round(ascDegreeInSign % 1 * 60 % 1 * 60),
      nakshatra: NAKSHATRAS[ascNakIndex]
    },
    planets,
    houses,
    ayanamsaUsed: "Lahiri",
    ayanamsaValue
  };
}
async function generateFullChartData(birthData, includeDeepDashas = false) {
  console.log("[DEBUG] generateFullChartData input:", JSON.stringify(birthData));
  const d1 = await generateBirthChart(birthData);
  const ascLongitude = d1.ascendant.signIndex * 30 + d1.ascendant.degree;
  const vargas = {
    d2: calculateVargaChart(d1.planets, ascLongitude, 2, "Hora"),
    d3: calculateVargaChart(d1.planets, ascLongitude, 3, "Drekkana"),
    d4: calculateVargaChart(d1.planets, ascLongitude, 4, "Chaturthamsa"),
    d7: calculateVargaChart(d1.planets, ascLongitude, 7, "Saptamsa"),
    d8: calculateVargaChart(d1.planets, ascLongitude, 8, "Ashtamsha"),
    d9: calculateVargaChart(d1.planets, ascLongitude, 9, "Navamsa"),
    d10: calculateVargaChart(d1.planets, ascLongitude, 10, "Dasamsa"),
    d12: calculateVargaChart(d1.planets, ascLongitude, 12, "Dwadasamsa"),
    d16: calculateVargaChart(d1.planets, ascLongitude, 16, "Shodashamsa"),
    d24: calculateVargaChart(d1.planets, ascLongitude, 24, "Chaturvimshamsha"),
    d60: calculateVargaChart(d1.planets, ascLongitude, 60, "Shashtiamsa")
  };
  const moon = d1.planets.find((p) => p.planet === "Moon");
  const [year, month, day] = birthData.date.split("-").map(Number);
  const [hour, min, sec] = birthData.time.split(":").map(Number);
  const birthDate = new Date(Date.UTC(year, month - 1, day, hour, min, sec || 0));
  const dashas = calculateDashas(moon?.longitude || 0, birthDate, includeDeepDashas ? 5 : 3);
  const currentDasha = getCurrentDasha(dashas);
  const yogas2 = detectYogas(d1);
  return {
    d1,
    d2: vargas.d2,
    d3: vargas.d3,
    d4: vargas.d4,
    d7: vargas.d7,
    d8: vargas.d8,
    d9: vargas.d9,
    d10: vargas.d10,
    d12: vargas.d12,
    d16: vargas.d16,
    d24: vargas.d24,
    d60: vargas.d60,
    dashas,
    currentDasha,
    yogas: yogas2
  };
}
function getPlanetDignity(planetName, signName) {
  const dignity = PLANET_DIGNITY[planetName];
  if (!dignity) return "neutral";
  if (dignity.exalted === signName) return "exalted";
  if (dignity.debilitated === signName) return "debilitated";
  if (dignity.own.includes(signName)) return "own";
  return "neutral";
}

// server/astro/careerMapping.ts
var PLANET_CAREER_ATTRIBUTES = {
  "Sun": [
    { type: "holland_code", value: "E", weight: 2, source: "Sun - Leadership" },
    { type: "skill", value: "leadership", weight: 2, source: "Sun - Authority" },
    { type: "work_value", value: "recognition", weight: 1.8, source: "Sun - Fame" },
    { type: "industry", value: "government", weight: 1.5, source: "Sun - Authority" },
    { type: "industry", value: "politics", weight: 1.5, source: "Sun - Power" },
    { type: "work_style", value: "independent", weight: 1.5, source: "Sun - Self" }
  ],
  "Moon": [
    { type: "holland_code", value: "S", weight: 2, source: "Moon - Nurturing" },
    { type: "skill", value: "emotional_intelligence", weight: 2, source: "Moon - Emotions" },
    { type: "work_value", value: "helping_others", weight: 1.8, source: "Moon - Care" },
    { type: "industry", value: "healthcare", weight: 1.6, source: "Moon - Healing" },
    { type: "industry", value: "hospitality", weight: 1.4, source: "Moon - Comfort" },
    { type: "industry", value: "food", weight: 1.3, source: "Moon - Nourishment" },
    { type: "work_style", value: "collaborative", weight: 1.5, source: "Moon - Connection" }
  ],
  "Mars": [
    { type: "holland_code", value: "R", weight: 2, source: "Mars - Action" },
    { type: "skill", value: "technical", weight: 1.8, source: "Mars - Engineering" },
    { type: "skill", value: "physical", weight: 1.6, source: "Mars - Strength" },
    { type: "work_value", value: "achievement", weight: 1.8, source: "Mars - Competition" },
    { type: "industry", value: "engineering", weight: 1.7, source: "Mars - Technical" },
    { type: "industry", value: "military", weight: 1.5, source: "Mars - Combat" },
    { type: "industry", value: "sports", weight: 1.6, source: "Mars - Physical" },
    { type: "industry", value: "real_estate", weight: 1.4, source: "Mars - Property" },
    { type: "work_style", value: "competitive", weight: 1.6, source: "Mars - Drive" }
  ],
  "Mercury": [
    { type: "holland_code", value: "I", weight: 1.8, source: "Mercury - Analysis" },
    { type: "holland_code", value: "C", weight: 1.6, source: "Mercury - Detail" },
    { type: "skill", value: "communication", weight: 2, source: "Mercury - Speech" },
    { type: "skill", value: "analytical", weight: 1.8, source: "Mercury - Logic" },
    { type: "skill", value: "writing", weight: 1.6, source: "Mercury - Expression" },
    { type: "industry", value: "technology", weight: 1.8, source: "Mercury - Computing" },
    { type: "industry", value: "media", weight: 1.6, source: "Mercury - Communication" },
    { type: "industry", value: "finance", weight: 1.5, source: "Mercury - Calculation" },
    { type: "industry", value: "trading", weight: 1.4, source: "Mercury - Commerce" },
    { type: "work_style", value: "detail_oriented", weight: 1.6, source: "Mercury - Precision" }
  ],
  "Jupiter": [
    { type: "holland_code", value: "S", weight: 1.6, source: "Jupiter - Teaching" },
    { type: "holland_code", value: "E", weight: 1.4, source: "Jupiter - Expansion" },
    { type: "skill", value: "teaching", weight: 2, source: "Jupiter - Wisdom" },
    { type: "skill", value: "advisory", weight: 1.8, source: "Jupiter - Guidance" },
    { type: "work_value", value: "growth", weight: 1.8, source: "Jupiter - Expansion" },
    { type: "industry", value: "education", weight: 2, source: "Jupiter - Knowledge" },
    { type: "industry", value: "law", weight: 1.7, source: "Jupiter - Justice" },
    { type: "industry", value: "consulting", weight: 1.6, source: "Jupiter - Advisory" },
    { type: "industry", value: "banking", weight: 1.4, source: "Jupiter - Wealth" },
    { type: "work_style", value: "mentoring", weight: 1.6, source: "Jupiter - Guidance" }
  ],
  "Venus": [
    { type: "holland_code", value: "A", weight: 2, source: "Venus - Arts" },
    { type: "skill", value: "creativity", weight: 2, source: "Venus - Beauty" },
    { type: "skill", value: "design", weight: 1.8, source: "Venus - Aesthetics" },
    { type: "skill", value: "negotiation", weight: 1.4, source: "Venus - Diplomacy" },
    { type: "work_value", value: "beauty", weight: 1.6, source: "Venus - Harmony" },
    { type: "industry", value: "entertainment", weight: 1.8, source: "Venus - Pleasure" },
    { type: "industry", value: "fashion", weight: 1.7, source: "Venus - Beauty" },
    { type: "industry", value: "luxury", weight: 1.6, source: "Venus - Comfort" },
    { type: "industry", value: "hospitality", weight: 1.5, source: "Venus - Service" },
    { type: "work_style", value: "harmonious", weight: 1.5, source: "Venus - Balance" }
  ],
  "Saturn": [
    { type: "holland_code", value: "C", weight: 2, source: "Saturn - Structure" },
    { type: "holland_code", value: "R", weight: 1.4, source: "Saturn - Labor" },
    { type: "skill", value: "management", weight: 1.8, source: "Saturn - Organization" },
    { type: "skill", value: "discipline", weight: 2, source: "Saturn - Persistence" },
    { type: "work_value", value: "stability", weight: 2, source: "Saturn - Security" },
    { type: "industry", value: "construction", weight: 1.6, source: "Saturn - Building" },
    { type: "industry", value: "agriculture", weight: 1.4, source: "Saturn - Land" },
    { type: "industry", value: "manufacturing", weight: 1.5, source: "Saturn - Industry" },
    { type: "industry", value: "mining", weight: 1.4, source: "Saturn - Earth" },
    { type: "work_style", value: "methodical", weight: 1.8, source: "Saturn - Process" }
  ],
  "Rahu": [
    { type: "holland_code", value: "E", weight: 1.6, source: "Rahu - Ambition" },
    { type: "holland_code", value: "I", weight: 1.4, source: "Rahu - Research" },
    { type: "skill", value: "innovation", weight: 1.8, source: "Rahu - Unconventional" },
    { type: "skill", value: "networking", weight: 1.6, source: "Rahu - Connections" },
    { type: "work_value", value: "status", weight: 1.8, source: "Rahu - Material" },
    { type: "industry", value: "technology", weight: 2, source: "Rahu - Modern" },
    { type: "industry", value: "foreign", weight: 1.8, source: "Rahu - Foreign" },
    { type: "industry", value: "research", weight: 1.6, source: "Rahu - Discovery" },
    { type: "industry", value: "aviation", weight: 1.4, source: "Rahu - Sky" },
    { type: "work_style", value: "unconventional", weight: 1.8, source: "Rahu - Breaking norms" }
  ],
  "Ketu": [
    { type: "holland_code", value: "I", weight: 1.6, source: "Ketu - Research" },
    { type: "skill", value: "intuition", weight: 1.8, source: "Ketu - Insight" },
    { type: "skill", value: "spiritual", weight: 2, source: "Ketu - Moksha" },
    { type: "skill", value: "programming", weight: 1.4, source: "Ketu - Abstract" },
    { type: "industry", value: "spirituality", weight: 1.8, source: "Ketu - Liberation" },
    { type: "industry", value: "healing", weight: 1.6, source: "Ketu - Alternative" },
    { type: "industry", value: "research", weight: 1.6, source: "Ketu - Deep study" },
    { type: "industry", value: "occult", weight: 1.4, source: "Ketu - Hidden" },
    { type: "work_style", value: "independent", weight: 1.6, source: "Ketu - Detachment" }
  ],
  "Uranus": [
    { type: "holland_code", value: "I", weight: 1.8, source: "Uranus - Innovation" },
    { type: "skill", value: "innovation", weight: 2, source: "Uranus - Disruption" },
    { type: "skill", value: "technical", weight: 1.6, source: "Uranus - Tech" },
    { type: "industry", value: "technology", weight: 2, source: "Uranus - Electricity" },
    { type: "industry", value: "aviation", weight: 1.6, source: "Uranus - Sky" },
    { type: "industry", value: "science", weight: 1.8, source: "Uranus - Discovery" },
    { type: "work_style", value: "unconventional", weight: 1.8, source: "Uranus - Rebellion" }
  ],
  "Neptune": [
    { type: "holland_code", value: "A", weight: 1.8, source: "Neptune - Imagination" },
    { type: "skill", value: "creativity", weight: 2, source: "Neptune - Dreams" },
    { type: "skill", value: "intuition", weight: 1.8, source: "Neptune - Mystic" },
    { type: "industry", value: "entertainment", weight: 1.8, source: "Neptune - Film" },
    { type: "industry", value: "healing", weight: 1.6, source: "Neptune - Compassion" },
    { type: "industry", value: "oil_gas", weight: 1.4, source: "Neptune - Liquids" },
    { type: "work_style", value: "creative", weight: 1.6, source: "Neptune - Flow" }
  ],
  "Pluto": [
    { type: "holland_code", value: "I", weight: 1.8, source: "Pluto - Depth" },
    { type: "skill", value: "research", weight: 2, source: "Pluto - Investigation" },
    { type: "skill", value: "crisis_management", weight: 1.8, source: "Pluto - Transformation" },
    { type: "industry", value: "mining", weight: 1.6, source: "Pluto - Underground" },
    { type: "industry", value: "research", weight: 1.8, source: "Pluto - Hidden" },
    { type: "industry", value: "psychology", weight: 1.6, source: "Pluto - Subconscious" },
    { type: "work_style", value: "intense", weight: 1.6, source: "Pluto - Intensity" }
  ]
};
var HOUSE_CAREER_ATTRIBUTES = {
  1: [
    { type: "work_style", value: "independent", weight: 1.5, source: "1st House - Self" },
    { type: "work_value", value: "autonomy", weight: 1.4, source: "1st House - Identity" },
    { type: "skill", value: "self_promotion", weight: 1.2, source: "1st House - Personality" }
  ],
  2: [
    { type: "industry", value: "finance", weight: 1.6, source: "2nd House - Wealth" },
    { type: "industry", value: "banking", weight: 1.4, source: "2nd House - Money" },
    { type: "skill", value: "financial", weight: 1.5, source: "2nd House - Resources" },
    { type: "industry", value: "food", weight: 1.3, source: "2nd House - Sustenance" }
  ],
  3: [
    { type: "skill", value: "communication", weight: 1.6, source: "3rd House - Communication" },
    { type: "industry", value: "media", weight: 1.5, source: "3rd House - Writing" },
    { type: "industry", value: "marketing", weight: 1.4, source: "3rd House - Promotion" },
    { type: "skill", value: "writing", weight: 1.4, source: "3rd House - Expression" }
  ],
  4: [
    { type: "industry", value: "real_estate", weight: 1.6, source: "4th House - Property" },
    { type: "work_value", value: "security", weight: 1.5, source: "4th House - Home" },
    { type: "industry", value: "agriculture", weight: 1.3, source: "4th House - Land" },
    { type: "industry", value: "automotive", weight: 1.2, source: "4th House - Vehicles" }
  ],
  5: [
    { type: "holland_code", value: "A", weight: 1.5, source: "5th House - Creativity" },
    { type: "industry", value: "entertainment", weight: 1.6, source: "5th House - Performance" },
    { type: "industry", value: "education", weight: 1.4, source: "5th House - Teaching" },
    { type: "industry", value: "sports", weight: 1.3, source: "5th House - Games" },
    { type: "industry", value: "investing", weight: 1.4, source: "5th House - Speculation" }
  ],
  6: [
    { type: "work_style", value: "service", weight: 1.5, source: "6th House - Service" },
    { type: "industry", value: "healthcare", weight: 1.5, source: "6th House - Healing" },
    { type: "industry", value: "legal", weight: 1.3, source: "6th House - Disputes" },
    { type: "skill", value: "problem_solving", weight: 1.4, source: "6th House - Obstacles" }
  ],
  7: [
    { type: "work_style", value: "partnership", weight: 1.6, source: "7th House - Partnership" },
    { type: "industry", value: "consulting", weight: 1.5, source: "7th House - Clients" },
    { type: "industry", value: "law", weight: 1.4, source: "7th House - Contracts" },
    { type: "skill", value: "negotiation", weight: 1.5, source: "7th House - Agreements" }
  ],
  8: [
    { type: "industry", value: "insurance", weight: 1.5, source: "8th House - Other's money" },
    { type: "industry", value: "research", weight: 1.6, source: "8th House - Investigation" },
    { type: "industry", value: "occult", weight: 1.4, source: "8th House - Hidden" },
    { type: "skill", value: "research", weight: 1.5, source: "8th House - Deep study" },
    { type: "industry", value: "psychology", weight: 1.4, source: "8th House - Transformation" }
  ],
  9: [
    { type: "industry", value: "education", weight: 1.6, source: "9th House - Higher learning" },
    { type: "industry", value: "law", weight: 1.5, source: "9th House - Philosophy" },
    { type: "industry", value: "foreign", weight: 1.6, source: "9th House - Long distance" },
    { type: "industry", value: "publishing", weight: 1.4, source: "9th House - Knowledge" },
    { type: "industry", value: "spirituality", weight: 1.3, source: "9th House - Dharma" }
  ],
  10: [
    { type: "work_value", value: "recognition", weight: 1.8, source: "10th House - Career" },
    { type: "skill", value: "leadership", weight: 1.6, source: "10th House - Authority" },
    { type: "work_style", value: "ambitious", weight: 1.6, source: "10th House - Status" },
    { type: "industry", value: "government", weight: 1.4, source: "10th House - Public" }
  ],
  11: [
    { type: "work_style", value: "networking", weight: 1.6, source: "11th House - Networks" },
    { type: "industry", value: "technology", weight: 1.5, source: "11th House - Innovation" },
    { type: "work_value", value: "income", weight: 1.6, source: "11th House - Gains" },
    { type: "industry", value: "social_media", weight: 1.4, source: "11th House - Groups" }
  ],
  12: [
    { type: "industry", value: "spirituality", weight: 1.5, source: "12th House - Moksha" },
    { type: "industry", value: "foreign", weight: 1.6, source: "12th House - Foreign lands" },
    { type: "industry", value: "healthcare", weight: 1.4, source: "12th House - Hospitals" },
    { type: "industry", value: "charity", weight: 1.3, source: "12th House - Service" },
    { type: "work_style", value: "behind_scenes", weight: 1.4, source: "12th House - Hidden work" }
  ]
};
var OCCUPATIONS = [
  // Technology
  { id: 1, title: "Software Engineer", category: "Technology", hollandCodes: { I: 80, R: 60, C: 50 }, skills: ["analytical", "technical", "programming"], primaryPlanets: ["Mercury", "Rahu", "Ketu"] },
  { id: 2, title: "Data Scientist", category: "Technology", hollandCodes: { I: 90, C: 70, R: 40 }, skills: ["analytical", "research", "technical"], primaryPlanets: ["Mercury", "Ketu", "Saturn"] },
  { id: 3, title: "UX Designer", category: "Technology", hollandCodes: { A: 80, I: 60, S: 50 }, skills: ["creativity", "design", "communication"], primaryPlanets: ["Venus", "Mercury", "Moon"] },
  { id: 4, title: "Product Manager", category: "Technology", hollandCodes: { E: 80, I: 60, S: 50 }, skills: ["leadership", "communication", "analytical"], primaryPlanets: ["Sun", "Mercury", "Jupiter"] },
  { id: 5, title: "Cybersecurity Analyst", category: "Technology", hollandCodes: { I: 85, C: 70, R: 45 }, skills: ["analytical", "technical", "research"], primaryPlanets: ["Mars", "Ketu", "Saturn"] },
  // Business
  { id: 6, title: "Marketing Manager", category: "Business", hollandCodes: { E: 80, A: 60, S: 50 }, skills: ["communication", "creativity", "leadership"], primaryPlanets: ["Mercury", "Venus", "Sun"] },
  { id: 7, title: "Financial Analyst", category: "Business", hollandCodes: { C: 85, I: 70, E: 40 }, skills: ["analytical", "financial", "research"], primaryPlanets: ["Mercury", "Saturn", "Jupiter"] },
  { id: 8, title: "Management Consultant", category: "Business", hollandCodes: { E: 85, I: 65, S: 50 }, skills: ["advisory", "analytical", "communication"], primaryPlanets: ["Jupiter", "Mercury", "Sun"] },
  { id: 9, title: "Entrepreneur", category: "Business", hollandCodes: { E: 90, R: 50, I: 45 }, skills: ["leadership", "innovation", "financial"], primaryPlanets: ["Sun", "Mars", "Rahu"] },
  { id: 10, title: "Investment Banker", category: "Business", hollandCodes: { E: 85, C: 75, I: 55 }, skills: ["financial", "analytical", "negotiation"], primaryPlanets: ["Jupiter", "Mercury", "Saturn"] },
  // Healthcare
  { id: 11, title: "Doctor/Physician", category: "Healthcare", hollandCodes: { I: 85, S: 75, R: 45 }, skills: ["analytical", "emotional_intelligence", "research"], primaryPlanets: ["Sun", "Moon", "Mars"] },
  { id: 12, title: "Nurse", category: "Healthcare", hollandCodes: { S: 90, R: 50, C: 45 }, skills: ["emotional_intelligence", "physical", "communication"], primaryPlanets: ["Moon", "Venus", "Mars"] },
  { id: 13, title: "Psychologist", category: "Healthcare", hollandCodes: { S: 85, I: 75, A: 40 }, skills: ["emotional_intelligence", "research", "communication"], primaryPlanets: ["Moon", "Ketu", "Mercury"] },
  { id: 14, title: "Pharmacist", category: "Healthcare", hollandCodes: { I: 75, C: 70, S: 55 }, skills: ["analytical", "research", "communication"], primaryPlanets: ["Mercury", "Moon", "Saturn"] },
  // Creative
  { id: 15, title: "Graphic Designer", category: "Creative", hollandCodes: { A: 90, R: 50, I: 40 }, skills: ["creativity", "design", "technical"], primaryPlanets: ["Venus", "Mercury", "Moon"] },
  { id: 16, title: "Content Writer", category: "Creative", hollandCodes: { A: 75, I: 65, S: 45 }, skills: ["writing", "creativity", "communication"], primaryPlanets: ["Mercury", "Venus", "Moon"] },
  { id: 17, title: "Film Director", category: "Creative", hollandCodes: { A: 85, E: 70, S: 50 }, skills: ["creativity", "leadership", "communication"], primaryPlanets: ["Venus", "Sun", "Rahu"] },
  { id: 18, title: "Musician", category: "Creative", hollandCodes: { A: 95, S: 45, E: 40 }, skills: ["creativity", "intuition", "discipline"], primaryPlanets: ["Venus", "Moon", "Mercury"] },
  // Education
  { id: 19, title: "Professor", category: "Education", hollandCodes: { I: 85, S: 70, A: 45 }, skills: ["teaching", "research", "communication"], primaryPlanets: ["Jupiter", "Mercury", "Sun"] },
  { id: 20, title: "School Teacher", category: "Education", hollandCodes: { S: 85, A: 55, I: 50 }, skills: ["teaching", "emotional_intelligence", "communication"], primaryPlanets: ["Jupiter", "Moon", "Mercury"] },
  { id: 21, title: "Corporate Trainer", category: "Education", hollandCodes: { S: 75, E: 70, I: 50 }, skills: ["teaching", "communication", "leadership"], primaryPlanets: ["Jupiter", "Sun", "Mercury"] },
  // Legal
  { id: 22, title: "Lawyer", category: "Legal", hollandCodes: { E: 80, I: 70, S: 50 }, skills: ["communication", "analytical", "negotiation"], primaryPlanets: ["Jupiter", "Mars", "Mercury"] },
  { id: 23, title: "Judge", category: "Legal", hollandCodes: { I: 80, E: 65, C: 60 }, skills: ["analytical", "leadership", "discipline"], primaryPlanets: ["Jupiter", "Sun", "Saturn"] },
  // Government
  { id: 24, title: "Civil Servant", category: "Government", hollandCodes: { C: 75, S: 65, E: 50 }, skills: ["management", "communication", "discipline"], primaryPlanets: ["Saturn", "Sun", "Moon"] },
  { id: 25, title: "Diplomat", category: "Government", hollandCodes: { E: 80, S: 70, I: 50 }, skills: ["communication", "negotiation", "leadership"], primaryPlanets: ["Venus", "Jupiter", "Mercury"] },
  // Engineering
  { id: 26, title: "Mechanical Engineer", category: "Engineering", hollandCodes: { R: 85, I: 75, C: 50 }, skills: ["technical", "analytical", "problem_solving"], primaryPlanets: ["Mars", "Mercury", "Saturn"] },
  { id: 27, title: "Civil Engineer", category: "Engineering", hollandCodes: { R: 80, I: 70, C: 55 }, skills: ["technical", "management", "analytical"], primaryPlanets: ["Mars", "Saturn", "Mercury"] },
  { id: 28, title: "Architect", category: "Engineering", hollandCodes: { A: 75, R: 70, I: 60 }, skills: ["creativity", "design", "technical"], primaryPlanets: ["Venus", "Mars", "Mercury"] },
  // Finance
  { id: 29, title: "Accountant", category: "Finance", hollandCodes: { C: 90, I: 55, E: 35 }, skills: ["financial", "analytical", "discipline"], primaryPlanets: ["Saturn", "Mercury", "Jupiter"] },
  { id: 30, title: "Stock Trader", category: "Finance", hollandCodes: { E: 80, I: 70, C: 55 }, skills: ["analytical", "financial", "innovation"], primaryPlanets: ["Mercury", "Rahu", "Mars"] }
];
var INCOME_STREAMS = [
  // Active Income
  { id: 1, name: "Freelance Consulting", category: "active", riskLevel: "medium", favorablePlanets: ["Jupiter", "Mercury", "Sun"], favorableHouses: [7, 10, 11], requiredSkills: ["advisory", "communication"], description: "Offer expertise to clients on project basis" },
  { id: 2, name: "Online Coaching", category: "active", riskLevel: "low", favorablePlanets: ["Jupiter", "Moon", "Mercury"], favorableHouses: [5, 9, 11], requiredSkills: ["teaching", "communication"], description: "Teach skills through online sessions" },
  { id: 3, name: "E-commerce Business", category: "active", riskLevel: "medium", favorablePlanets: ["Mercury", "Venus", "Rahu"], favorableHouses: [2, 7, 11], requiredSkills: ["financial", "communication", "innovation"], description: "Sell products through online platforms" },
  { id: 4, name: "Content Creation", category: "active", riskLevel: "medium", favorablePlanets: ["Venus", "Mercury", "Moon"], favorableHouses: [3, 5, 11], requiredSkills: ["creativity", "communication", "writing"], description: "Create videos, blogs, or social media content" },
  { id: 5, name: "Professional Services", category: "active", riskLevel: "low", favorablePlanets: ["Saturn", "Jupiter", "Mercury"], favorableHouses: [6, 10, 11], requiredSkills: ["technical", "discipline", "management"], description: "Offer specialized professional services" },
  // Passive Income
  { id: 6, name: "Dividend Investing", category: "passive", riskLevel: "low", favorablePlanets: ["Jupiter", "Saturn", "Venus"], favorableHouses: [2, 5, 11], requiredSkills: ["financial", "analytical"], description: "Earn from stock dividends" },
  { id: 7, name: "Rental Income", category: "passive", riskLevel: "low", favorablePlanets: ["Saturn", "Mars", "Venus"], favorableHouses: [4, 2, 11], requiredSkills: ["financial", "management"], description: "Income from property rentals" },
  { id: 8, name: "Digital Products", category: "passive", riskLevel: "medium", favorablePlanets: ["Mercury", "Rahu", "Venus"], favorableHouses: [3, 5, 11], requiredSkills: ["creativity", "technical", "writing"], description: "Sell courses, ebooks, templates" },
  { id: 9, name: "Royalties", category: "passive", riskLevel: "medium", favorablePlanets: ["Venus", "Mercury", "Jupiter"], favorableHouses: [5, 9, 11], requiredSkills: ["creativity", "writing"], description: "Earn from intellectual property" },
  { id: 10, name: "Long-term Investments", category: "passive", riskLevel: "medium", favorablePlanets: ["Saturn", "Jupiter", "Ketu"], favorableHouses: [8, 11, 12], requiredSkills: ["financial", "analytical", "discipline"], description: "Growth through index funds, bonds" },
  // Hybrid Income
  { id: 11, name: "Affiliate Marketing", category: "hybrid", riskLevel: "low", favorablePlanets: ["Mercury", "Rahu", "Venus"], favorableHouses: [3, 7, 11], requiredSkills: ["communication", "networking", "writing"], description: "Earn commissions promoting products" },
  { id: 12, name: "Spiritual Services", category: "hybrid", riskLevel: "low", favorablePlanets: ["Ketu", "Jupiter", "Moon"], favorableHouses: [9, 12, 5], requiredSkills: ["spiritual", "intuition", "teaching"], description: "Astrology, healing, counseling" },
  { id: 13, name: "Research & Analysis", category: "hybrid", riskLevel: "low", favorablePlanets: ["Ketu", "Mercury", "Saturn"], favorableHouses: [8, 9, 11], requiredSkills: ["research", "analytical", "writing"], description: "Market research, data analysis" },
  { id: 14, name: "App/Software Development", category: "hybrid", riskLevel: "high", favorablePlanets: ["Mercury", "Rahu", "Ketu"], favorableHouses: [3, 5, 11], requiredSkills: ["technical", "innovation", "analytical"], description: "Build and monetize applications" },
  { id: 15, name: "Trading & Speculation", category: "hybrid", riskLevel: "high", favorablePlanets: ["Mercury", "Rahu", "Mars"], favorableHouses: [5, 8, 11], requiredSkills: ["analytical", "financial", "innovation"], description: "Active trading in markets" }
];
function generateCareerProfile(chartData) {
  const profile = {
    hollandCodes: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
    skills: {},
    workValues: {},
    industries: {},
    workStyles: {},
    dominantPlanets: [],
    strongHouses: [],
    logicTrace: {}
  };
  const { d1, d10, d9, yogas: yogas2 } = chartData;
  const planetStrengths = {};
  for (const planet of d1.planets) {
    const strength = calculatePlanetStrength(planet, d1);
    planetStrengths[planet.planet] = strength;
    const conditions = getPlanetConditions(planet, d1, d10, d9);
    processPlanetalInfluence(planet, profile, strength, conditions);
  }
  if (d10) {
    for (const planet of d10.planets) {
      if (["Uranus", "Neptune", "Pluto"].includes(planet.planet)) continue;
      const d10Strength = calculateVargaPlanetStrength(planet, d10);
      const d10Conditions = [];
      if (d10Strength > 1.2) d10Conditions.push(`${planet.planet} strong in D10`);
      processPlanetalInfluence(planet, profile, d10Strength * 1.5, d10Conditions);
    }
  }
  for (const planet of d1.planets) {
    const houseAttrs = HOUSE_CAREER_ATTRIBUTES[planet.house];
    if (houseAttrs) {
      const strength = planetStrengths[planet.planet] || 1;
      const conditions = [`${planet.planet} in ${planet.house}th House`];
      for (const attr of houseAttrs) {
        addAttribute(profile, attr, strength, conditions);
      }
    }
  }
  const tenthHouseLord = d1.houses[9]?.lord;
  if (tenthHouseLord) {
    const lordPlanet = d1.planets.find((p) => p.planet === tenthHouseLord);
    if (lordPlanet) {
      const strength = planetStrengths[tenthHouseLord] || 1;
      processPlanetalInfluence(lordPlanet, profile, strength * 2, [`10th Lord (${tenthHouseLord})`]);
    }
  }
  const secondHouseLord = d1.houses[1]?.lord;
  if (secondHouseLord) {
    const lordPlanet = d1.planets.find((p) => p.planet === secondHouseLord);
    if (lordPlanet) {
      const strength = planetStrengths[secondHouseLord] || 1;
      processPlanetalInfluence(lordPlanet, profile, strength * 1.3, [`2nd Lord (${secondHouseLord})`]);
    }
  }
  const eleventhHouseLord = d1.houses[10]?.lord;
  if (eleventhHouseLord) {
    const lordPlanet = d1.planets.find((p) => p.planet === eleventhHouseLord);
    if (lordPlanet) {
      const strength = planetStrengths[eleventhHouseLord] || 1;
      processPlanetalInfluence(lordPlanet, profile, strength * 1.3, [`11th Lord (${eleventhHouseLord})`]);
    }
  }
  for (const yoga of yogas2) {
    const boost = yoga.strength === "strong" ? 2 : yoga.strength === "moderate" ? 1.5 : 1;
    const yogaCondition = [yoga.name];
    if (yoga.name.includes("Raja")) {
      profile.hollandCodes["E"] += boost * 10;
      profile.workValues["recognition"] = (profile.workValues["recognition"] || 0) + boost * 10;
      addAttribute(profile, { type: "holland_code", value: "E", weight: 1, source: "Yoga" }, boost * 10, yogaCondition);
    }
    if (yoga.name.includes("Dhana") || yoga.name.includes("Vasumati") || yoga.name.includes("Lakshmi")) {
      profile.industries["finance"] = (profile.industries["finance"] || 0) + boost * 10;
      profile.workValues["income"] = (profile.workValues["income"] || 0) + boost * 10;
      addAttribute(profile, { type: "industry", value: "finance", weight: 1, source: "Yoga" }, boost * 10, yogaCondition);
    }
    if (yoga.name.includes("Saraswati")) {
      profile.hollandCodes["A"] += boost * 10;
      profile.industries["education"] = (profile.industries["education"] || 0) + boost * 10;
      addAttribute(profile, { type: "holland_code", value: "A", weight: 1, source: "Yoga" }, boost * 10, yogaCondition);
    }
    if (yoga.name.includes("Budhaditya")) {
      profile.hollandCodes["I"] += boost * 8;
      profile.skills["communication"] = (profile.skills["communication"] || 0) + boost * 10;
      addAttribute(profile, { type: "skill", value: "communication", weight: 1, source: "Yoga" }, boost * 10, yogaCondition);
    }
    if (yoga.name.includes("Gaja Kesari")) {
      profile.hollandCodes["S"] += boost * 8;
      profile.skills["teaching"] = (profile.skills["teaching"] || 0) + boost * 10;
      addAttribute(profile, { type: "skill", value: "teaching", weight: 1, source: "Yoga" }, boost * 10, yogaCondition);
    }
  }
  const sortedPlanets = Object.entries(planetStrengths).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([planet]) => planet);
  profile.dominantPlanets = sortedPlanets;
  const strongHouses = [];
  for (const planet of d1.planets) {
    if (planetStrengths[planet.planet] > 1.2) {
      if (!strongHouses.includes(planet.house)) {
        strongHouses.push(planet.house);
      }
    }
  }
  profile.strongHouses = strongHouses.sort((a, b) => a - b);
  normalizeProfile(profile);
  return profile;
}
function calculatePlanetStrength(planet, chart) {
  let strength = 1;
  const exaltations = {
    "Sun": "Aries",
    "Moon": "Taurus",
    "Mars": "Capricorn",
    "Mercury": "Virgo",
    "Jupiter": "Cancer",
    "Venus": "Pisces",
    "Saturn": "Libra",
    "Rahu": "Taurus",
    "Ketu": "Scorpio"
  };
  const debilitations = {
    "Sun": "Libra",
    "Moon": "Scorpio",
    "Mars": "Cancer",
    "Mercury": "Pisces",
    "Jupiter": "Capricorn",
    "Venus": "Virgo",
    "Saturn": "Aries",
    "Rahu": "Scorpio",
    "Ketu": "Taurus"
  };
  if (exaltations[planet.planet] === planet.sign) {
    strength *= 1.8;
  } else if (debilitations[planet.planet] === planet.sign) {
    strength *= 0.4;
  }
  const ownSigns = {
    "Sun": ["Leo"],
    "Moon": ["Cancer"],
    "Mars": ["Aries", "Scorpio"],
    "Mercury": ["Gemini", "Virgo"],
    "Jupiter": ["Sagittarius", "Pisces"],
    "Venus": ["Taurus", "Libra"],
    "Saturn": ["Capricorn", "Aquarius"],
    "Rahu": ["Aquarius"],
    "Ketu": ["Scorpio"]
  };
  if (ownSigns[planet.planet]?.includes(planet.sign)) {
    strength *= 1.5;
  }
  const moolatrikona = {
    "Sun": { sign: "Leo", start: 0, end: 20 },
    "Moon": { sign: "Taurus", start: 4, end: 30 },
    "Mars": { sign: "Aries", start: 0, end: 12 },
    "Mercury": { sign: "Virgo", start: 16, end: 20 },
    "Jupiter": { sign: "Sagittarius", start: 0, end: 10 },
    "Venus": { sign: "Libra", start: 0, end: 15 },
    "Saturn": { sign: "Aquarius", start: 0, end: 20 }
  };
  const mt = moolatrikona[planet.planet];
  if (mt && planet.sign === mt.sign && planet.degree >= mt.start && planet.degree <= mt.end) {
    strength *= 1.4;
  }
  if ([1, 4, 7, 10].includes(planet.house)) {
    strength *= 1.3;
  }
  if ([5, 9].includes(planet.house)) {
    strength *= 1.2;
  }
  if ([6, 8, 12].includes(planet.house)) {
    strength *= 0.8;
  }
  if (planet.isRetrograde && !["Rahu", "Ketu"].includes(planet.planet)) {
    strength *= 0.85;
  }
  if (planet.degree < 1 || planet.degree > 29) {
    strength *= 0.9;
  }
  return strength;
}
function calculateVargaPlanetStrength(planet, varga) {
  let strength = 1;
  const ownSigns = {
    "Sun": ["Leo"],
    "Moon": ["Cancer"],
    "Mars": ["Aries", "Scorpio"],
    "Mercury": ["Gemini", "Virgo"],
    "Jupiter": ["Sagittarius", "Pisces"],
    "Venus": ["Taurus", "Libra"],
    "Saturn": ["Capricorn", "Aquarius"]
  };
  if (ownSigns[planet.planet]?.includes(planet.sign)) {
    strength *= 1.4;
  }
  if ([1, 4, 7, 10].includes(planet.house)) {
    strength *= 1.2;
  }
  return strength;
}
function processPlanetalInfluence(planet, profile, strength, conditions = []) {
  const attrs = PLANET_CAREER_ATTRIBUTES[planet.planet];
  if (!attrs) return;
  for (const attr of attrs) {
    addAttribute(profile, attr, strength, conditions);
  }
}
function addAttribute(profile, attr, strength, conditions = []) {
  const score = attr.weight * strength;
  const traceKey = `${attr.type}:${attr.value}`;
  if (!profile.logicTrace) {
    profile.logicTrace = {};
  }
  if (!profile.logicTrace[traceKey]) {
    profile.logicTrace[traceKey] = [];
  }
  if (strength > 1.2 && conditions.length > 0) {
    for (const condition of conditions) {
      if (!profile.logicTrace[traceKey].includes(condition)) {
        profile.logicTrace[traceKey].push(condition);
      }
    }
  }
  switch (attr.type) {
    case "holland_code":
      profile.hollandCodes[attr.value] = (profile.hollandCodes[attr.value] || 0) + score;
      break;
    case "skill":
      profile.skills[attr.value] = (profile.skills[attr.value] || 0) + score;
      break;
    case "work_value":
      profile.workValues[attr.value] = (profile.workValues[attr.value] || 0) + score;
      break;
    case "industry":
      profile.industries[attr.value] = (profile.industries[attr.value] || 0) + score;
      break;
    case "work_style":
      profile.workStyles[attr.value] = (profile.workStyles[attr.value] || 0) + score;
      break;
  }
}
function getPlanetConditions(planet, chart, d10, d9) {
  const conditions = [];
  const pName = planet.planet;
  const ownSigns = {
    "Sun": ["Leo"],
    "Moon": ["Cancer"],
    "Mars": ["Aries", "Scorpio"],
    "Mercury": ["Gemini", "Virgo"],
    "Jupiter": ["Sagittarius", "Pisces"],
    "Venus": ["Taurus", "Libra"],
    "Saturn": ["Capricorn", "Aquarius"],
    "Rahu": ["Aquarius"],
    "Ketu": ["Scorpio"],
    "Uranus": ["Aquarius"],
    "Neptune": ["Pisces"],
    "Pluto": ["Scorpio"]
  };
  const exaltations = {
    "Sun": "Aries",
    "Moon": "Taurus",
    "Mars": "Capricorn",
    "Mercury": "Virgo",
    "Jupiter": "Cancer",
    "Venus": "Pisces",
    "Saturn": "Libra",
    "Rahu": "Taurus",
    "Ketu": "Scorpio",
    "Uranus": "Scorpio",
    "Neptune": "Leo",
    "Pluto": "Aries"
  };
  if (exaltations[pName] === planet.sign) {
    conditions.push(`${pName} Exalted in ${planet.sign}`);
  } else if (ownSigns[pName]?.includes(planet.sign)) {
    conditions.push(`${pName} in Own Sign (${planet.sign})`);
  } else {
  }
  if ([1, 4, 7, 10].includes(planet.house)) {
    conditions.push(`${pName} in ${planet.house}th House (Kendra)`);
  } else if ([5, 9].includes(planet.house)) {
    conditions.push(`${pName} in ${planet.house}th House (Trikona)`);
  } else if (planet.house === 2 || planet.house === 11) {
    conditions.push(`${pName} in ${planet.house}th House (Wealth)`);
  }
  const digbala = {
    "Sun": 10,
    "Mars": 10,
    "Moon": 4,
    "Venus": 4,
    "Jupiter": 1,
    "Mercury": 1,
    "Saturn": 7
  };
  if (digbala[pName] === planet.house) {
    conditions.push(`${pName} has Digbala`);
  }
  if (d9) {
    const d9Planet = d9.planets.find((p) => p.planet === pName);
    if (d9Planet && d9Planet.sign === planet.sign) {
      conditions.push(`${pName} Vargottama (Strength)`);
    } else if (d9Planet && ownSigns[pName]?.includes(d9Planet.sign)) {
      conditions.push(`${pName} in Own Sign in D9`);
    } else if (d9Planet && exaltations[pName] === d9Planet.sign) {
      conditions.push(`${pName} Exalted in D9`);
    }
  }
  if (d10) {
    const d10Planet = d10.planets.find((p) => p.planet === pName);
    if (d10Planet) {
      if ([1, 10].includes(d10Planet.house)) {
        conditions.push(`${pName} strong in D10 (Dasamsa)`);
      } else if (ownSigns[pName]?.includes(d10Planet.sign)) {
        conditions.push(`${pName} own sign in D10`);
      }
    }
  }
  return conditions;
}
function normalizeProfile(profile) {
  const normalizeWithVariance = (obj) => {
    const values = Object.values(obj);
    if (values.length === 0) return;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    for (const key of Object.keys(obj)) {
      const normalized = (obj[key] - min) / range * 70 + 15;
      obj[key] = Math.round(normalized);
    }
  };
  normalizeWithVariance(profile.hollandCodes);
  normalizeWithVariance(profile.skills);
  normalizeWithVariance(profile.workValues);
  normalizeWithVariance(profile.industries);
  normalizeWithVariance(profile.workStyles);
  normalizeWithVariance(profile.workValues);
  normalizeWithVariance(profile.industries);
  normalizeWithVariance(profile.workStyles);
}
function getTopCareerMatches(profile, limit = 10) {
  const matches = [];
  for (const occupation of OCCUPATIONS) {
    let score = 0;
    const reasons = [];
    const planetarySupport = [];
    const astroLogicSet = /* @__PURE__ */ new Set();
    let hollandScore = 0;
    let hollandMatches = 0;
    for (const [code, value] of Object.entries(occupation.hollandCodes)) {
      const profileValue = profile.hollandCodes[code] || 0;
      const matchContribution = Math.min(profileValue, value) / Math.max(value, 1) * (value / 100);
      hollandScore += matchContribution;
      hollandMatches++;
      if (profileValue > 60 && value > 60) {
        const hollandNames = {
          R: "Realistic",
          I: "Investigative",
          A: "Artistic",
          S: "Social",
          E: "Enterprising",
          C: "Conventional"
        };
        reasons.push(`Strong ${hollandNames[code]} aptitude`);
        const traces = profile.logicTrace?.[`holland_code:${code}`];
        if (traces) {
          traces.forEach((t2) => astroLogicSet.add(t2));
        }
      }
    }
    score += hollandScore / Math.max(hollandMatches, 1) * 40;
    let skillScore = 0;
    for (const skill of occupation.skills) {
      const profileValue = profile.skills[skill.toLowerCase()] || profile.skills[skill] || 0;
      if (profileValue > 50) {
        skillScore += profileValue / 100;
        reasons.push(`${skill.charAt(0).toUpperCase() + skill.slice(1)} skills indicated`);
        const traces = profile.logicTrace?.[`skill:${skill.toLowerCase()}`];
        if (traces) {
          traces.forEach((t2) => astroLogicSet.add(t2));
        }
      } else if (profileValue > 30) {
        skillScore += profileValue / 100 * 0.5;
      }
    }
    score += skillScore / Math.max(occupation.skills.length, 1) * 25;
    const categoryLower = occupation.category.toLowerCase();
    let industryScore = 0;
    for (const [industry, value] of Object.entries(profile.industries)) {
      if (categoryLower.includes(industry) || industry.includes(categoryLower.split(" ")[0])) {
        industryScore = Math.max(industryScore, value);
        reasons.push(`${occupation.category} industry alignment`);
      }
    }
    score += industryScore / 100 * 20;
    let planetScore = 0;
    for (const planet of occupation.primaryPlanets) {
      if (profile.dominantPlanets.includes(planet)) {
        planetarySupport.push(planet);
        planetScore += 1;
      }
    }
    score += planetScore / Math.max(occupation.primaryPlanets.length, 1) * 15;
    const varianceFactor = 0.9 + Math.random() * 0.2;
    score *= varianceFactor;
    const finalScore = Math.max(30, Math.min(95, Math.round(score)));
    matches.push({
      occupationId: occupation.id,
      title: occupation.title,
      category: occupation.category,
      matchScore: finalScore,
      matchReasons: Array.from(new Set(reasons)).slice(0, 4),
      planetarySupport,
      astroLogic: Array.from(astroLogicSet).slice(0, 5)
    });
  }
  return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}
function getIncomeStreamRecommendations(profile, chartData, limit = 10) {
  const matches = [];
  const { d1 } = chartData;
  for (const stream of INCOME_STREAMS) {
    let score = 0;
    const reasons = [];
    const planetarySupport = [];
    const astroLogicSet = /* @__PURE__ */ new Set();
    let planetScore = 0;
    for (const planet of stream.favorablePlanets) {
      if (profile.dominantPlanets.includes(planet)) {
        planetarySupport.push(planet);
        planetScore += 2;
        reasons.push(`Supported by ${planet}`);
        const traces = profile.logicTrace?.[`skill:${stream.requiredSkills[0]}`] || [];
        if (traces.length > 0) {
          traces.forEach((t2) => astroLogicSet.add(t2));
        } else {
          const planetPos = d1.planets.find((p) => p.planet === planet);
          if (planetPos) {
            if ([1, 4, 7, 10].includes(planetPos.house)) astroLogicSet.add(`${planet} in Kendra (Strength)`);
            if ([2, 11].includes(planetPos.house)) astroLogicSet.add(`${planet} in Wealth House (${planetPos.house}th)`);
          }
        }
      } else {
        const planetPos = d1.planets.find((p) => p.planet === planet);
        if (planetPos && [1, 4, 5, 7, 9, 10, 11].includes(planetPos.house)) {
          planetarySupport.push(planet);
          planetScore += 1;
          if ([2, 11].includes(planetPos.house)) {
            astroLogicSet.add(`${planet} in ${planetPos.house}th House (Wealth)`);
          } else if ([1, 4, 7, 10].includes(planetPos.house)) {
            astroLogicSet.add(`${planet} in Kendra (Action)`);
          } else if (planetPos.house === 5 || planetPos.house === 9) {
            astroLogicSet.add(`${planet} in Trikona (Fortune)`);
          }
        }
      }
    }
    if (chartData.d2) {
      for (const planet of stream.favorablePlanets) {
        const d2Planet = chartData.d2.planets.find((p) => p.planet === planet);
        if (d2Planet) {
          if ([2, 11].includes(d2Planet.house)) {
            planetScore += 0.5;
            astroLogicSet.add(`${planet} strong in D2 (Wealth Chart)`);
          }
        }
      }
    }
    if (chartData.d10) {
      for (const planet of stream.favorablePlanets) {
        const d10Planet = chartData.d10.planets.find((p) => p.planet === planet);
        if (d10Planet && [1, 10].includes(d10Planet.house)) {
          planetScore += 0.5;
          astroLogicSet.add(`${planet} strong in D10 (Career Action)`);
        }
      }
    }
    score += planetScore / (stream.favorablePlanets.length * 2 + 1) * 35;
    let houseScore = 0;
    for (const house of stream.favorableHouses) {
      if (profile.strongHouses.includes(house)) {
        houseScore += 1;
        reasons.push(`Strong ${house}th house`);
      }
    }
    score += houseScore / stream.favorableHouses.length * 25;
    let skillScore = 0;
    for (const skill of stream.requiredSkills) {
      const profileValue = profile.skills[skill] || 0;
      if (profileValue > 50) {
        skillScore += profileValue / 100;
        reasons.push(`${skill.charAt(0).toUpperCase() + skill.slice(1)} aptitude`);
        const traces = profile.logicTrace?.[`skill:${skill}`];
        if (traces) {
          traces.forEach((t2) => astroLogicSet.add(t2));
        }
      }
    }
    score += skillScore / stream.requiredSkills.length * 25;
    if (stream.category === "passive" && profile.workStyles["independent"]) {
      score += profile.workStyles["independent"] / 100 * 15;
      reasons.push("Suits independent style");
    } else if (stream.category === "active" && profile.workStyles["collaborative"]) {
      score += profile.workStyles["collaborative"] / 100 * 15;
      reasons.push("Suits collaborative style");
    } else if (stream.category === "hybrid") {
      score += 10;
    }
    const marsInfluence = profile.industries["engineering"] || profile.industries["sports"] || 0;
    const saturnInfluence = profile.workValues["stability"] || 0;
    if (stream.riskLevel === "high" && marsInfluence > saturnInfluence) {
      score += 5;
      reasons.push("Risk tolerance indicated");
    } else if (stream.riskLevel === "low" && saturnInfluence > marsInfluence) {
      score += 5;
      reasons.push("Preference for stability");
    }
    const finalScore = Math.max(25, Math.min(90, Math.round(score)));
    matches.push({
      incomeStreamId: stream.id,
      title: stream.name,
      category: stream.category,
      matchScore: finalScore,
      matchReasons: Array.from(new Set(reasons)).slice(0, 4),
      planetarySupport,
      astroLogic: Array.from(astroLogicSet).slice(0, 5)
    });
  }
  return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}
function getCareerTimingInsights(chartData) {
  const insights = [];
  const { currentDasha, dashas } = chartData;
  const mahadashaInsights = {
    "Sun": "Current period favors leadership roles, government positions, and authority-based careers.",
    "Moon": "Ideal time for careers in healthcare, hospitality, and public-facing roles.",
    "Mars": "Period supports technical careers, engineering, sports, and competitive fields.",
    "Mercury": "Excellent for communication, technology, finance, and analytical careers.",
    "Jupiter": "Favorable for education, law, consulting, and advisory positions.",
    "Venus": "Best period for arts, entertainment, luxury goods, and creative fields.",
    "Saturn": "Supports careers requiring discipline, management, and long-term building.",
    "Rahu": "Period favors unconventional careers, technology, and foreign opportunities.",
    "Ketu": "Suitable for research, spiritual pursuits, and healing professions."
  };
  if (currentDasha.mahadasha && mahadashaInsights[currentDasha.mahadasha]) {
    insights.push(mahadashaInsights[currentDasha.mahadasha]);
  }
  if (currentDasha.antardasha) {
    insights.push(
      `The ${currentDasha.antardasha} sub-period adds its influence, creating a ${currentDasha.mahadasha}-${currentDasha.antardasha} energy combination.`
    );
  }
  const now = /* @__PURE__ */ new Date();
  for (const dasha of dashas) {
    if (dasha.startDate > now && dasha.startDate.getTime() - now.getTime() < 365 * 24 * 60 * 60 * 1e3) {
      insights.push(
        `Upcoming ${dasha.planet} period starting ${dasha.startDate.toLocaleDateString()} will bring new career opportunities aligned with ${dasha.planet}'s significations.`
      );
      break;
    }
  }
  return insights;
}

// server/astro/jaimini.ts
var ZODIAC_SIGNS2 = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces"
];
var SIGN_LORDS2 = [
  "Mars",
  "Venus",
  "Mercury",
  "Moon",
  "Sun",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Saturn",
  "Jupiter"
];
function calculateArudhaLagna(chart) {
  const ascIndex = chart.ascendant.signIndex;
  const lagnaLordName = SIGN_LORDS2[ascIndex];
  const lagnaLord = chart.planets.find((p) => p.planet === lagnaLordName);
  if (!lagnaLord) {
    return { sign: chart.ascendant.sign, signIndex: ascIndex, house: 1 };
  }
  const lordSignIndex = lagnaLord.signIndex;
  let dist = (lordSignIndex - ascIndex + 12) % 12;
  let alIndex = (lordSignIndex + dist) % 12;
  const alRelToAsc = (alIndex - ascIndex + 12) % 12;
  if (alRelToAsc === 0) {
    alIndex = (ascIndex + 9) % 12;
  } else if (alRelToAsc === 6) {
    alIndex = (ascIndex + 3) % 12;
  }
  const house = (alIndex - ascIndex + 12) % 12 + 1;
  return {
    sign: ZODIAC_SIGNS2[alIndex],
    signIndex: alIndex,
    house
  };
}
function calculateArgala(chart, referenceSignIndex) {
  const boosters = [];
  const blockers = [];
  const getPlanetsInSign = (idx) => chart.planets.filter((p) => p.signIndex === idx);
  const idx2 = (referenceSignIndex + 1) % 12;
  const idx12 = (referenceSignIndex + 11) % 12;
  const p2 = getPlanetsInSign(idx2);
  const p12 = getPlanetsInSign(idx12);
  if (p2.length > 0) {
    if (p12.length <= p2.length) {
      p2.forEach((p) => boosters.push(`${p.planet} (2nd)`));
    } else {
      blockers.push(`${p12.map((p) => p.planet).join(", ")} (12th blocking 2nd)`);
    }
  }
  const idx4 = (referenceSignIndex + 3) % 12;
  const idx10 = (referenceSignIndex + 9) % 12;
  const p4 = getPlanetsInSign(idx4);
  const p10 = getPlanetsInSign(idx10);
  if (p4.length > 0) {
    if (p10.length <= p4.length) {
      p4.forEach((p) => boosters.push(`${p.planet} (4th)`));
    } else {
      blockers.push(`${p10.map((p) => p.planet).join(", ")} (10th blocking 4th)`);
    }
  }
  const idx11 = (referenceSignIndex + 10) % 12;
  const idx3 = (referenceSignIndex + 2) % 12;
  const p11 = getPlanetsInSign(idx11);
  const p3 = getPlanetsInSign(idx3);
  if (p11.length > 0) {
    if (p3.length <= p11.length) {
      p11.forEach((p) => boosters.push(`${p.planet} (11th)`));
    } else {
      blockers.push(`${p3.map((p) => p.planet).join(", ")} (3rd blocking 11th)`);
    }
  }
  return { boosters, blockers };
}

// server/astro/timing.ts
function getDynamicMilestones(chart) {
  const events = [];
  const birthYear = parseInt(chart.d1.birthData.date.split("-")[0]);
  const now = /* @__PURE__ */ new Date();
  const lookLimit = new Date(now.getFullYear() + 8, now.getMonth(), now.getDate());
  const timeline = [];
  const currentMaha = chart.dashas.find((d) => now >= d.startDate && now <= d.endDate);
  if (!currentMaha) return [];
  if (currentMaha.subPeriods) {
    currentMaha.subPeriods.forEach((sub) => {
      if (sub.endDate > now) {
        timeline.push({ planet: sub.planet, start: sub.startDate, end: sub.endDate, type: "antardasha" });
      }
    });
  }
  const nextMahaIdx = chart.dashas.findIndex((d) => d.planet === currentMaha.planet) + 1;
  if (nextMahaIdx < chart.dashas.length) {
    const nextMaha = chart.dashas[nextMahaIdx];
    if (nextMaha.subPeriods && nextMaha.startDate < lookLimit) {
      timeline.push({
        planet: nextMaha.planet,
        start: nextMaha.startDate,
        end: nextMaha.endDate,
        type: "mahadasha"
        // Mark as major shift
      });
      nextMaha.subPeriods.forEach((sub) => {
        if (sub.endDate < lookLimit) {
          timeline.push({ planet: sub.planet, start: sub.startDate, end: sub.endDate, type: "antardasha" });
        }
      });
    }
  }
  let count = 0;
  for (const period of timeline) {
    if (count >= 5) break;
    const eventAge = Math.floor((period.start.getTime() - new Date(chart.d1.birthData.date).getTime()) / (1e3 * 60 * 60 * 24 * 365.25));
    const currentRealAge = (now.getTime() - new Date(chart.d1.birthData.date).getTime()) / (1e3 * 60 * 60 * 24 * 365.25);
    if (period.start.getTime() < now.getTime() - 1e3 * 60 * 60 * 24 * 365) continue;
    const analysis = analyzePeriodInfluence(period.planet, chart, period.type === "mahadasha");
    if (analysis.isSignificant) {
      events.push({
        planet: period.planet,
        age: period.start < now ? Math.floor(currentRealAge) : eventAge,
        // Use current age if running
        year: period.start < now ? now.getFullYear() : period.start.getFullYear(),
        description: period.type === "mahadasha" ? `Major Life Shift: Entering ${period.planet} Mahadasha. ${analysis.description}` : `${analysis.headline} (${period.planet} period).`,
        type: analysis.category,
        score: analysis.score
      });
      count++;
    }
  }
  return events;
}
function analyzePeriodInfluence(planetName, chart, isMahadasha) {
  let score = 0;
  let headline = `Focus on ${getPlanetSignifications(planetName)}`;
  let description = "";
  let category = "general";
  if (chart.d10) {
    const pD10 = chart.d10.planets.find((p) => p.planet === planetName);
    if (pD10) {
      if (pD10.house === 10) {
        score += 5;
        headline = "Career Peak & Recognition";
        description += "Expect major professional elevation and authority. ";
        category = "career";
      } else if (pD10.house === 1) {
        score += 4;
        headline = "New Career Beginning";
        description += "A fresh professional chapter begins. Great for job switching. ";
        category = "career";
      }
      if (pD10.house === 7) {
        score += 3;
        headline = "Business Expansion";
        description += "Favorable for partnerships and ventures. ";
        category = "career";
      }
    }
  }
  const d1House2Lord = chart.d1.houses[1].lord;
  const d1House11Lord = chart.d1.houses[10].lord;
  if (planetName === d1House2Lord || planetName === d1House11Lord) {
    score += 4;
    headline = "Financial Growth Phase";
    description += "Income channels activate. Good time for investments. ";
    category = "wealth";
  }
  if (chart.d1.planets.find((p) => p.planet === planetName)?.house === 8) {
    score += 2;
    headline = "Transformation & Change";
    description += "Sudden changes or windfalls possible. ";
    category = "spiritual";
  }
  if (isMahadasha) {
    score += 10;
    headline = `Major Shift: ${planetName} Era`;
  }
  if (score < 3 && !isMahadasha) {
    if (["Jupiter", "Venus", "Mercury", "Sun", "Mars"].includes(planetName)) {
      score += 2;
    }
  }
  return {
    headline,
    description: description || `A period driven by ${planetName} energy (${getPlanetSignifications(planetName)}).`,
    category,
    isSignificant: score >= 3,
    // Only return if impactful
    score
  };
}
function getPlanetSignifications(planet) {
  const map = {
    "Sun": "Authority & Ego",
    "Moon": "Emotions & Public",
    "Mars": "Action & Energy",
    "Mercury": "Communication & Craft",
    "Jupiter": "Wisdom & Expansion",
    "Venus": "Comfort & Relations",
    "Saturn": "Discipline & Delay",
    "Rahu": "Ambition & Change",
    "Ketu": "Detachment & Insight"
  };
  return map[planet] || "Energy";
}
var MATURITY_AGES = {
  "Jupiter": 16,
  "Sun": 22,
  "Moon": 24,
  "Venus": 25,
  "Mars": 28,
  "Mercury": 32,
  "Saturn": 36,
  "Rahu": 42,
  "Ketu": 48
};
function calculateMaturityEvents(birthYear) {
  const events = [];
  for (const [planet, age] of Object.entries(MATURITY_AGES)) {
    events.push({
      planet,
      age,
      year: birthYear + age,
      description: `${planet} matures at age ${age}, triggering ${getMaturityEffect(planet)}`
    });
  }
  return events.sort((a, b) => a.age - b.age);
}
function getMaturityEffect(planet) {
  switch (planet) {
    case "Jupiter":
      return "Expansion, Wisdom, Financial Growth";
    case "Sun":
      return "Status, Authority, Recognition";
    case "Moon":
      return "Emotional stability, Public change";
    case "Venus":
      return "Marriage, Relationship peak, Comfort";
    case "Mars":
      return "Career push, Energy peak, Initiative";
    case "Mercury":
      return "Intellectual peak, Business maturity";
    case "Saturn":
      return "Stabilization, Authority through experience";
    case "Rahu":
      return "Massive expansion, Foreign travel, Unconventional success";
    case "Ketu":
      return "Spiritual realization, Detachment, Sudden change";
    default:
      return "Activation";
  }
}

// server/astro/remedies.ts
function generateAdvancedRemedies(chart) {
  const weakPlanets = identifyWeakPlanets(chart);
  const dashaLord = chart.currentDasha.mahadasha;
  const behavioral = generateBehavioralRemedies(weakPlanets, dashaLord, chart);
  const standard = generateStandardRemedies(weakPlanets);
  const gemstones = generateGemstoneRecommendations(weakPlanets);
  return {
    behavioral,
    standard,
    gemstones,
    weakPlanets,
    strengtheningFocus: determineStrengtheningFocus(chart)
  };
}
function identifyWeakPlanets(chart) {
  const weakProps = /* @__PURE__ */ new Set();
  const d1 = chart.d1;
  d1.planets.forEach((p) => {
    if ([6, 8, 12].includes(p.house)) {
      if (["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"].includes(p.planet)) {
        weakProps.add(p.planet);
      }
    }
  });
  d1.planets.forEach((p) => {
    if (isDebilitated(p)) weakProps.add(p.planet);
  });
  const currentLord = chart.currentDasha.mahadasha;
  if (!weakProps.has(currentLord)) {
  }
  return Array.from(weakProps);
}
function isDebilitated(p) {
  const debilities = {
    "Sun": "Libra",
    "Moon": "Scorpio",
    "Mars": "Cancer",
    "Mercury": "Pisces",
    "Jupiter": "Capricorn",
    "Venus": "Virgo",
    "Saturn": "Aries",
    "Rahu": "Scorpio",
    "Ketu": "Taurus"
  };
  return debilities[p.planet] === p.sign;
}
function generateBehavioralRemedies(weakPlanets, dashaLord, chart) {
  const remedies2 = [];
  const dashaRemedy = getDashaBehavioralRemedy(dashaLord);
  if (dashaRemedy) {
    remedies2.push({ ...dashaRemedy, priority: "High" });
  }
  weakPlanets.forEach((planet) => {
    if (planet === dashaLord) return;
    const remedy = getPlanetBehavioralRemedy(planet);
    if (remedy) {
      remedies2.push({ ...remedy, priority: "Medium" });
    }
  });
  const saturn = chart.d1.planets.find((p) => p.planet === "Saturn");
  if (saturn && saturn.house === 10) {
    remedies2.push({
      title: "Professional Endurance",
      description: "Saturn in the 10th house demands absolute integrity and patience in career.",
      actionableSteps: ["Do not cut corners at work", "Accept delays gracefully", "Mentor juniors"],
      psychologicalShift: "View work as service, not just a means to status.",
      priority: "High"
    });
  }
  return remedies2.slice(0, 5);
}
function getDashaBehavioralRemedy(planet) {
  const map = {
    "Sun": {
      title: "Mastering Ego & Authority",
      description: "During Sun periods, issues with ego, father figures, or authority often surface.",
      actionableSteps: ["Wake up before sunrise daily", "Take responsibility for errors immediately", "Respect your father/boss even if you disagree"],
      psychologicalShift: "I am a servant leader. My confidence serves others, not just myself.",
      priority: "High"
    },
    "Moon": {
      title: "Emotional Regulation",
      description: "Moon periods can bring emotional volatility and sensitivity.",
      actionableSteps: ["Practice daily meditation/mindfulness", "Stay hydrated (water represents moon)", "Keep your living space spotless"],
      psychologicalShift: "I observe my emotions without becoming them.",
      priority: "High"
    },
    "Mars": {
      title: "Channeling Aggression",
      description: "Mars energy brings drive but can lead to conflict and burnout.",
      actionableSteps: ["Daily physical exercise is non-negotiable", "Count to 10 before reacting to provocation", "Avoid competitive arguments"],
      psychologicalShift: "My strength is for protection, not domination.",
      priority: "High"
    },
    "Rahu": {
      title: "Grounding & Reality Checks",
      description: "Rahu periods create illusions, obsessions, and desire for shortcuts.",
      actionableSteps: ["Stick to established traditions/routines", "Avoid 'too good to be true' schemes", "Clean your toilets/bathroom yourself (removes vanity)"],
      psychologicalShift: "I accept the present moment rather than chasing the next big thing.",
      priority: "High"
    },
    "Jupiter": {
      title: "Cultivating Wisdom",
      description: "Jupiter periods test your wisdom, ethics, and ability to learn.",
      actionableSteps: ["Respect teachers and elders", "Read philosophical/educational books", "Avoid arrogance of knowledge"],
      psychologicalShift: "I am a lifelong student. Wisdom comes from humility.",
      priority: "High"
    },
    "Saturn": {
      title: "Discipline & Service",
      description: "Saturn periods demand hard work, patience, and facing reality.",
      actionableSteps: ["Create and stick to a strict daily schedule", "Perform selfless service (Seva)", "Declutter your life"],
      psychologicalShift: "Discipline is freedom. I embrace the grind.",
      priority: "High"
    },
    "Mercury": {
      title: "Truthful Communication",
      description: "Mercury periods highlight speech, business, and intellect.",
      actionableSteps: ["Listen twice as much as you speak", "Avoid gossip strictly", "Keep financial records organized"],
      psychologicalShift: "My words create my reality. I speak with clarity and kindness.",
      priority: "High"
    },
    "Ketu": {
      title: "Letting Go",
      description: "Ketu periods bring detachment, confusion, or spiritual growth.",
      actionableSteps: ["Declutter physical possessions", "Spend time in solitude/nature", "Don't force outcomes"],
      psychologicalShift: "I trust the universe. I release what no longer serves me.",
      priority: "High"
    },
    "Venus": {
      title: "Harmony & Balance",
      description: "Venus periods test relationships and desires.",
      actionableSteps: ["Respect your partner deeply", "Engage in creative or artistic hobbies", "Maintain personal grooming"],
      psychologicalShift: "I find beauty in balance, not excess.",
      priority: "High"
    }
  };
  return map[planet] || null;
}
function getPlanetBehavioralRemedy(planet) {
  const base = getDashaBehavioralRemedy(planet);
  if (base) {
    return {
      ...base,
      description: `${planet} needs strengthening in your chart.`,
      priority: "Medium"
    };
  }
  return null;
}
function generateStandardRemedies(weakPlanets) {
  const remedies2 = [];
  const mantraMap = { "Sun": "Om Suryaya Namaha", "Moon": "Om Chandraya Namaha", "Mars": "Om Mangalaya Namaha", "Mercury": "Om Budhaya Namaha", "Jupiter": "Om Gurave Namaha", "Venus": "Om Shukraya Namaha", "Saturn": "Om Shanaye Namaha", "Rahu": "Om Rahave Namaha", "Ketu": "Om Ketave Namaha" };
  weakPlanets.forEach((p) => {
    if (mantraMap[p]) {
      remedies2.push({
        planet: p,
        type: "Mantra",
        description: `Chant for ${p}`,
        instructions: [`Recite "${mantraMap[p]}" 108 times`, "Best done in the morning"]
      });
      remedies2.push({
        planet: p,
        type: "Charity",
        description: `Donate items related to ${p}`,
        instructions: ["Donate on the day of the planet"]
      });
    }
  });
  return remedies2;
}
function generateGemstoneRecommendations(weakPlanets) {
  const gems = {
    "Sun": { gem: "Ruby", metal: "Gold", wearDay: "Sunday" },
    "Moon": { gem: "Pearl", metal: "Silver", wearDay: "Monday" },
    "Mars": { gem: "Red Coral", metal: "Copper/Gold", wearDay: "Tuesday" },
    "Mercury": { gem: "Emerald", metal: "Gold", wearDay: "Wednesday" },
    "Jupiter": { gem: "Yellow Sapphire", metal: "Gold", wearDay: "Thursday" },
    "Venus": { gem: "Diamond/White Sapphire", metal: "Silver/Platinum", wearDay: "Friday" },
    "Saturn": { gem: "Blue Sapphire", metal: "Iron/Silver", wearDay: "Saturday" },
    "Rahu": { gem: "Hessonite", metal: "Silver", wearDay: "Saturday" },
    "Ketu": { gem: "Cat's Eye", metal: "Silver", wearDay: "Tuesday" }
  };
  return weakPlanets.map((p) => {
    const g = gems[p];
    if (!g) return null;
    return { planet: p, ...g };
  }).filter((g) => g !== null);
}
function determineStrengtheningFocus(chart) {
  const dashaLord = chart.currentDasha.mahadasha;
  const deityMap = {
    "Sun": "Lord Shiva / Rama",
    "Moon": "Goddess Parvati / Krishna",
    "Mars": "Lord Hanuman / Kartikeya",
    "Mercury": "Lord Vishnu",
    "Jupiter": "Lord Shiva / Brihaspati",
    "Venus": "Goddess Lakshmi",
    "Saturn": "Lord Hanuman / Shiva",
    "Rahu": "Goddess Durga",
    "Ketu": "Lord Ganesha"
  };
  return deityMap[dashaLord] || "Ishta Devata";
}

// server/astro/swot.ts
function generateSWOTAnalysis(chart) {
  const strengths = [];
  const weaknesses = [];
  const opportunities = [];
  const threats = [];
  chart.d1.planets.forEach((p) => {
    analyzePlanetStrength(p, chart, strengths, weaknesses);
  });
  if (chart.yogas) {
    chart.yogas.forEach((yoga) => {
      strengths.push({
        id: `yoga-${yoga.name.replace(/\s+/g, "-").toLowerCase()}`,
        category: "Strength",
        title: `${yoga.name} (${yoga.category})`,
        description: yoga.description,
        impactScore: yoga.strength === "strong" ? 9 : yoga.strength === "moderate" ? 7 : 5,
        actionableAdvice: `Leverage this ${yoga.category} yoga by focusing on ${yoga.careerImplication || "leadership and growth"}.`,
        tags: ["Yoga", yoga.category]
      });
    });
  }
  analyzeHouseStructure(chart.d1, strengths, weaknesses, threats);
  analyzeDashaTimeline(chart, opportunities, threats);
  analyzeVargaCharts(chart, strengths, weaknesses, opportunities);
  return {
    strengths: sortAndLimit(strengths),
    weaknesses: sortAndLimit(weaknesses),
    opportunities: sortAndLimit(opportunities),
    threats: sortAndLimit(threats),
    summary: generateSummary(strengths, weaknesses, opportunities, threats)
  };
}
function sortAndLimit(items) {
  return items.sort((a, b) => b.impactScore - a.impactScore).slice(0, 5);
}
function analyzePlanetStrength(p, chart, s, w) {
  const isExalted2 = checkExaltation(p);
  const isDebilitated2 = checkDebilitation(p);
  const isOwnSign = checkOwnSign(p);
  const isVargottama = checkVargottama(p, chart.d9);
  if (isExalted2) {
    s.push({
      id: `${p.planet}-exalt`,
      category: "Strength",
      title: `Exalted ${p.planet}`,
      description: `${p.planet} is at its highest potential in ${p.sign}.`,
      impactScore: 10,
      actionableAdvice: `Use your ${getPlanetKeywords(p.planet)} to lead projects.`,
      tags: ["Planet", "Exaltation"]
    });
  }
  if (isOwnSign) {
    s.push({
      id: `${p.planet}-own`,
      category: "Strength",
      title: `${p.planet} in Own Sign`,
      description: `Strong and comfortable placement in ${p.sign}.`,
      impactScore: 8,
      actionableAdvice: `Rely on your natural ${getPlanetKeywords(p.planet)} capabilities.`,
      tags: ["Planet", "Stability"]
    });
  }
  if (isVargottama) {
    s.push({
      id: `${p.planet}-vargottama`,
      category: "Strength",
      title: `Vargottama ${p.planet}`,
      description: `${p.planet} occupies the same sign in D1 and D9, indicating consistent power.`,
      impactScore: 9,
      actionableAdvice: `This is a core pillar of your personality. Build your career around ${getPlanetKeywords(p.planet)}.`,
      tags: ["Planet", "Vargottama"]
    });
  }
  if (isDebilitated2) {
    const isNeechaBhanga = checkNeechaBhanga(p, chart.d1);
    if (isNeechaBhanga) {
      s.push({
        id: `${p.planet}-neechabhanga`,
        category: "Strength",
        title: `Neecha Bhanga Raja Yoga (${p.planet})`,
        description: `Initial struggles with ${p.planet} turn into massive success later.`,
        impactScore: 8,
        actionableAdvice: `Don't give up when facing ${p.planet} obstacles; they are stepping stones.`,
        tags: ["Planet", "Transformation"]
      });
    } else {
      w.push({
        id: `${p.planet}-debility`,
        category: "Weakness",
        title: `Weak ${p.planet}`,
        description: `${p.planet} struggles in ${p.sign}.`,
        impactScore: 7,
        actionableAdvice: `Be mindful of ${getPlanetKeywords(p.planet)} issues. Use remedies or delegate these tasks.`,
        tags: ["Planet", "Debility"]
      });
    }
  }
}
function analyzeHouseStructure(d1, s, w, t2) {
  const planetsIn6 = d1.planets.filter((p) => p.house === 6);
  const planetsIn8 = d1.planets.filter((p) => p.house === 8);
  const planetsIn12 = d1.planets.filter((p) => p.house === 12);
  if (planetsIn6.length > 2) {
    s.push({
      id: "strong-6th",
      category: "Strength",
      title: "Competitive Edge",
      description: "Multiple planets in 6th house indicate ability to defeat enemies and solve complex problems.",
      impactScore: 7,
      actionableAdvice: "Pursue careers in law, medicine, or competitive business.",
      tags: ["House 6", "Competition"]
    });
  }
  if (planetsIn8.length > 0) {
    t2.push({
      id: "active-8th",
      category: "Threat",
      title: "Hidden Transformations",
      description: "Planets in 8th house can bring sudden changes.",
      impactScore: 6,
      actionableAdvice: "Maintain an emergency fund and avoid risky speculation.",
      tags: ["House 8", "Risk"]
    });
  }
  const planetsInKendra = d1.planets.filter((p) => [1, 4, 7, 10].includes(p.house));
  if (planetsInKendra.length >= 3) {
    s.push({
      id: "strong-kendra",
      category: "Strength",
      title: "Foundational Power",
      description: "Many planets in angular houses provide strong support for major life goals.",
      impactScore: 8,
      actionableAdvice: "Take lead roles; you have the structural support to handle pressure.",
      tags: ["Kendras", "Stability"]
    });
  }
}
function analyzeDashaTimeline(chart, o, t2) {
  const currentLord = chart.currentDasha.mahadasha;
  const isLordBenefic = ["Jupiter", "Venus", "Moon", "Mercury"].includes(currentLord);
  if (isLordBenefic) {
    o.push({
      id: `dasha-${currentLord}-opp`,
      category: "Opportunity",
      title: `Benefic ${currentLord} Period`,
      description: `Current major period is ruled by a natural benefic, facilitating growth.`,
      impactScore: 8,
      actionableAdvice: `Expand your network and learn new skills during this favorable window.`,
      tags: ["Dasha", "Growth"]
    });
  } else {
    const p = chart.d1.planets.find((p2) => p2.planet === currentLord);
    if (p && [3, 6, 10, 11].includes(p.house)) {
      o.push({
        id: `dasha-${currentLord}-upachaya`,
        category: "Opportunity",
        title: `${currentLord} in Upachaya House`,
        description: `Malefic planet in a growth house brings success through effort.`,
        impactScore: 8,
        actionableAdvice: `Work hard now; the results will compound significantly.`,
        tags: ["Dasha", "Hard Work"]
      });
    } else {
      t2.push({
        id: `dasha-${currentLord}-challenge`,
        category: "Threat",
        title: `Challenging ${currentLord} Period`,
        description: `Current period requires discipline and may test resilience.`,
        impactScore: 6,
        actionableAdvice: `Consolidate rather than expand. Focus on routine and discipline.`,
        tags: ["Dasha", "Caution"]
      });
    }
  }
}
function analyzeVargaCharts(chart, s, w, o) {
  if (chart.d10) {
    const lord10d1 = chart.d1.houses[9].lord;
    const lord10inD10 = chart.d10.planets.find((p) => p.planet === lord10d1);
    if (lord10inD10 && [1, 4, 7, 10, 5, 9].includes(lord10inD10.house)) {
      o.push({
        id: "d10-strength",
        category: "Opportunity",
        title: "Career Elevation (D10)",
        description: "10th Lord is well-placed in the Career Chart (Dasamsa).",
        impactScore: 9,
        actionableAdvice: "Aim for high-level positions; your career destiny is strong.",
        tags: ["D10", "Career"]
      });
    } else if (lord10inD10 && [6, 8, 12].includes(lord10inD10.house)) {
      w.push({
        id: "d10-weakness",
        category: "Weakness",
        title: "Career Instability (D10)",
        description: "10th Lord is in a difficult house in D10.",
        impactScore: 7,
        actionableAdvice: "Avoid office politics and abrupt job changes. Build stability.",
        tags: ["D10", "Career"]
      });
    }
  }
}
function getPlanetKeywords(planet) {
  const map = {
    "Sun": "leadership & vitality",
    "Moon": "emotional intelligence",
    "Mars": "drive & execution",
    "Mercury": "communication & logic",
    "Jupiter": "wisdom & strategy",
    "Venus": "creativity & diplomacy",
    "Saturn": "discipline & structure",
    "Rahu": "innovation",
    "Ketu": "intuition"
  };
  return map[planet] || "energy";
}
function checkExaltation(p) {
  const signs = { "Sun": "Aries", "Moon": "Taurus", "Mars": "Capricorn", "Mercury": "Virgo", "Jupiter": "Cancer", "Venus": "Pisces", "Saturn": "Libra", "Rahu": "Taurus", "Ketu": "Scorpio" };
  return signs[p.planet] === p.sign;
}
function checkDebilitation(p) {
  const signs = { "Sun": "Libra", "Moon": "Scorpio", "Mars": "Cancer", "Mercury": "Pisces", "Jupiter": "Capricorn", "Venus": "Virgo", "Saturn": "Aries", "Rahu": "Scorpio", "Ketu": "Taurus" };
  return signs[p.planet] === p.sign;
}
function checkOwnSign(p) {
  const lords = SIGN_LORDS;
  const ownership = {
    "Sun": ["Leo"],
    "Moon": ["Cancer"],
    "Mars": ["Aries", "Scorpio"],
    "Mercury": ["Gemini", "Virgo"],
    "Jupiter": ["Sagittarius", "Pisces"],
    "Venus": ["Taurus", "Libra"],
    "Saturn": ["Capricorn", "Aquarius"]
  };
  return ownership[p.planet]?.includes(p.sign) || false;
}
function checkVargottama(p, d9) {
  if (!d9) return false;
  const pD9 = d9.planets.find((dp) => dp.planet === p.planet);
  return pD9 ? pD9.sign === p.sign : false;
}
function checkNeechaBhanga(p, d1) {
  return false;
}
function generateSummary(s, w, o, t2) {
  const strong = s.length > w.length;
  return `Your chart shows ${strong ? "more strengths than weaknesses" : "significant areas for improvement"}. 
    Focus on "${o[0]?.title || "ucoming opportunities"}" to mitigate "${t2[0]?.title || "potential risks"}. 
    Your ${s[0]?.title || "core strength"} is your biggest asset.`;
}

// server/astro/analyzer.ts
function analyzeOrientation(d1) {
  let serviceScore = 0;
  let businessScore = 0;
  const planetsIn6 = d1.planets.filter((p) => p.house === 6).length;
  serviceScore += planetsIn6 * 10;
  const planetsIn7 = d1.planets.filter((p) => p.house === 7).length;
  businessScore += planetsIn7 * 10;
  const planetsIn3 = d1.planets.filter((p) => p.house === 3).length;
  businessScore += planetsIn3 * 5;
  const lord10Name = d1.houses[9].lord;
  const lord10 = d1.planets.find((p) => p.planet === lord10Name);
  if (lord10) {
    if (lord10.house === 6) serviceScore += 20;
    if (lord10.house === 7) businessScore += 20;
  }
  let type = "Employment";
  if (businessScore > serviceScore + 5) {
    type = "Business";
  } else if (Math.abs(businessScore - serviceScore) <= 5) {
    type = "Consultant";
  }
  const drivingPlanet = lord10Name || "Saturn";
  return {
    type,
    score: { service: serviceScore, business: businessScore },
    drivingPlanet,
    description: `Primary orientation is towards ${type} based on dominance of ${type === "Business" ? "7th (Trade) & 3rd (Risk)" : "6th (Service)"} houses.`
  };
}
function analyzeWealthArchitecture(fullChart) {
  const d2 = fullChart.d2;
  let sunHoraCount = 0;
  let moonHoraCount = 0;
  if (d2) {
    d2.planets.forEach((p) => {
      if (p.signIndex === 3) moonHoraCount++;
      if (p.signIndex === 4) sunHoraCount++;
    });
  }
  const d2Source = sunHoraCount > moonHoraCount ? "Active (Sun)" : moonHoraCount > sunHoraCount ? "Passive (Moon)" : "Mixed";
  let d10Status = "Standard";
  const d10 = fullChart.d10;
  if (d10) {
    const planetsIn10 = d10.planets.filter((p) => p.house === 10);
    if (planetsIn10.length > 0) d10Status = "High Prominence (Planets in 10th)";
    planetsIn10.forEach((p) => {
      if (isExalted(p)) d10Status = "Executive/Director Level (Exalted Planet in 10th)";
    });
  }
  const d8 = fullChart.d8;
  let d8Windfall = "Average";
  if (d8) {
    const p2 = d8.planets.filter((p) => p.house === 2);
    const p11 = d8.planets.filter((p) => p.house === 11);
    const beneficCount = [...p2, ...p11].filter((p) => ["Jupiter", "Venus", "Mercury", "Moon"].includes(p.planet)).length;
    const maleficCount = [...p2, ...p11].filter((p) => ["Saturn", "Mars", "Rahu", "Ketu", "Sun"].includes(p.planet)).length;
    if (beneficCount > maleficCount) d8Windfall = "High Potential (Inheritance/Lottery)";
    else if (maleficCount > beneficCount) d8Windfall = "Risk of Sudden Loss";
  }
  const d12 = fullChart.d12;
  let d12Legacy = "Self-Made";
  if (d12) {
    const sun = d12.planets.find((p) => p.planet === "Sun");
    const moon = d12.planets.find((p) => p.planet === "Moon");
    if (sun && [1, 4, 7, 10, 5, 9].includes(sun.house)) d12Legacy = "Inherited";
  }
  const d16 = fullChart.d16;
  let d16Assets = "Standard";
  const lord4D1 = fullChart.d1.houses[3].lord;
  if (d16 && lord4D1) {
    const p = d16.planets.find((p2) => p2.planet === lord4D1);
    if (p) {
      if ([6, 8, 12].includes(p.house)) d16Assets = "Challenges with Assets (Legal/Repairs)";
      else if (["Saturn", "Rahu", "Mars"].some((m) => checkConjunction(p, m, d16))) d16Assets = "Stressful Assets";
      else d16Assets = "Joyful/Comfortable Assets";
    }
  }
  const d24 = fullChart.d24;
  let d24Niche = "General";
  if (d24) {
    const ascLordName = getSafeSignLord(d24.ascendant.signIndex);
    d24Niche = `${ascLordName} related specalization`;
  }
  return { d2Source, d10Status, d8Windfall, d12Legacy, d16Assets, d24Niche };
}
function isExalted(p) {
  const exaltations = {
    "Sun": "Aries",
    "Moon": "Taurus",
    "Mars": "Capricorn",
    "Mercury": "Virgo",
    "Jupiter": "Cancer",
    "Venus": "Pisces",
    "Saturn": "Libra",
    "Rahu": "Taurus",
    "Ketu": "Scorpio"
  };
  return exaltations[p.planet] === p.sign;
}
function checkConjunction(p1, p2Name, chart) {
  const p2 = chart.planets.find((p) => p.planet === p2Name);
  return p2 && p2.house === p1.house;
}
function getSafeSignLord(idx) {
  const lords = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
  return lords[idx] || "Unknown";
}
function generateMasterAnalysis(fullChart) {
  const orientation = analyzeOrientation(fullChart.d1);
  const wealth = analyzeWealthArchitecture(fullChart);
  const al = calculateArudhaLagna(fullChart.d1);
  const argala = calculateArgala(fullChart.d1, al.signIndex);
  const status = {
    arudhaLagna: al.sign,
    reputation: `Seen as ${orientation.type === "Business" ? "Enterprising" : "Reliable"} (AL in ${al.sign})`,
    boosters: argala.boosters,
    blockers: argala.blockers
  };
  const maturityEvents = getDynamicMilestones(fullChart);
  if (maturityEvents.length === 0) {
    const birthYear = parseInt(fullChart.d1.birthData.date.split("-")[0]);
    const staticEvents = calculateMaturityEvents(birthYear);
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    staticEvents.forEach((e) => {
      if (e.year >= currentYear) maturityEvents.push(e);
    });
  }
  const remedies2 = generateAdvancedRemedies(fullChart);
  const swot = generateSWOTAnalysis(fullChart);
  return {
    orientation,
    wealth,
    status,
    timing: { maturityEvents },
    remedies: remedies2,
    swot
  };
}

// server/services/googleMaps.ts
import { Client } from "@googlemaps/google-maps-services-js";
var GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
console.log("Backend GOOGLE_MAPS_API_KEY status:", GOOGLE_MAPS_API_KEY ? `Detected (${GOOGLE_MAPS_API_KEY.substring(0, 10)}...)` : "NOT DETECTED");
if (!GOOGLE_MAPS_API_KEY) {
  console.warn("\u26A0\uFE0F  GOOGLE_MAPS_API_KEY not set - location services will be limited");
}
var mapsClient = new Client({});
async function geocodeAddress(address) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key not set. Geocoding service unavailable.");
  }
  try {
    const response = await mapsClient.geocode({
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY
      }
    });
    if (response.data.results.length === 0) {
      throw new Error(`No location found for: ${address}`);
    }
    const result = response.data.results[0];
    const location = result.geometry.location;
    const timezoneData = await getTimezone(location.lat, location.lng);
    const addressComponents = result.address_components;
    const country = addressComponents.find((c) => c.types.includes("country"))?.long_name;
    const state = addressComponents.find((c) => c.types.includes("administrative_area_level_1"))?.long_name;
    return {
      placeName: result.formatted_address,
      latitude: location.lat,
      longitude: location.lng,
      timezone: timezoneData.timeZoneId,
      timezoneOffset: timezoneData.rawOffset / 3600,
      // Convert seconds to hours
      country,
      state,
      formattedAddress: result.formatted_address
    };
  } catch (error) {
    console.error("Google Maps geocoding failed specifically with error:", error.message);
    if (error.response?.data) {
      console.error("Error Details:", JSON.stringify(error.response.data, null, 2));
    }
    throw new Error(`Failed to geocode address "${address}": ${error.message}`);
  }
}
async function getTimezone(latitude, longitude, timestamp2) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key required for timezone lookup");
  }
  try {
    const response = await mapsClient.timezone({
      params: {
        location: { lat: latitude, lng: longitude },
        timestamp: timestamp2 || Math.floor(Date.now() / 1e3),
        key: GOOGLE_MAPS_API_KEY
      }
    });
    return {
      timeZoneId: response.data.timeZoneId,
      rawOffset: response.data.rawOffset,
      dstOffset: response.data.dstOffset
    };
  } catch (error) {
    throw new Error(`Failed to get timezone: ${error.message}`);
  }
}

// server/services/ai.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
var API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.warn("GEMINI_API_KEY is not set in .env. AI features will be disabled.");
}
var genAI = new GoogleGenerativeAI(API_KEY || "");
var model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    responseMimeType: "application/json",
    maxOutputTokens: 8e3
  }
});
function extractJSON(text2) {
  try {
    return JSON.parse(text2);
  } catch (e) {
    const cleaned = text2.replace(/```json/g, "").replace(/```/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      const startBrace = cleaned.indexOf("{");
      const startBracket = cleaned.indexOf("[");
      const endBrace = cleaned.lastIndexOf("}");
      const endBracket = cleaned.lastIndexOf("]");
      let start = -1;
      let end = -1;
      if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
        start = startBrace;
        end = endBrace;
      } else if (startBracket !== -1) {
        start = startBracket;
        end = endBracket;
      }
      if (start !== -1 && end !== -1 && end > start) {
        try {
          return JSON.parse(cleaned.substring(start, end + 1));
        } catch (e3) {
          throw new Error("Found JSON structure but it is malformed: " + e3.message);
        }
      }
      throw new Error("Could not extract valid JSON from response");
    }
  }
}
async function callAi(prompt, errorContext) {
  if (!API_KEY) {
    throw new Error("AI Service not configured");
  }
  try {
    console.log(`[AI-Service] Sending request to Gemini (${errorContext})...`);
    const timeout = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("AI Request Timed Out (25s)")), 25e3)
    );
    const result = await Promise.race([
      model.generateContent(prompt),
      timeout
    ]);
    console.log(`[AI-Service] Received response from Gemini (${errorContext}). Processing...`);
    const response = result.response;
    const text2 = response.text();
    console.log(`[AI-Service] Raw response length from ${errorContext}:`, text2.length);
    return extractJSON(text2);
  } catch (error) {
    console.error(`AI ${errorContext} Error:`, error);
    if (error.message?.includes("Candidate was stopped")) {
      throw new Error("Security safety filter triggered. Please try a different description.");
    }
    if (error.message?.includes("Timed Out")) {
      throw new Error("The cosmic connection is slow today. Please try again in a moment.");
    }
    if (error.message?.includes("quota")) {
      throw new Error("Cosmic energy limit reached (API Quota). Please try again later.");
    }
    throw new Error(`Failed to ${errorContext.toLowerCase()}: ${error.message}`);
  }
}
var AiService = {
  async validateBusinessIdea(profile, businessIdea) {
    const prompt = `
      You are an expert Vedic Astrologer specializing in Business Astrology (Financial Astrology).
      Analyze if the following Business Idea is suitable for the person based on their births chart.

      Business Idea: "${businessIdea}"

      User Profile Context:
      - Ascendant: ${profile.ascendant || "Unknown"}
      - Moon Sign: ${profile.moonSign || "Unknown"}
      - Dominant Planets: ${Array.isArray(profile.dominantPlanets) ? profile.dominantPlanets.join(", ") : "Unknown"}
      - Current Mahadasha: ${profile.currentDasha || "Unknown"}
      - Career Orientation: ${profile.orientation?.type || "Unknown"} (Service Score: ${profile.orientation?.score?.service}, Business Score: ${profile.orientation?.score?.business})
      - Wealth Source: ${profile.wealth?.d2Source || "Unknown"}
      - Professional Status (D10): ${profile.wealth?.d10Status || "Unknown"}
      
      Planetary Positions (D1):
      ${profile.planetsD1?.map((p) => `- ${p.planet} in House ${p.house} (${p.sign}) ${p.isExalted ? "[EXALTED]" : ""}`).join("\n")}
      
      Task:
      1. Deeply analyze the connection between the Business Idea and the user's chart.
      2. Pay special attention to the 10th House (Career), 7th House (Partnerships/Trade), 2nd House (Wealth), and 11th House (Gains).
      3. Evaluate if the Mahadasha lord supports this venture.
      4. Assign a "Compatibility Score" (0-100). If the score is between 70-85, be very specific about why it's not higher or lower. DO NOT default to common numbers like 78 or 85 unless justified.
      5. Identify 3+ specific "Cosmic Strengths" (planetary supports) and 3+ "Challenges".
      6. Provide 3-5 actionable "Success Tips" based on their specific planetary strengths.

      Return ONLY a JSON object with this structure:
      {
        "score": number,
        "analysis": "A detailed 2-3 sentence strategic summary.",
        "strengths": ["string", "string", "string"],
        "challenges": ["string", "string", "string"],
        "tips": ["string", "string", "string"]
      }
    `;
    return callAi(prompt, "Validate Business");
  },
  async generateSwotStrategy(profile, swotData) {
    const prompt = `
      You are an expert Strategic Consultant and Astrologer.
      Synthesize the following SWOT Analysis into a high-level "Executive Strategy".

      Profile Context:
      - Ascendant: ${profile.ascendant || "Unknown"}
      - Driving Planet: ${profile.drivingPlanet || "Unknown"}

      SWOT Data Highlights:
      - Strengths: ${JSON.stringify(swotData.strengths?.map((s) => s.title) || [])}
      - Weaknesses: ${JSON.stringify(swotData.weaknesses?.map((w) => w.title) || [])}
      - Opportunities: ${JSON.stringify(swotData.opportunities?.map((o) => o.title) || [])}
      - Threats: ${JSON.stringify(swotData.threats?.map((t2) => t2.title) || [])}

      Task:
      1. Write a 2-3 sentence "Executive Summary" that weaves their strengths and opportunities together.
      2. Identify ONE "Key Insight" that acts as a lever to change their career trajectory.
      3. Provide 3 specific "Strategic Advice" points to mitigate weaknesses using their strengths.

      Return ONLY a JSON object with this structure:
      {
        "executiveSummary": "Your natural charisma (Venus) aligns perfectly with current market trends...",
        "keyInsight": "Leverage your communication skills to overcome administrative weaknesses.",
        "strategicAdvice": ["Delegate detailed work", "Focus on public speaking"]
      }
    `;
    return callAi(prompt, "Generate SWOT Strategy");
  },
  async generateWealthNarrative(profile, wealthData, timingEvents) {
    const prompt = `
      You are an expert Vedic Financial Astrologer.
      Create a "Wealth Narrative" (a biographical story) of the user's financial future.

      Profile Context:
      - Ascendant: ${profile.ascendant || "Unknown"}
      - Moon Sign: ${profile.moonSign || "Unknown"}
      - Dominant Planets: ${Array.isArray(profile.dominantPlanets) ? profile.dominantPlanets.join(", ") : "Unknown"}

      Wealth Data:
      - Source: ${wealthData.d2Source}
      - Status Potential: ${wealthData.d10Status}
      - Windfalls: ${wealthData.d8Windfall}
      - Legacy: ${wealthData.d12Legacy}

      Key Timing Events (Future):
      ${timingEvents.map((e) => `- Year ${e.year}: ${e.title} (${e.type})`).join("\n")}

      Task:
      1. Write a 3-paragraph "Financial Biography" describing their journey from early struggles (if any) to peak wealth and legacy. Use storytelling language (e.g., "In your mid-30s, the stars indicate a pivotal shift...").
      2. Identify a "Core Financial Theme" (brand name for their life, e.g., "The Philanthropic Tycoon").
      3. Extract 3-5 major future "Financial Milestones" from the timing events.

      Return ONLY a JSON object with this structure:
      {
        "narrative": "A rich story text...",
        "theme": "The Resilience Builder",
        "milestones": [ { "year": 2026, "event": "First major business exit" } ]
      }
    `;
    return callAi(prompt, "Generate Wealth Narrative");
  },
  async chatWithCounselor(profile, message, history) {
    const formatChartsForPrompt = (charts) => {
      if (!charts) return "No divisional chart data available.";
      let output = "";
      const chartNames = {
        d1: "D1 (Rashi - General Life)",
        d2: "D2 (Hora - Wealth)",
        d9: "D9 (Navamsa - Inner Strength/Partnership)",
        d10: "D10 (Dasamsa - Career/Status)",
        d4: "D4 (Chaturthamsa - Property/Home)",
        d8: "D8 (Ashtamsha - Sudden Events/Legacy)",
        d24: "D24 (Chaturvimshamsa - Education/Skills)"
      };
      for (const [key, planets] of Object.entries(charts)) {
        if (!Array.isArray(planets)) continue;
        if (!chartNames[key]) continue;
        output += `
${chartNames[key] || key.toUpperCase()}:
`;
        planets.forEach((p) => {
          const dignity = p.dignity !== "neutral" ? ` [${p.dignity.toUpperCase()}]` : "";
          const retrograde = p.isRetrograde ? " (R)" : "";
          const degreeInfo = p.degree !== void 0 ? ` at ${p.degree}\xB0${p.minute}'` : "";
          const nakshatra = p.nakshatra ? ` [${p.nakshatra}]` : "";
          output += `- ${p.planet} in ${p.sign} (${p.house}H)${degreeInfo}${dignity}${retrograde}${nakshatra}
`;
        });
      }
      return output;
    };
    const formattedCharts = formatChartsForPrompt(profile.charts);
    const systemPrompt = `
      You are an expert Vedic Astrologer and Career Counselor AI.
      Your role is to guide the native through their career, wealth, property, and life journey with ULTIMATE PRECISION.
      
      User Profile Context:
      - Ascendant: ${profile.ascendant || "Unknown"}
      - Moon Sign: ${profile.moonSign || "Unknown"}
      
      Time Lords (Vimshottari Dasha Hierarchy):
      - Mahadasha (Main Period): ${profile.currentDasha}
      - Antardasha (Sub Period): ${profile.currentAntardasha}
      - Pratyantardasha (Sub-Sub Period): ${profile.currentPratyantardasha} (Monthly precision)
      - Sookshma Dasha: ${profile.currentSookshmadasha} (Weekly precision)
      - Praana Dasha: ${profile.currentPraanadasha} (Daily precision)
      
      Detailed Planetary Positions (Divisional Charts):
      ${formattedCharts}
      
      Career & Wealth Profile:
      - Career Orientation: ${profile.orientation?.type || "Unknown"}
      - Wealth Source: ${profile.wealth?.d2Source || "Unknown"}
      - Status (D10): ${profile.wealth?.d10Status || "Unknown"}

      Detailed Dasha Timeline (Current Mahadasha structure):
      ${JSON.stringify(profile.mahadashaDetails || "Only current dasha available")}

      IMPORTANT INSTRUCTIONS:
      1. For TIMING questions (When?): You MUST look at the Sookshma and Praana dashas. Give the user SPECIFIC MONTHS and WEEKS. Do NOT say "it's not available". It is right there in the context.
      2. For PROPERTY/HOME: You MUST check the D4 chart data provided above. Look at the 4th house and its lord in D4.
      3. For WEALTH: Check D2 planets and D8 (for windfalls) provided above.
      4. For CAREER: Check D10 planets provided above. A planet in the 10th house of D10 is CRITICAL.
      5. For FULFILLMENT: Check D9 (Navamsa). A planet weak in D10 but strong in D9 will eventually give results.
      6. TONE: Be a supportive, wise guru. Avoid "astro-babble" without context. Explain WHY a planet is causing an effect (e.g., "Because Sun is in your 10th house in D10...").
      7. FORMATTING: Use Markdown. **Bold** names and dates. Use tables or lists for timelines.
      8. CRITICAL: Never say "I don't have enough info" if the charts are provided. Use the patterns you see to give a deterministic cosmic perspective.
      9. ANALYSIS STRATEGY: 
         - Always cross-reference D1 (Rashi) with the specific divisional chart (e.g., D10 for career). 
         - Connect the current Dasha lord to the relevant divisional chart (e.g., "You are in Jupiter Dasha, and Jupiter is in the 5th house of your D10 chart...").
         - **Dignity & Degrees**: Explicitly mention planetary dignity (Exalted/Debilitated) and specific degrees if relevant (e.g. "Sun at 29\xB0").
         - **Retrograde**: Note any Retrograde (R) planets and their "twisted" or "internalized" effects.
         - **D10 Specifics**: For career, analyze the D10 10th lord's placement and the D1 10th lord's placement IN D10.

      Return ONLY a JSON object with this structure:
      {
        "response": "Your markdown-formatted astrological advice here"
      }
    `;
    const conversationText = history.map((msg) => `${msg.role === "user" ? "User" : "Astrologer"}: ${msg.content}`).join("\n");
    const fullPrompt = `${systemPrompt}

${conversationText}
User: ${message}
Astrologer:`;
    const result = await callAi(fullPrompt, "Chat with Counselor");
    return result.response || (typeof result === "string" ? result : JSON.stringify(result));
  },
  async validateCareerPath(profile, currentRole, targetRole) {
    const roleToValidate = targetRole || currentRole;
    const isPivot = !!targetRole;
    const prompt = `
      You are an expert Vedic Astrologer and Career Counselor.
      
      User Profile:
      - Dominant Planets: ${profile.dominantPlanets.join(", ")}
      - Strong Houses: ${profile.strongHouses.join(", ")}
      - Current Mahadasha: ${profile.currentDasha || "Unknown"}
      - Planetary Positions (D1): ${profile.planetsD1?.map((p) => `${p.planet} in H${p.house}`).join(", ")}
      - Top Holland Codes: ${Object.entries(profile.hollandCodes || {}).sort(([, a], [, b]) => b - a).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(", ")}
      
      Context:
      - ${isPivot ? `Current Role: ${currentRole}` : `Role to Validate: ${currentRole}`}
      ${isPivot ? `- Target Role: ${targetRole}` : ""}
      
      Task:
      Analyze the compatibility of the "${roleToValidate}" with the user's astrological profile.
      1. Calculate a compatibility score (0-100) based on how well the role aligns with their Dominant Planets/Houses.
      2. Provide a "Cosmic Analysis" explaining the match (or mismatch). Use markdown.
      3. ${isPivot ? 'Suggest a 3-step "Pivot Strategy" to bridge the gap from Current to Target role.' : 'Suggest a 3-step "Growth Strategy" to maximize success and fulfillment in this role.'}
      4. Suggest a "Smart Pivot" - a related role that might be a better fit if the current one isn't ideal, or a logical next step/promotion.
      
      Return JSON format:
      {
        "compatibilityScore": number,
        "analysis": "markdown string",
        "strategy": ["step 1", "step 2", "step 3"],
        "smartPivot": { "suggestedRole": "string", "reason": "string" }
      }
    `;
    return callAi(prompt, "Validate Career Path");
  },
  async mapCareerToAstrology(careerName) {
    const prompt = `
      Identify the primary Vedic Astrological significators for the career: "${careerName}".
      Return JSON: { "planets": ["Planet1", "Planet2"], "houses": [HouseNumber1, HouseNumber2] }
      Valid Planets: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu, Uranus, Neptune, Pluto.
      Valid Houses: 1-12.
    `;
    try {
      return await callAi(prompt, "Map Career to Astrology");
    } catch (error) {
      console.error("AI Mapping Error:", error);
      return { planets: [], houses: [] };
    }
  },
  async generateCareerCandidates(planets) {
    const prompt = `
      Suggest 5 modern, high-growth careers for someone with strong ${planets.join(" and ")}.
      
      Return ONLY a JSON array of objects with this structure:
      [
        {
          "title": "Career Title",
          "description": "Brief description of the role",
          "reason": "Why this matches the planetary influences",
          "skills": ["Skill 1", "Skill 2", "Skill 3"]
        }
      ]
    `;
    try {
      return await callAi(prompt, "Generate Career Candidates");
    } catch (error) {
      console.error("AI Candidate Generation Error:", error);
      return [];
    }
  }
};

// server/routers.ts
var birthDataSchema = z2.object({
  profileName: z2.string().optional().default("My Profile"),
  birthDate: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  birthTime: z2.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be HH:MM or HH:MM:SS"),
  birthPlace: z2.string().min(1, "Birth place is required"),
  latitude: z2.number().min(-90).max(90),
  longitude: z2.number().min(-180).max(180),
  timezone: z2.string(),
  timezoneOffset: z2.number(),
  ayanamsa: z2.enum(["lahiri", "raman", "krishnamurti"]).optional().default("lahiri"),
  isPrimary: z2.boolean().optional().default(false)
});
var appRouter = router({
  system: systemRouter,
  // Auth router
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // Geo-location router
  geo: router({
    getLocation: publicProcedure.input(z2.object({ location: z2.string() })).query(async ({ input }) => {
      try {
        const geoData = await geocodeAddress(input.location);
        return {
          placeName: geoData.placeName,
          latitude: geoData.latitude,
          longitude: geoData.longitude,
          timezone: geoData.timezone,
          timezoneOffset: geoData.timezoneOffset,
          formattedAddress: geoData.formattedAddress
        };
      } catch (error) {
        throw new Error(`Failed to get location: ${error.message}`);
      }
    })
  }),
  // Birth Profile router
  profile: router({
    // Create a new birth profile
    create: protectedProcedure.input(birthDataSchema).mutation(async ({ ctx, input }) => {
      const birthTime = input.birthTime.includes(":") && input.birthTime.split(":").length === 2 ? `${input.birthTime}:00` : input.birthTime;
      const localBirthData = {
        date: input.birthDate,
        // YYYY-MM-DD
        time: birthTime,
        // HH:MM:SS
        latitude: input.latitude,
        longitude: input.longitude,
        timezone: input.timezoneOffset,
        ayanamsa: input.ayanamsa,
        placeName: input.birthPlace
      };
      const fullChartData = await generateFullChartData(localBirthData);
      const profileId = await createBirthProfile({
        userId: ctx.user.id,
        profileName: input.profileName,
        birthDate: input.birthDate,
        birthTime,
        birthPlace: input.birthPlace,
        latitude: input.latitude.toString(),
        longitude: input.longitude.toString(),
        timezone: input.timezone,
        timezoneOffset: input.timezoneOffset.toString(),
        ayanamsa: input.ayanamsa,
        chartData: fullChartData,
        dashaData: fullChartData.dashas,
        isPrimary: input.isPrimary
      });
      return { profileId, chartData: fullChartData };
    }),
    // Get all profiles for current user
    list: protectedProcedure.query(async ({ ctx }) => {
      return getBirthProfilesByUser(ctx.user.id);
    }),
    // Get a specific profile with full chart data
    get: protectedProcedure.input(z2.object({ profileId: z2.number() })).query(async ({ ctx, input }) => {
      const profile = await getBirthProfileById(input.profileId, ctx.user.id);
      if (!profile) {
        throw new Error("Profile not found");
      }
      return profile;
    }),
    // Set a profile as primary
    setPrimary: protectedProcedure.input(z2.object({ profileId: z2.number() })).mutation(async ({ ctx, input }) => {
      await setPrimaryProfile(input.profileId, ctx.user.id);
      return { success: true };
    }),
    // Delete a profile
    delete: protectedProcedure.input(z2.object({ profileId: z2.number() })).mutation(async ({ ctx, input }) => {
      await deleteBirthProfile(input.profileId, ctx.user.id);
      return { success: true };
    }),
    // Recalculate chart for a profile using local calculations
    recalculate: protectedProcedure.input(z2.object({ profileId: z2.number() })).mutation(async ({ ctx, input }) => {
      const profile = await getBirthProfileById(input.profileId, ctx.user.id);
      if (!profile) {
        throw new Error("Profile not found");
      }
      const localBirthData = {
        date: profile.birthDate,
        // YYYY-MM-DD
        time: profile.birthTime,
        // HH:MM:SS
        latitude: parseFloat(profile.latitude),
        longitude: parseFloat(profile.longitude),
        timezone: parseFloat(profile.timezoneOffset),
        ayanamsa: profile.ayanamsa,
        placeName: profile.birthPlace
      };
      const fullChartData = await generateFullChartData(localBirthData);
      await updateBirthProfile(input.profileId, ctx.user.id, {
        chartData: fullChartData,
        dashaData: fullChartData.dashas
      });
      return { chartData: fullChartData };
    })
  }),
  // Chart Analysis router
  chart: router({
    // Generate chart for guest users using local calculations (no database save)
    generateGuest: publicProcedure.input(z2.object({
      birthDate: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
      birthTime: z2.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be HH:MM or HH:MM:SS"),
      birthPlace: z2.string(),
      latitude: z2.number().min(-90).max(90),
      longitude: z2.number().min(-180).max(180),
      timezoneOffset: z2.number(),
      ayanamsa: z2.enum(["lahiri", "raman", "krishnamurti"]).optional().default("lahiri")
    })).mutation(async ({ input }) => {
      const birthTime = input.birthTime.includes(":") && input.birthTime.split(":").length === 2 ? `${input.birthTime}:00` : input.birthTime;
      const localBirthData = {
        date: input.birthDate,
        time: birthTime,
        latitude: input.latitude,
        longitude: input.longitude,
        timezone: input.timezoneOffset,
        ayanamsa: input.ayanamsa,
        placeName: input.birthPlace
      };
      try {
        const fullChartData = await generateFullChartData(localBirthData);
        return fullChartData;
      } catch (error) {
        console.error("[Chart Generation Error]", error);
        throw new Error("Failed to generate chart. Please check the logs.");
      }
    }),
    // Get full chart analysis for a profile
    analyze: protectedProcedure.input(z2.object({ profileId: z2.number() })).query(async ({ ctx, input }) => {
      const profile = await getBirthProfileById(input.profileId, ctx.user.id);
      if (!profile) {
        throw new Error("Profile not found");
      }
      const localBirthData = {
        date: profile.birthDate,
        time: profile.birthTime,
        latitude: parseFloat(profile.latitude),
        longitude: parseFloat(profile.longitude),
        timezone: parseFloat(profile.timezoneOffset),
        ayanamsa: profile.ayanamsa,
        placeName: profile.birthPlace
      };
      const fullChartData = await generateFullChartData(localBirthData);
      return fullChartData;
    }),
    // Get current dasha for a profile
    currentDasha: protectedProcedure.input(z2.object({ profileId: z2.number() })).query(async ({ ctx, input }) => {
      const profile = await getBirthProfileById(input.profileId, ctx.user.id);
      if (!profile) {
        throw new Error("Profile not found");
      }
      if (profile.dashaData) {
        return getCurrentDasha(profile.dashaData);
      }
      const localBirthData = {
        date: profile.birthDate,
        time: profile.birthTime,
        latitude: parseFloat(profile.latitude),
        longitude: parseFloat(profile.longitude),
        timezone: parseFloat(profile.timezoneOffset),
        ayanamsa: profile.ayanamsa,
        placeName: profile.birthPlace
      };
      const fullChartData = await generateFullChartData(localBirthData);
      return fullChartData.currentDasha;
    }),
    // Get Master Framework Analysis
    getMasterAnalysis: protectedProcedure.input(z2.object({ profileId: z2.number() })).query(async ({ ctx, input }) => {
      const profile = await getBirthProfileById(input.profileId, ctx.user.id);
      if (!profile) {
        throw new Error("Profile not found");
      }
      const localBirthData = {
        date: profile.birthDate,
        time: profile.birthTime,
        latitude: parseFloat(profile.latitude),
        longitude: parseFloat(profile.longitude),
        timezone: parseFloat(profile.timezoneOffset),
        ayanamsa: profile.ayanamsa,
        placeName: profile.birthPlace
      };
      const fullChartData = await generateFullChartData(localBirthData);
      return generateMasterAnalysis(fullChartData);
    }),
    // Get Master Framework Analysis for GUESTS (No DB)
    getGuestMasterAnalysis: publicProcedure.input(z2.object({
      birthDate: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
      birthTime: z2.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be HH:MM or HH:MM:SS"),
      birthPlace: z2.string(),
      latitude: z2.number().min(-90).max(90),
      longitude: z2.number().min(-180).max(180),
      timezoneOffset: z2.number(),
      ayanamsa: z2.enum(["lahiri", "raman", "krishnamurti"]).optional().default("lahiri")
    })).query(async ({ input }) => {
      const birthTime = input.birthTime.includes(":") && input.birthTime.split(":").length === 2 ? `${input.birthTime}:00` : input.birthTime;
      const localBirthData = {
        date: input.birthDate,
        time: birthTime,
        latitude: input.latitude,
        longitude: input.longitude,
        timezone: input.timezoneOffset,
        ayanamsa: input.ayanamsa,
        placeName: input.birthPlace
      };
      const fullChartData = await generateFullChartData(localBirthData);
      return generateMasterAnalysis(fullChartData);
    })
  }),
  // Career Pathfinder router
  career: router({
    // Get career profile based on chart
    getProfile: protectedProcedure.input(z2.object({ profileId: z2.number() })).query(async ({ ctx, input }) => {
      const profile = await getBirthProfileById(input.profileId, ctx.user.id);
      if (!profile || !profile.chartData) {
        throw new Error("Profile or chart data not found");
      }
      const chartData = profile.chartData;
      return generateCareerProfile(chartData);
    }),
    // Get career recommendations
    getRecommendations: protectedProcedure.input(z2.object({
      profileId: z2.number(),
      limit: z2.number().optional().default(10)
    })).query(async ({ ctx, input }) => {
      const profile = await getBirthProfileById(input.profileId, ctx.user.id);
      if (!profile || !profile.chartData) {
        throw new Error("Profile or chart data not found");
      }
      const chartData = profile.chartData;
      const careerProfile = generateCareerProfile(chartData);
      const occupations2 = await getOccupations();
      const occupationData = occupations2.map((o) => ({
        id: o.id,
        title: o.title,
        category: o.description || "General",
        skills: o.skills || [],
        interests: o.interests || {},
        primaryPlanets: o.primaryPlanets || []
      }));
      const matches = getTopCareerMatches(careerProfile, input.limit);
      const timingInsights = getCareerTimingInsights(chartData);
      return { matches, timingInsights };
    }),
    // Get career categories
    getCategories: publicProcedure.query(async () => {
      return getCareerCategories();
    }),
    // Get occupations by category
    getOccupations: publicProcedure.input(z2.object({ categoryId: z2.number().optional() })).query(async ({ input }) => {
      return getOccupations(input.categoryId);
    })
  }),
  // Income Streams router
  income: router({
    // Get all income streams
    list: publicProcedure.input(z2.object({ category: z2.string().optional() })).query(async ({ input }) => {
      return getIncomeStreams(input.category);
    }),
    // Get income stream recommendations
    getRecommendations: protectedProcedure.input(z2.object({
      profileId: z2.number(),
      limit: z2.number().optional().default(5)
    })).query(async ({ ctx, input }) => {
      const profile = await getBirthProfileById(input.profileId, ctx.user.id);
      if (!profile || !profile.chartData) {
        throw new Error("Profile or chart data not found");
      }
      const chartData = profile.chartData;
      const careerProfile = generateCareerProfile(chartData);
      const recommendations = getIncomeStreamRecommendations(careerProfile, chartData, input.limit);
      return recommendations;
    })
  }),
  // AI Router
  ai: router({
    validateCareer: publicProcedure.input(z2.object({
      profileId: z2.number().optional(),
      chartData: z2.any().optional(),
      currentRole: z2.string(),
      targetRole: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      let chartData;
      if (input.chartData) {
        chartData = input.chartData;
      } else if (input.profileId && ctx.user) {
        const profile = await getBirthProfileById(input.profileId, ctx.user.id);
        if (!profile || !profile.chartData) {
          throw new Error("Profile or chart data not found");
        }
        chartData = profile.chartData;
      } else {
        throw new Error("Either profileId regarding an authenticated session or chartData is required");
      }
      const careerProfile = generateCareerProfile(chartData);
      const profileContext = {
        dominantPlanets: careerProfile.dominantPlanets,
        strongHouses: careerProfile.strongHouses,
        hollandCodes: careerProfile.hollandCodes,
        skills: careerProfile.skills,
        planetsD1: chartData.d1.planets.map((p) => ({
          planet: p.planet,
          house: p.house,
          sign: p.sign
        })),
        currentDasha: chartData.currentDasha.mahadasha
      };
      return await AiService.validateCareerPath(
        profileContext,
        // The service prompt will use these extra fields if we update it
        input.currentRole,
        input.targetRole
      );
    }),
    expandCareerList: publicProcedure.input(z2.object({
      profileId: z2.number().optional(),
      chartData: z2.any().optional()
    })).mutation(async ({ ctx, input }) => {
      let chartData;
      if (input.chartData) {
        chartData = input.chartData;
      } else if (input.profileId && ctx.user) {
        const profile = await getBirthProfileById(input.profileId, ctx.user.id);
        if (!profile || !profile.chartData) {
          throw new Error("Profile or chart data not found");
        }
        chartData = profile.chartData;
      } else {
        throw new Error("Either profileId regarding an authenticated session or chartData is required");
      }
      const careerProfile = generateCareerProfile(chartData);
      const planets = careerProfile.dominantPlanets.slice(0, 3);
      return await AiService.generateCareerCandidates(planets);
    }),
    validateBusiness: publicProcedure.input(z2.object({
      profileId: z2.number().optional(),
      chartData: z2.any().optional(),
      birthData: z2.any().optional(),
      businessIdea: z2.string().min(3)
    })).mutation(async ({ ctx, input }) => {
      let chartData;
      if (input.birthData) {
        console.log("[AI] Generating chart data from birthData on server for validation...");
        const serverBirthData = {
          date: input.birthData.birthDate,
          time: input.birthData.birthTime,
          latitude: input.birthData.latitude,
          longitude: input.birthData.longitude,
          timezone: input.birthData.timezoneOffset || 0,
          ayanamsa: input.birthData.ayanamsa || "lahiri",
          placeName: input.birthData.birthPlace
        };
        chartData = await generateFullChartData(serverBirthData, true);
      } else if (input.chartData) {
        chartData = input.chartData;
      } else if (input.profileId && ctx.user) {
        const profile = await getBirthProfileById(input.profileId, ctx.user.id);
        if (!profile || !profile.chartData) {
          throw new Error("Profile or chart data not found");
        }
        chartData = profile.chartData;
      } else {
        throw new Error("Either profileId, chartData, or birthData is required");
      }
      const careerProfile = generateCareerProfile(chartData);
      console.log(`[AI] Validating business idea: "${input.businessIdea}"`);
      const fullAnalysis = generateMasterAnalysis(chartData);
      const profileContext = {
        ascendant: chartData.d1.ascendant.sign,
        moonSign: chartData.d1.planets.find((p) => p.planet === "Moon")?.sign,
        dominantPlanets: careerProfile.dominantPlanets,
        currentDasha: chartData.currentDasha.mahadasha,
        currentAntardasha: chartData.currentDasha.antardasha,
        currentPratyantardasha: chartData.currentDasha.pratyantardasha,
        currentSookshmadasha: chartData.currentDasha.sookshmadasha,
        currentPraanadasha: chartData.currentDasha.praanadasha,
        mahadashaDetails: pruneDashaTree(
          chartData.dashas.find((d) => d.planet === chartData.currentDasha.mahadasha),
          /* @__PURE__ */ new Date()
        ),
        orientation: fullAnalysis.orientation,
        wealth: fullAnalysis.wealth,
        charts: {
          d1: chartData.d1.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign, isExalted: p.sign === "Aries" && p.planet === "Sun" || p.sign === "Taurus" && p.planet === "Moon" || p.sign === "Capricorn" && p.planet === "Mars" || p.sign === "Virgo" && p.planet === "Mercury" || p.sign === "Cancer" && p.planet === "Jupiter" || p.sign === "Pisces" && p.planet === "Venus" || p.sign === "Libra" && p.planet === "Saturn" })),
          d2: chartData.d2?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign })),
          d4: chartData.d4?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign })),
          d7: chartData.d7?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign })),
          d9: chartData.d9?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign })),
          d10: chartData.d10?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign })),
          d11: chartData.d11?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign })),
          // If D11 added later
          d60: chartData.d60?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign }))
        }
      };
      return await AiService.validateBusinessIdea(profileContext, input.businessIdea);
    }),
    getSwotAnalysis: publicProcedure.input(z2.object({
      profileId: z2.number().optional(),
      chartData: z2.any().optional()
    })).mutation(async ({ ctx, input }) => {
      let chartData;
      if (input.chartData) {
        chartData = input.chartData;
      } else if (input.profileId && ctx.user) {
        const profile = await getBirthProfileById(input.profileId, ctx.user.id);
        if (!profile || !profile.chartData) {
          throw new Error("Profile or chart data not found");
        }
        chartData = profile.chartData;
      } else {
        throw new Error("Either profileId or chartData is required");
      }
      const fullAnalysis = generateMasterAnalysis(chartData);
      const profileContext = {
        ascendant: chartData.d1.ascendant.sign,
        drivingPlanet: fullAnalysis.orientation.drivingPlanet
      };
      return await AiService.generateSwotStrategy(profileContext, fullAnalysis.swot);
    }),
    getWealthNarrative: publicProcedure.input(z2.object({
      profileId: z2.number().optional(),
      chartData: z2.any().optional()
    })).mutation(async ({ ctx, input }) => {
      let chartData;
      if (input.chartData) {
        chartData = input.chartData;
      } else if (input.profileId && ctx.user) {
        const profile = await getBirthProfileById(input.profileId, ctx.user.id);
        if (!profile || !profile.chartData) {
          throw new Error("Profile or chart data not found");
        }
        chartData = profile.chartData;
      } else {
        throw new Error("Either profileId or chartData is required");
      }
      const careerProfile = generateCareerProfile(chartData);
      const fullAnalysis = generateMasterAnalysis(chartData);
      const profileContext = {
        ascendant: chartData.d1.ascendant.sign,
        moonSign: chartData.d1.planets.find((p) => p.planet === "Moon")?.sign,
        dominantPlanets: careerProfile.dominantPlanets
      };
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      const futureEvents = fullAnalysis.timing.maturityEvents.filter((e) => e.year >= currentYear).slice(0, 10);
      return await AiService.generateWealthNarrative(profileContext, fullAnalysis.wealth, futureEvents);
    }),
    chat: publicProcedure.input(z2.object({
      profileId: z2.number().optional(),
      birthData: z2.any().optional(),
      message: z2.string(),
      history: z2.array(z2.object({
        role: z2.enum(["user", "model"]),
        content: z2.string()
      })).optional().default([])
    })).mutation(async ({ ctx, input }) => {
      let chartData;
      if (input.birthData) {
        const b = input.birthData;
        const serverBirthData = {
          date: b.birthDate,
          time: b.birthTime,
          latitude: b.latitude,
          longitude: b.longitude,
          timezone: b.timezoneOffset || 0,
          ayanamsa: b.ayanamsa || "lahiri",
          placeName: b.birthPlace
        };
        chartData = await generateFullChartData(serverBirthData, true);
      } else if (input.profileId && ctx.user) {
        const profile = await getBirthProfileById(input.profileId, ctx.user.id);
        if (!profile) {
          throw new Error("Profile not found");
        }
        const birthData = {
          date: profile.birthDate,
          time: profile.birthTime,
          latitude: parseFloat(profile.latitude),
          longitude: parseFloat(profile.longitude),
          timezone: parseFloat(profile.timezoneOffset),
          ayanamsa: profile.ayanamsa,
          placeName: profile.birthPlace
        };
        chartData = await generateFullChartData(birthData, true);
      } else {
        throw new Error("Profile ID or Birth Data required");
      }
      const careerProfile = generateCareerProfile(chartData);
      const fullAnalysis = generateMasterAnalysis(chartData);
      const profileContext = {
        ascendant: chartData.d1.ascendant.sign,
        moonSign: chartData.d1.planets.find((p) => p.planet === "Moon")?.sign,
        dominantPlanets: careerProfile.dominantPlanets,
        currentDasha: chartData.currentDasha.mahadasha,
        currentAntardasha: chartData.currentDasha.antardasha,
        currentPratyantardasha: chartData.currentDasha.pratyantardasha,
        currentSookshmadasha: chartData.currentDasha.sookshmadasha,
        currentPraanadasha: chartData.currentDasha.praanadasha,
        // Provide sub-periods of the current Mahadasha (includes Antar, Pratyantar, Sookshma, Praana)
        mahadashaDetails: pruneDashaTree(
          chartData.dashas.find((d) => d.planet === chartData.currentDasha.mahadasha),
          /* @__PURE__ */ new Date()
        ),
        orientation: fullAnalysis.orientation,
        wealth: fullAnalysis.wealth,
        // All Divisional Charts for complete analysis
        charts: {
          d1: chartData.d1.planets.map((p) => ({
            planet: p.planet,
            house: p.house,
            sign: p.sign,
            degree: p.degree,
            minute: p.minute,
            isRetrograde: p.isRetrograde,
            nakshatra: p.nakshatra,
            // D1 specific
            dignity: getPlanetDignity(p.planet, p.sign)
          })),
          d2: chartData.d2?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign, degree: p.degree, minute: p.minute, isRetrograde: p.isRetrograde, dignity: getPlanetDignity(p.planet, p.sign) })),
          d3: chartData.d3?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign, degree: p.degree, minute: p.minute, isRetrograde: p.isRetrograde, dignity: getPlanetDignity(p.planet, p.sign) })),
          d4: chartData.d4?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign, degree: p.degree, minute: p.minute, isRetrograde: p.isRetrograde, dignity: getPlanetDignity(p.planet, p.sign) })),
          d7: chartData.d7?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign, degree: p.degree, minute: p.minute, isRetrograde: p.isRetrograde, dignity: getPlanetDignity(p.planet, p.sign) })),
          d8: chartData.d8?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign, degree: p.degree, minute: p.minute, isRetrograde: p.isRetrograde, dignity: getPlanetDignity(p.planet, p.sign) })),
          d9: chartData.d9?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign, degree: p.degree, minute: p.minute, isRetrograde: p.isRetrograde, dignity: getPlanetDignity(p.planet, p.sign) })),
          d10: chartData.d10?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign, degree: p.degree, minute: p.minute, isRetrograde: p.isRetrograde, dignity: getPlanetDignity(p.planet, p.sign) })),
          d12: chartData.d12?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign, degree: p.degree, minute: p.minute, isRetrograde: p.isRetrograde, dignity: getPlanetDignity(p.planet, p.sign) })),
          d16: chartData.d16?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign, degree: p.degree, minute: p.minute, isRetrograde: p.isRetrograde, dignity: getPlanetDignity(p.planet, p.sign) })),
          d24: chartData.d24?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign, degree: p.degree, minute: p.minute, isRetrograde: p.isRetrograde, dignity: getPlanetDignity(p.planet, p.sign) })),
          d60: chartData.d60?.planets.map((p) => ({ planet: p.planet, house: p.house, sign: p.sign, degree: p.degree, minute: p.minute, isRetrograde: p.isRetrograde, dignity: getPlanetDignity(p.planet, p.sign) }))
        }
      };
      return await AiService.chatWithCounselor(profileContext, input.message, input.history);
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/app.ts
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(`[API Request] ${req.method} ${req.path}`);
  }
  next();
});
registerOAuthRoutes(app);
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);

// server/_core/vite.ts
import express2 from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path3 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path2.resolve(import.meta.dirname),
  root: path2.resolve(import.meta.dirname, "client"),
  publicDir: path2.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = process.env.NODE_ENV === "development" ? path3.resolve(import.meta.dirname, "../..", "dist") : path3.resolve(import.meta.dirname, "..", "dist");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const server = createServer(app);
  console.log(`[Server] NODE_ENV is: '${process.env.NODE_ENV}'`);
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Starting in Development Mode (Vite)");
    await setupVite(app, server);
  } else {
    console.log("[Server] Starting in Production Mode (Static)");
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
