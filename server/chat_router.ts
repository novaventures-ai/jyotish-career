import { z } from "zod";
import * as db from "./db";
import { AiService } from "./services/ai";
import { protectedProcedure, router } from "./_core/trpc";
import { generateFullChartData, pruneDashaTree, BirthData, getPlanetDignity } from "./astro/calculations";
import { generateCareerProfile } from "./astro/careerMapping";
import { generateMasterAnalysis } from "./astro/analyzer";

export const chatRouter = router({
    // Create a new conversation
    create: protectedProcedure
        .input(z.object({
            title: z.string().optional(),
            profileId: z.number().optional()
        }))
        .mutation(async ({ ctx, input }) => {
            const title = input.title || "New Conversation";
            const id = await db.createConversation(ctx.user.id, title, input.profileId);
            return { id };
        }),

    // List all conversations for the user
    list: protectedProcedure.query(async ({ ctx }) => {
        return db.getConversationsByUser(ctx.user.id);
    }),

    // Get a specific conversation with messages
    get: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ ctx, input }) => {
            const conversation = await db.getConversationById(input.id, ctx.user.id);
            if (!conversation) {
                throw new Error("Conversation not found");
            }
            const messages = await db.getMessages(input.id);
            return { conversation, messages };
        }),

    // Send a message
    sendMessage: protectedProcedure
        .input(z.object({
            conversationId: z.number(),
            message: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                // 1. Verify Conversation
                const conversation = await db.getConversationById(input.conversationId, ctx.user.id);
                if (!conversation) {
                    throw new Error("Conversation not found");
                }

                // 2. Save User Message
                await db.addMessage(input.conversationId, "user", input.message);

                // 3. Prepare Context (Profile & Chart)
                let profile;
                if (conversation.profileId) {
                    profile = await db.getBirthProfileById(conversation.profileId, ctx.user.id);
                } else {
                    const profiles = await db.getBirthProfilesByUser(ctx.user.id);
                    profile = profiles.find(p => p.isPrimary) || profiles[0];
                }

                if (!profile) {
                    await db.addMessage(input.conversationId, "assistant", "Please create a birth profile first so I can analyze your chart.");
                    return { response: "Please create a birth profile first." };
                }

                // Generate Chart Data
                // Correct property names based on actual Profile type
                const birthData = {
                    date: profile.birthDate,
                    time: profile.birthTime,
                    latitude: parseFloat(profile.latitude),
                    longitude: parseFloat(profile.longitude),
                    timezone: parseFloat(profile.timezoneOffset),
                    ayanamsa: profile.ayanamsa as any,
                    placeName: profile.birthPlace
                };

                const chartData = await generateFullChartData(birthData, true);

                const careerProfile = generateCareerProfile(chartData);
                const fullAnalysis = generateMasterAnalysis(chartData);

                // 4. Prepare History
                const allMessages = await db.getMessages(input.conversationId);

                // Filter out the current message (last one) to avoid duplication in history passed to AI
                // NOTE: Using a short history (5 messages) for the current session for speed
                const historyMessages = allMessages
                    .slice(0, -1)
                    .slice(-5)
                    .map(msg => ({
                        role: msg.role === "assistant" ? "model" as const : "user" as const,
                        content: msg.content
                    }));

                // 5. Prepare Context Object
                const profileContext = {
                    ascendant: chartData.d1.ascendant.sign,
                    moonSign: chartData.d1.planets.find((p: any) => p.planet === "Moon")?.sign,
                    dominantPlanets: careerProfile.dominantPlanets,
                    currentDasha: chartData.currentDasha.mahadasha,
                    currentAntardasha: chartData.currentDasha.antardasha,
                    currentPratyantardasha: chartData.currentDasha.pratyantardasha,
                    currentSookshmadasha: chartData.currentDasha.sookshmadasha,
                    currentPraanadasha: chartData.currentDasha.praanadasha,

                    // Add basics from analysis
                    wealth: fullAnalysis.wealth,

                    charts: Object.keys(chartData).reduce((acc: any, key) => {
                        // Check if key is a divisional chart (d1, d2... d60) and has planets
                        if (key.match(/^d\d+$/) && (chartData as any)[key]?.planets) {
                            acc[key] = (chartData as any)[key].planets.map((p: any) => ({
                                ...p,
                                dignity: getPlanetDignity(p.planet, p.sign)
                            }));
                        }
                        return acc;
                    }, {})
                };

                // 6. Call AI
                const response = await AiService.chatWithCounselor(
                    profileContext,
                    input.message,
                    historyMessages
                );

                // 7. Save Assistant Message
                await db.addMessage(input.conversationId, "assistant", response);

                return { response };

            } catch (error: any) {
                console.error("[ChatRouter] FAILURE:", error);
                throw new Error(error.message || "Failed to process message");
            }
        }),

    // Rename conversation
    rename: protectedProcedure
        .input(z.object({
            id: z.number(),
            title: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            await db.updateConversation(input.id, ctx.user.id, { title: input.title });
            return { success: true };
        }),

    // Delete conversation
    delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            await db.deleteConversation(input.id, ctx.user.id);
            return { success: true };
        }),
});
