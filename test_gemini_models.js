const API_KEY = "AIzaSyD6dDWqAkPADfHCmDOlim-xRkFzgoye8-k"; // From .env file

const modelsToTest = [
    "gemini-pro",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.0-flash-exp",
    "gemini-2.5-flash",
    "models/gemini-pro",
    "models/gemini-1.5-flash",
];

async function testModel(modelName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Say OK" }]
                }]
            })
        });

        const status = response.status;
        const data = await response.json();

        if (status === 200) {
            console.log(`✅ ${modelName}: WORKING`);
            return { modelName, status: "✅ WORKING", response: data };
        } else {
            console.log(`❌ ${modelName}: ${status} - ${JSON.stringify(data.error || data).substring(0, 100)}`);
            return { modelName, status: `❌ ${status}`, error: data.error || data };
        }
    } catch (error) {
        console.log(`❌ ${modelName}: ERROR - ${error.message}`);
        return { modelName, status: "❌ ERROR", error: error.message };
    }
}

async function testAllModels() {
    console.log("Testing available Gemini models...\n");

    const results = [];
    for (const model of modelsToTest) {
        const result = await testModel(model);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between requests
    }

    console.log("\n\n=== SUMMARY ===");
    results.forEach(r => {
        console.log(`${r.status} ${r.modelName}`);
    });

    const workingModels = results.filter(r => r.status === "✅ WORKING");
    console.log(`\n\nWorking models: ${workingModels.length}/${results.length}`);

    if (workingModels.length > 0) {
        console.log("\nRecommended model:", workingModels[0].modelName);
    }
}

testAllModels();
