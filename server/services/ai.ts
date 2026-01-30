import { GoogleGenerativeAI } from "@google/generative-ai";
import { CareerProfile } from "../astro/careerMapping";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("GEMINI_API_KEY is not set in .env. AI features will be disabled.");
}

// Use gemini-2.5-flash (Requested by user, confirmed available)
const MODEL_NAME = "gemini-2.5-flash";
console.log(`[AI Service] Initializing Gemini model: ${MODEL_NAME}`);

const genAI = new GoogleGenerativeAI(API_KEY || "");

const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 8000,
    }
});

function extractJSON(text: string): any {
    try {
        // First try standard parsing
        return JSON.parse(text);
    } catch (e) {
        // Clean markdown code blocks
        let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

        // Remove/escape control characters that cause JSON parsing errors
        // Replace literal newlines, tabs, carriage returns with escaped versions
        cleaned = cleaned
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/\t/g, "\\t")
            // Remove other control characters (0x00-0x1F except valid whitespace)
            .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, "");

        try {
            return JSON.parse(cleaned);
        } catch (e2) {
            // Try finding the first { or [ and last } or ]
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
                } catch (e3: any) {
                    console.error("[AI Service] JSON parse error. Raw text:", text.substring(0, 500));
                    throw new Error("Found JSON structure but it is malformed: " + e3.message);
                }
            }
            throw new Error("Could not extract valid JSON from response");
        }
    }
}

