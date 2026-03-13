import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, aiPublicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { supabaseAdmin } from "./_core/supabase";
import { sdk } from "./_core/sdk";
import { generateFullChartData, pruneDashaTree, type BirthData, getCurrentDasha as getLocalCurrentDasha, getPlanetDignity } from "./astro/calculations";
import { generateCareerProfile, getTopCareerMatches, getIncomeStreamRecommendations, getCareerTimingInsights } from "./astro/careerMapping";
import { generateMasterAnalysis } from "./astro/analyzer";
// Google Maps for geo-location
import { geocodeAddress } from "./services/googleMaps";
import { AiService } from "./services/ai";
import { chatRouter } from "./chat_router";
import { ENV } from "./_core/env";

// ============================================
// INPUT SCHEMAS
// ============================================

const birthDataSchema = z.object({
  profileName: z.string().optional().default("My Profile"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  birthTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be HH:MM or HH:MM:SS"),
  birthPlace: z.string().min(1, "Birth place is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string(),
  timezoneOffset: z.number(),
  ayanamsa: z.enum(["lahiri", "raman", "krishnamurti"]).optional().default("lahiri"),
  isPrimary: z.boolean().optional().default(false),
});

// ============================================
// ROUTERS
// ============================================

export const appRouter = router({
  system: systemRouter,
  chat: chatRouter,

  // Auth router
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req as any);
      (ctx.res as any).clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    loginWithSupabase: publicProcedure
      .input(z.object({ accessToken: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // 0. Check Environment
        console.log('[Auth] Supabase URL present:', !!ENV.supabaseUrl);
        console.log('[Auth] Supabase Service Role Key present:', !!ENV.supabaseServiceRoleKey);
        console.log('[Auth] Database URL present:', !!ENV.databaseUrl);

        // 1. Verify token with Supabase
        if (!supabaseAdmin || !ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
          console.error('[Auth] ❌ supabaseAdmin client or keys are NOT initialized');
          console.error('[Auth]   - URL:', !!ENV.supabaseUrl);
          console.error('[Auth]   - Key:', !!ENV.supabaseServiceRoleKey);
          throw new Error("Server authentication service is temporarily unavailable (Client Init Failed)");
        }

        try {
          console.log('[Auth] Step 1: Verifying token with Supabase...');
          const { data: { user }, error } = await supabaseAdmin.auth.getUser(input.accessToken);

          if (error) {
            console.error('[Auth] ❌ Supabase token verification failed:', error.message);
            throw new Error(`Supabase verification error: ${error.message}`);
          }

          if (!user) {
            console.error('[Auth] ❌ Supabase verification returned no user');
            throw new Error("Invalid session: No user identified by Supabase");
          }

          console.log('[Auth] ✅ Supabase user verified successfully');
          console.log('[Auth]   - User ID:', user.id);
          console.log('[Auth]   - Email:', user.email);

          const openId = user.id;
          const email = user.email;
          const name = user.user_metadata?.full_name || user.user_metadata?.name || email?.split('@')[0] || "User";
          console.log('[Auth]   - Display Name:', name);

          // 2. Sync to our database
          console.log('[Auth] Step 2: Upserting user to database...');
          console.log('[Auth]   - OpenID:', openId);
          await db.upsertUser({
            openId,
            name,
            email: email ?? null,
            loginMethod: "google",
            lastSignedIn: new Date(),
          });
          console.log('[Auth] ✅ User upserted to database');

          // 2.5. Verify user was created/updated
          console.log('[Auth] Step 2.5: Verifying user record in database...');
          const dbUser = await db.getUserByOpenId(openId);
          if (!dbUser) {
            console.error('[Auth] ❌ User verification failed - user not found in database after upsert');
            throw new Error("Failed to create user record in database");
          }
          console.log('[Auth] ✅ User verified in database');
          console.log('[Auth]   - DB User ID:', dbUser.id);
          console.log('[Auth]   - DB User Name:', dbUser.name);
          console.log('[Auth]   - DB User Email:', dbUser.email);

          // 3. Create our session token
          console.log('[Auth] Step 3: Generating application session token...');
          const sessionToken = await sdk.createSessionToken(openId, {
            name,
            expiresInMs: ONE_YEAR_MS,
          });
          console.log('[Auth] ✅ Session token generated');
          console.log('[Auth]   - Token length:', sessionToken.length);

          // 4. Set cookie
          console.log('[Auth] Step 4: Setting session cookie...');
          const cookieOptions = getSessionCookieOptions(ctx.req as any);
          console.log('[Auth]   - Cookie name:', COOKIE_NAME);
          console.log('[Auth]   - Cookie options:', JSON.stringify(cookieOptions, null, 2));
          (ctx.res as any).cookie(COOKIE_NAME, sessionToken, {
            ...cookieOptions,
            maxAge: ONE_YEAR_MS
          });
          console.log('[Auth] ✅ Session cookie set');

          console.log('[Auth] ==================== LOGIN SUCCESSFUL ====================');
          console.log('[Auth] Returning user data to frontend');

          // Return more data to frontend for verification
          return {
            success: true,
            user: {
              id: dbUser.id,
              openId: dbUser.openId,
              name: dbUser.name,
              email: dbUser.email
            }
          };
        } catch (innerError: any) {
          console.error('[Auth] ❌ ==================== LOGIN FAILED ====================');
          console.error('[Auth] Error:', innerError);
          console.error('[Auth] Stack:', innerError.stack);
          throw new Error(innerError.message || "Failed to synchronize application session");
        }
      }),
  }),

  // Geo-location router
  geo: router({
    getLocation: publicProcedure
      .input(z.object({ location: z.string() }))
      .query(async ({ input }) => {
        try {
          // Uses Google Maps with fallback to Free Astrology API
          const geoData = await geocodeAddress(input.location);
          return {
            placeName: geoData.placeName,
            latitude: geoData.latitude,
            longitude: geoData.longitude,
            timezone: geoData.timezone,
            timezoneOffset: geoData.timezoneOffset,
            formattedAddress: geoData.formattedAddress,
          };
        } catch (error: any) {
          throw new Error(`Failed to get location: ${error.message}`);
        }
      }),
  }),

  // Birth Profile router
  profile: router({
    // Create a new birth profile
    create: protectedProcedure
      .input(birthDataSchema)
      .mutation(async ({ ctx, input }) => {
        const birthTime = input.birthTime.includes(":") && input.birthTime.split(":").length === 2
          ? `${input.birthTime}:00`
          : input.birthTime;

        // Use local calculations for accurate chart generation
        const localBirthData: BirthData = {
          date: input.birthDate, // YYYY-MM-DD
          time: birthTime, // HH:MM:SS
          latitude: input.latitude,
          longitude: input.longitude,
          timezone: input.timezoneOffset,
          ayanamsa: input.ayanamsa,
          placeName: input.birthPlace
        };

        // Generate complete chart using local calculations
        const fullChartData = await generateFullChartData(localBirthData);

        // Save to database
        const profileId = await db.createBirthProfile({
          userId: ctx.user.id,
          profileName: input.profileName,
          birthDate: input.birthDate,
          birthTime: birthTime,
          birthPlace: input.birthPlace,
          latitude: input.latitude.toString(),
          longitude: input.longitude.toString(),
          timezone: input.timezone,
          timezoneOffset: input.timezoneOffset.toString(),
          ayanamsa: input.ayanamsa,
          chartData: fullChartData,
          dashaData: fullChartData.dashas,
          isPrimary: input.isPrimary,
        });

        return { profileId, chartData: fullChartData };
      }),

    // Get all profiles for current user
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getBirthProfilesByUser(ctx.user.id);
    }),

    // Get a specific profile with full chart data
    get: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getBirthProfileById(input.profileId, ctx.user.id);
        if (!profile) {
          throw new Error("Profile not found");
        }
        return profile;
      }),

    // Set a profile as primary
    setPrimary: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.setPrimaryProfile(input.profileId, ctx.user.id);
        return { success: true };
      }),

    // Delete a profile
    delete: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteBirthProfile(input.profileId, ctx.user.id);
        return { success: true };
      }),

    // Recalculate chart for a profile using local calculations
    recalculate: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getBirthProfileById(input.profileId, ctx.user.id);
        if (!profile) {
          throw new Error("Profile not found");
        }

        const localBirthData: BirthData = {
          date: profile.birthDate, // YYYY-MM-DD
          time: profile.birthTime, // HH:MM:SS
          latitude: parseFloat(profile.latitude),
          longitude: parseFloat(profile.longitude),
          timezone: parseFloat(profile.timezoneOffset),
          ayanamsa: profile.ayanamsa as "lahiri" | "raman" | "krishnamurti",
          placeName: profile.birthPlace
        };

        const fullChartData = await generateFullChartData(localBirthData);

        await db.updateBirthProfile(input.profileId, ctx.user.id, {
          chartData: fullChartData,
          dashaData: fullChartData.dashas,
        });

        return { chartData: fullChartData };
      }),
  }),

  // Chart Analysis router
  chart: router({
    // Generate chart for guest users using local calculations (no database save)
    generateGuest: publicProcedure
      .input(z.object({
        birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
        birthTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be HH:MM or HH:MM:SS"),
        birthPlace: z.string(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        timezoneOffset: z.number(),
        ayanamsa: z.enum(["lahiri", "raman", "krishnamurti"]).optional().default("lahiri"),
      }))
      .mutation(async ({ input }) => {
        const birthTime = input.birthTime.includes(":") && input.birthTime.split(":").length === 2
          ? `${input.birthTime}:00`
          : input.birthTime;

        const localBirthData: BirthData = {
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
    analyze: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getBirthProfileById(input.profileId, ctx.user.id);
        if (!profile) {
          throw new Error("Profile not found");
        }

        const localBirthData: BirthData = {
          date: profile.birthDate,
          time: profile.birthTime,
          latitude: parseFloat(profile.latitude),
          longitude: parseFloat(profile.longitude),
          timezone: parseFloat(profile.timezoneOffset),
          ayanamsa: profile.ayanamsa as "lahiri" | "raman" | "krishnamurti",
          placeName: profile.birthPlace
        };

        const fullChartData = await generateFullChartData(localBirthData);

        return fullChartData;
      }),


    // Get current dasha for a profile
    currentDasha: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getBirthProfileById(input.profileId, ctx.user.id);
        if (!profile) {
          throw new Error("Profile not found");
        }

        // Use cached dasha data if available
        if (profile.dashaData) {
          return getLocalCurrentDasha(profile.dashaData as any);
        }

        // Otherwise regenerate from birth data
        const localBirthData: BirthData = {
          date: profile.birthDate,
          time: profile.birthTime,
          latitude: parseFloat(profile.latitude),
          longitude: parseFloat(profile.longitude),
          timezone: parseFloat(profile.timezoneOffset),
          ayanamsa: profile.ayanamsa as "lahiri" | "raman" | "krishnamurti",
          placeName: profile.birthPlace
        };

        const fullChartData = await generateFullChartData(localBirthData);
        return fullChartData.currentDasha;
      }),

    // Get Master Framework Analysis
    getMasterAnalysis: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getBirthProfileById(input.profileId, ctx.user.id);
        if (!profile) {
          throw new Error("Profile not found");
        }

        const localBirthData: BirthData = {
          date: profile.birthDate,
          time: profile.birthTime,
          latitude: parseFloat(profile.latitude),
          longitude: parseFloat(profile.longitude),
          timezone: parseFloat(profile.timezoneOffset),
          ayanamsa: profile.ayanamsa as "lahiri" | "raman" | "krishnamurti",
          placeName: profile.birthPlace
        };

        const fullChartData = await generateFullChartData(localBirthData);
        // Add D8 if missing (should be added by generateFullChartData now)
        return generateMasterAnalysis(fullChartData);
      }),

    // Get Master Framework Analysis for GUESTS (No DB)
    getGuestMasterAnalysis: publicProcedure
      .input(z.object({
        birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
        birthTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be HH:MM or HH:MM:SS"),
        birthPlace: z.string(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        timezoneOffset: z.number(),
        ayanamsa: z.enum(["lahiri", "raman", "krishnamurti"]).optional().default("lahiri"),
      }))
      .query(async ({ input }) => {
        const birthTime = input.birthTime.includes(":") && input.birthTime.split(":").length === 2
          ? `${input.birthTime}:00`
          : input.birthTime;

        const localBirthData: BirthData = {
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
      }),
  }),

  // Career Pathfinder router
  career: router({
    // Get career profile based on chart
    getProfile: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getBirthProfileById(input.profileId, ctx.user.id);
        if (!profile || !profile.chartData) {
          throw new Error("Profile or chart data not found");
        }

        const chartData = profile.chartData as any;
        return generateCareerProfile(chartData);
      }),

    // Get career recommendations
    getRecommendations: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        limit: z.number().optional().default(10)
      }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getBirthProfileById(input.profileId, ctx.user.id);
        if (!profile || !profile.chartData) {
          throw new Error("Profile or chart data not found");
        }

        const chartData = profile.chartData as any;
        const careerProfile = generateCareerProfile(chartData);

        // Get occupations from database
        const occupations = await db.getOccupations();

        // Map to expected format
        const occupationData = occupations.map(o => ({
          id: o.id,
          title: o.title,
          category: o.description || "General",
          skills: (o.skills as string[]) || [],
          interests: (o.interests as Record<string, number>) || {},
          primaryPlanets: (o.primaryPlanets as string[]) || [],
        }));

        const matches = getTopCareerMatches(careerProfile, input.limit);
        const timingInsights = getCareerTimingInsights(chartData);

        return { matches, timingInsights };
      }),

    // Get career categories
    getCategories: publicProcedure.query(async () => {
      return db.getCareerCategories();
    }),

    // Get occupations by category
    getOccupations: publicProcedure
      .input(z.object({ categoryId: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getOccupations(input.categoryId);
      }),
  }),

  // Income Streams router
  income: router({
    // Get all income streams
    list: publicProcedure
      .input(z.object({ category: z.string().optional() }))
      .query(async ({ input }) => {
        return db.getIncomeStreams(input.category);
      }),

    // Get income stream recommendations
    getRecommendations: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        limit: z.number().optional().default(5)
      }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getBirthProfileById(input.profileId, ctx.user.id);
        if (!profile || !profile.chartData) {
          throw new Error("Profile or chart data not found");
        }

        const chartData = profile.chartData as any;
        const careerProfile = generateCareerProfile(chartData);

        const recommendations = getIncomeStreamRecommendations(careerProfile, chartData, input.limit);

        return recommendations;
      }),
  }),

  // AI Router
  ai: router({
    validateCareer: aiPublicProcedure
      .input(z.object({
        profileId: z.number().optional(),
        chartData: z.any().optional(),
        currentRole: z.string(),
        targetRole: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let chartData: any;

        if (input.chartData) {
          chartData = input.chartData;
        } else if (input.profileId && ctx.user) {
          const profile = await db.getBirthProfileById(input.profileId, ctx.user.id);
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
          planetsD1: chartData.d1.planets.map((p: any) => ({
            planet: p.planet,
            house: p.house,
            sign: p.sign
          })),
          currentDasha: chartData.currentDasha.mahadasha
        };

        return await AiService.validateCareerPath(
          profileContext as any, // The service prompt will use these extra fields if we update it
          input.currentRole,
          input.targetRole
        );
      }),

    expandCareerList: aiPublicProcedure
      .input(z.object({
        profileId: z.number().optional(),
        chartData: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let chartData: any;

        if (input.chartData) {
          chartData = input.chartData;
        } else if (input.profileId && ctx.user) {
          const profile = await db.getBirthProfileById(input.profileId, ctx.user.id);
          if (!profile || !profile.chartData) {
            throw new Error("Profile or chart data not found");
          }
          chartData = profile.chartData;
        } else {
          throw new Error("Either profileId regarding an authenticated session or chartData is required");
        }

        const careerProfile = generateCareerProfile(chartData);

        // Get planets with significant strength or key roles
        const planets = careerProfile.dominantPlanets.slice(0, 3);

        return await AiService.generateCareerCandidates(planets);
      }),

    validateBusiness: aiPublicProcedure
      .input(z.object({
        profileId: z.number().optional(),
        chartData: z.any().optional(),
        birthData: z.any().optional(),
        businessIdea: z.string().min(3),
      }))
      .mutation(async ({ ctx, input }) => {
        let chartData: any;

        if (input.birthData) {
          console.log("[AI] Generating chart data from birthData on server for validation...");
          const serverBirthData: BirthData = {
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
          const profile = await db.getBirthProfileById(input.profileId, ctx.user.id);
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
          moonSign: chartData.d1.planets.find((p: any) => p.planet === "Moon")?.sign,
          dominantPlanets: careerProfile.dominantPlanets,
          currentDasha: chartData.currentDasha.mahadasha,
          currentAntardasha: chartData.currentDasha.antardasha,
          currentPratyantardasha: chartData.currentDasha.pratyantardasha,
          currentSookshmadasha: chartData.currentDasha.sookshmadasha,
          currentPraanadasha: chartData.currentDasha.praanadasha,
          mahadashaDetails: pruneDashaTree(
            chartData.dashas.find((d: any) => d.planet === chartData.currentDasha.mahadasha),
            new Date()
          ),
          orientation: fullAnalysis.orientation,
          wealth: fullAnalysis.wealth,
          charts: {
            d1: chartData.d1.planets.map((p: any) => ({ planet: p.planet, house: p.house, sign: p.sign, isExalted: p.sign === "Aries" && p.planet === "Sun" || p.sign === "Taurus" && p.planet === "Moon" || p.sign === "Capricorn" && p.planet === "Mars" || p.sign === "Virgo" && p.planet === "Mercury" || p.sign === "Cancer" && p.planet === "Jupiter" || p.sign === "Pisces" && p.planet === "Venus" || p.sign === "Libra" && p.planet === "Saturn" })),
            d2: chartData.d2?.planets.map((p: any) => ({ planet: p.planet, house: p.house, sign: p.sign })),
            d4: chartData.d4?.planets.map((p: any) => ({ planet: p.planet, house: p.house, sign: p.sign })),
            d7: chartData.d7?.planets.map((p: any) => ({ planet: p.planet, house: p.house, sign: p.sign })),
            d9: chartData.d9?.planets.map((p: any) => ({ planet: p.planet, house: p.house, sign: p.sign })),
            d10: chartData.d10?.planets.map((p: any) => ({ planet: p.planet, house: p.house, sign: p.sign })),
            d11: (chartData as any).d11?.planets.map((p: any) => ({ planet: p.planet, house: p.house, sign: p.sign })), // If D11 added later
            d60: chartData.d60?.planets.map((p: any) => ({ planet: p.planet, house: p.house, sign: p.sign })),
          }
        };

        return await AiService.validateBusinessIdea(profileContext, input.businessIdea);
      }),

    getSwotAnalysis: aiPublicProcedure
      .input(z.object({
        profileId: z.number().optional(),
        chartData: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let chartData: any;

        if (input.chartData) {
          chartData = input.chartData;
        } else if (input.profileId && ctx.user) {
          const profile = await db.getBirthProfileById(input.profileId, ctx.user.id);
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

    getWealthNarrative: aiPublicProcedure
      .input(z.object({
        profileId: z.number().optional(),
        chartData: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let chartData: any;

        if (input.chartData) {
          chartData = input.chartData;
        } else if (input.profileId && ctx.user) {
          const profile = await db.getBirthProfileById(input.profileId, ctx.user.id);
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
          moonSign: chartData.d1.planets.find((p: any) => p.planet === "Moon")?.sign,
          dominantPlanets: careerProfile.dominantPlanets
        };

        // Filter for future events only to keep prompt clean
        const currentYear = new Date().getFullYear();
        const futureEvents = fullAnalysis.timing.maturityEvents
          .filter(e => e.year >= currentYear)
          .slice(0, 10); // Limit to top 10 future events

        return await AiService.generateWealthNarrative(profileContext, fullAnalysis.wealth, futureEvents);
      }),

    chat: aiPublicProcedure
      .input(z.object({
        profileId: z.number().optional(),
        birthData: z.any().optional(),
        message: z.string(),
        history: z.array(z.object({
          role: z.enum(["user", "model"]),
          content: z.string()
        })).optional().default([])
      }))
      .mutation(async ({ ctx, input }) => {
        let chartData: any;

        if (input.birthData) {
          // Guest user - regenerate from birth data
          const b = input.birthData;
          const serverBirthData: BirthData = {
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
          const profile = await db.getBirthProfileById(input.profileId, ctx.user.id);
          if (!profile) {
            throw new Error("Profile not found");
          }

          // Regenerate to ensure latest engine logic (5-level dashas, D4, D16, etc.) is used
          const birthData: BirthData = {
            date: profile.birthDate,
            time: profile.birthTime,
            latitude: parseFloat(profile.latitude),
            longitude: parseFloat(profile.longitude),
            timezone: parseFloat(profile.timezoneOffset),
            ayanamsa: profile.ayanamsa as any,
            placeName: profile.birthPlace
          };
          chartData = await generateFullChartData(birthData, true);
        } else {
          throw new Error("Profile ID or Birth Data required");
        }

        const careerProfile = generateCareerProfile(chartData);
        const fullAnalysis = generateMasterAnalysis(chartData);

        // Pass ALL Divisional Charts dynamicly
        const vargaCharts: any = {};
        // Iterate over all keys in chartData
        for (const key of Object.keys(chartData)) {
          // Check if it's a divisional chart (d1, d2, d3... d60)
          if (key.match(/^d\d+$/) && chartData[key]?.planets) {
            vargaCharts[key] = chartData[key].planets.map((p: any) => ({
              planet: p.planet,
              house: p.house,
              sign: p.sign,
              degree: p.degree,
              minute: p.minute,
              isRetrograde: p.isRetrograde,
              dignity: getPlanetDignity(p.planet, p.sign),
              nakshatra: p.nakshatra // Included for all, though mostly relevant for D1
            }));
          }
        }

        const profileContext = {
          ascendant: chartData.d1.ascendant.sign,
          moonSign: chartData.d1.planets.find((p: any) => p.planet === "Moon")?.sign,
          dominantPlanets: careerProfile.dominantPlanets,
          currentDasha: chartData.currentDasha.mahadasha,
          currentAntardasha: chartData.currentDasha.antardasha,
          currentPratyantardasha: chartData.currentDasha.pratyantardasha,
          currentSookshmadasha: chartData.currentDasha.sookshmadasha,
          currentPraanadasha: chartData.currentDasha.praanadasha,

          // Full Dasha Timeline
          dashas: chartData.dashas,

          // Detected Yogas
          yogas: chartData.yogas,

          // All Varga Charts
          charts: vargaCharts,

          // Still provide pre-calculated details if useful
          orientation: fullAnalysis.orientation,
          wealth: fullAnalysis.wealth,
          mahadashaDetails: pruneDashaTree(
            chartData.dashas.find((d: any) => d.planet === chartData.currentDasha.mahadasha),
            new Date()
          ),
        };

        return await AiService.chatWithCounselor(profileContext, input.message, input.history);
      }),
  }),
});

export type AppRouter = typeof appRouter;
