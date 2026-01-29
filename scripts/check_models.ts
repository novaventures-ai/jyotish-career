import dotenv from "dotenv";

dotenv.config();

async function listModels() {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        console.error("GEMINI_API_KEY not found in .env");
        return;
    }

    const versions = ['v1', 'v1beta'];

    for (const v of versions) {
        console.log(`\n--- Searching ${v} models ---`);
        try {
            const url = `https://generativelanguage.googleapis.com/${v}/models?key=${API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.models) {
                console.log(`Found ${data.models.length} models:`);
                data.models.forEach((m: any) => {
                    console.log(`- ${m.name} (supports: ${m.supportedGenerationMethods.join(', ')})`);
                });
            } else {
                console.log(`No models found or error in ${v}:`, JSON.stringify(data));
            }
        } catch (e: any) {
            console.error(`Failed to list models for ${v}: ${e.message}`);
        }
    }
}

listModels();
