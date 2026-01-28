import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

/**
 * Test endpoint to check which Gemini models work with our API key
 */
export async function listAvailableModels(req: any, res: any) {
    if (!API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);

        console.log("[Model Test] Testing various model names...");

        const modelsToTest = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-2.0-flash-exp",
            "gemini-2.5-flash",
            "gemini-pro",
            "gemini-flash",
        ];

        const results = [];

        for (const modelName of modelsToTest) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });

                // Try to generate a simple test response
                const result = await model.generateContent("Say 'OK' if you can read this.");
                const response = result.response;
                const text = response.text();

                results.push({
                    model: modelName,
                    status: "✅ WORKING",
                    response: text.substring(0, 50),
                });

                console.log(`[Model Test] ${modelName}: WORKING`);
            } catch (error: any) {
                results.push({
                    model: modelName,
                    status: "❌ FAILED",
                    error: error.message.substring(0, 100),
                });

                console.log(`[Model Test] ${modelName}: FAILED - ${error.message}`);
            }
        }

        return res.json({
            success: true,
            apiKeyConfigured: true,
            testedModels: results,
        });
    } catch (error: any) {
        console.error("[Model Test] Error:", error);
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}