async function callAi(prompt: string, errorContext: string): Promise<any> {
    if (!API_KEY) {
        throw new Error("AI Service not configured");
    }

    try {
        console.log(`[AI-Service] Sending request to Gemini (${errorContext})...`);

        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI Request Timed Out (50s)")), 50000)
        );

        const result = await Promise.race([
            model.generateContent(prompt),
            timeout
        ]) as any;

        console.log(`[AI-Service] Received response from Gemini (${errorContext}). Processing...`);

        const response = result.response;
        const text = response.text();

        console.log(`[AI-Service] Raw response length from ${errorContext}:`, text.length);

        return extractJSON(text);
    } catch (error: any) {
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

export interface ValidationResult {
    compatibilityScore: number;
    analysis: string;
    strategy: string[];
    smartPivot?: {
        suggestedRole: string;
        reason: string;
    };
}

export const AiService = {
    async validateBusinessIdea(
        profile: any,
        businessIdea: string
    ): Promise<{
        score: number;
        analysis: string;
        strengths: string[];
        challenges: string[];
        tips: string[];
    }> {
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
      ${profile.planetsD1?.map((p: any) => `- ${p.planet} in House ${p.house} (${p.sign}) ${p.isExalted ? "[EXALTED]" : ""}`).join("\n")}
      
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

    async generateSwotStrategy(
        profile: any,
        swotData: any
    ): Promise<{
        executiveSummary: string;
        keyInsight: string;
        strategicAdvice: string[];
    }> {
        const prompt = `
      You are an expert Strategic Consultant and Astrologer.
      Synthesize the following SWOT Analysis into a high-level "Executive Strategy".

      Profile Context:
      - Ascendant: ${profile.ascendant || "Unknown"}
      - Driving Planet: ${profile.drivingPlanet || "Unknown"}

      SWOT Data Highlights:
      - Strengths: ${JSON.stringify(swotData.strengths?.map((s: any) => s.title) || [])}
      - Weaknesses: ${JSON.stringify(swotData.weaknesses?.map((w: any) => w.title) || [])}
      - Opportunities: ${JSON.stringify(swotData.opportunities?.map((o: any) => o.title) || [])}
      - Threats: ${JSON.stringify(swotData.threats?.map((t: any) => t.title) || [])}

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

    async generateWealthNarrative(
        profile: any,
        wealthData: any,
        timingEvents: any[]
    ): Promise<{
        narrative: string;
        theme: string;
        milestones: { year: number; event: string }[];
    }> {
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
      ${timingEvents.map((e: any) => `- Year ${e.year}: ${e.title} (${e.type})`).join("\n")}

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

    async chatWithCounselor(
        profile: any,
        message: string,
        history: { role: "user" | "model"; content: string }[]
    ): Promise<string> {

        // Helper to format chart data for the prompt
        const formatChartsForPrompt = (charts: any) => {
            if (!charts) return "No divisional chart data available.";

            let output = "";
            const sortedKeys = Object.keys(charts).sort((a, b) => {
                // Sort by D number (d1, d2, d10, etc.)
                const numA = parseInt(a.replace('d', '')) || 0;
                const numB = parseInt(b.replace('d', '')) || 0;
                return numA - numB;
            });

            const chartNames: Record<string, string> = {
                d1: "D1 (Rashi - General Life)",
                d2: "D2 (Hora - Wealth)",
                d3: "D3 (Drekkana - Siblings/Effort)",
                d4: "D4 (Chaturthamsa - Property/Home)",
                d7: "D7 (Saptamsa - Children/Creativity)",
                d8: "D8 (Ashtamsha - Sudden Events/Legacy)",
                d9: "D9 (Navamsa - Inner Strength/Partnership)",
                d10: "D10 (Dasamsa - Career/Status)",
                d12: "D12 (Dwadasamsa - Parents/Ancestry)",
                d16: "D16 (Shodashamsa - Vehicles/Happiness)",
                d24: "D24 (Chaturvimshamsa - Education/Skills)",
                d60: "D60 (Shashtiamsa - Past Life/Karma)"
            };

            for (const key of sortedKeys) {
                const planets = charts[key];
                if (!Array.isArray(planets)) continue;

                const displayName = chartNames[key] || `${key.toUpperCase()} Chart`;
                output += `\n### ${displayName}:\n`;
                (planets as any[]).forEach(p => {
                    const dignity = (p.dignity && p.dignity !== "neutral") ? ` [${p.dignity.toUpperCase()}]` : "";
                    const retrograde = p.isRetrograde ? " (R)" : "";
                    const degreeInfo = p.degree !== undefined ? ` at ${p.degree}°${p.minute}'` : "";
                    const nakshatra = p.nakshatra ? ` [${p.nakshatra}]` : ""; // Only D1 has this usually

                    output += `- ${p.planet} in ${p.sign} (${p.house}H)${degreeInfo}${dignity}${retrograde}${nakshatra}\n`;
                });
            }
            return output;
        };

        const formattedCharts = formatChartsForPrompt(profile.charts);

        // Format Yogas
        const yogaText = (profile.yogas && Array.isArray(profile.yogas))
            ? profile.yogas.map((y: any) => `- **${y.name}** (${y.strength}): ${y.description}`).join("\n")
            : "No major yogas detected.";

        // Format Dasha Timeline (Simplified for prompt context)
        // We only show the current Mahadasha cycle to avoid overwhelming tokens
        const dashaText = profile.mahadashaDetails
            ? JSON.stringify(profile.mahadashaDetails, null, 2)
            : "Detailed timeline not available.";

        // Construct detailed system prompt
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
      
      ---
      ### DETAILED PLANETARY POSITIONS (ALL DIVISIONAL CHARTS)
      (NOTE: This data IS AVAILABLE. Do not claim it is missing. Analyze it deeply.)
      ${formattedCharts}
      
      ---
      ### YOGAS & COMBINATIONS
      ${yogaText}

      ---
      ### DASHA TIMELINE (Current Mahadasha Cycle)
      ${dashaText}
      
      CRITICAL INSTRUCTION: IF THE USER ASKS FOR D2/D9/ETC, LOOK AT THE SECTION ABOVE. THE DATA IS THERE. DO NOT SAY IT IS MISSING. CHECK "ALL DIVISIONAL CHARTS" SECTION.
      
      ---
      Career & Wealth Profile:
      - Career Orientation: ${profile.orientation?.type || "Unknown"}
      - Wealth Source: ${profile.wealth?.d2Source || "Unknown"}
      - Status (D10): ${profile.wealth?.d10Status || "Unknown"}

      IMPORTANT INSTRUCTIONS:
      1. **FULL ACCESS**: You have access to ALL Divisional Charts (D1-D60), Yogas, and Dasha details. USE THEM.
      2. **CROSS-EXAMINE**: Always validate D1 findings with the relevant Varga chart (e.g., D9 for strength, D10 for career, D4 for assets, D24 for skills).
      3. For TIMING questions (When?): You MUST look at the Sookshma and Praana dashas.
      4. For PROPERTY/HOME: Check D4.
      5. For WEALTH: Check D2 and D11 (Gains).
      6. For CAREER: Check D10.
      7. TONE: Be a supportive, wise guru. Explain WHY a planet is causing an effect using specific chart references (e.g., "Jupiter in your D9...").
      8. FORMATTING: Use Markdown. Bold names and dates.
      9. **Deterministic Analysis**: Never say "I don't have enough info". Use the patterns you see.
      
      Return ONLY a JSON object with this structure:
      {
        "response": "Your markdown-formatted astrological advice here"
      }
    `;

        // Format history for the prompt
        const conversationText = history
            .map(msg => `${msg.role === "user" ? "User" : "Astrologer"}: ${msg.content}`)
            .join("\n");

        const fullPrompt = `${systemPrompt}\n\n${conversationText}\nUser: ${message}\nAstrologer:`;

        const result = await callAi(fullPrompt, "Chat with Counselor");
        return result.response || (typeof result === "string" ? result : JSON.stringify(result));
    },

    async validateCareerPath(
        profile: any,
        currentRole: string,
        targetRole?: string
    ): Promise<ValidationResult> {
        const roleToValidate = targetRole || currentRole;
        const isPivot = !!targetRole;

        const prompt = `
      You are an expert Vedic Astrologer and Career Counselor.
      
      User Profile:
      - Dominant Planets: ${profile.dominantPlanets.join(", ")}
      - Strong Houses: ${profile.strongHouses.join(", ")}
      - Current Mahadasha: ${profile.currentDasha || "Unknown"}
      - Planetary Positions (D1): ${profile.planetsD1?.map((p: any) => `${p.planet} in H${p.house}`).join(", ")}
      - Top Holland Codes: ${(Object.entries(profile.hollandCodes || {}) as [string, number][])
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")}
      
      Context:
      - ${isPivot ? `Current Role: ${currentRole}` : `Role to Validate: ${currentRole}`}
      ${isPivot ? `- Target Role: ${targetRole}` : ""}
      
      Task:
      Analyze the compatibility of the "${roleToValidate}" with the user's astrological profile.
      1. Calculate a compatibility score (0-100) based on how well the role aligns with their Dominant Planets/Houses.
      2. Provide a "Cosmic Analysis" explaining the match (or mismatch). Use markdown.
      3. ${isPivot
                ? 'Suggest a 3-step "Pivot Strategy" to bridge the gap from Current to Target role.'
                : 'Suggest a 3-step "Growth Strategy" to maximize success and fulfillment in this role.'}
      4. Suggest a "Smart Pivot" - a related role that might be a better fit if the current one isn\'t ideal, or a logical next step/promotion.
      
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

    async mapCareerToAstrology(careerName: string): Promise<{ planets: string[]; houses: number[] }> {
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

    async generateCareerCandidates(planets: string[]): Promise<any[]> {
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
