
import { generateFullChartData } from './server/astro/calculations';

// Mock getPlanetDignity from calculations if not exported, or import if available
// Assuming it's available or we can mock it for structure test
const getPlanetDignity = (p: string, s: string) => "neutral";

async function testPipeline() {
    console.log("--- STARTING PIPELINE TEST ---");

    // step 1: Generate Data (Router Logic)
    const birthData = {
        date: "1995-09-28",
        time: "00:50",
        latitude: 19.0760,
        longitude: 72.8777,
        timezone: 5.5
    };

    console.log("1. Generating FullChartData...");
    const chartData: any = await generateFullChartData(birthData as any);

    if (!chartData.d2) {
        console.error("FATAL: chartData.d2 is missing immediately after generation");
        return;
    }
    console.log("   > chartData.d2 present. Planest count:", chartData.d2.planets.length);

    // Step 2: Router Extraction Logic (Exact copy from server/routers.ts)
    console.log("2. Running Router Extraction Logic...");
    const vargaCharts: any = {};
    let d2FoundInLoop = false;

    for (const key of Object.keys(chartData)) {
        if (key.match(/^d\d+$/) && chartData[key]?.planets) {
            if (key === 'd2') d2FoundInLoop = true;
            vargaCharts[key] = chartData[key].planets.map((p: any) => ({
                planet: p.planet,
                house: p.house,
                sign: p.sign,
                degree: p.degree,
                minute: p.minute,
                isRetrograde: p.isRetrograde,
                dignity: getPlanetDignity(p.planet, p.sign),
                nakshatra: p.nakshatra
            }));
        }
    }

    if (!d2FoundInLoop) {
        console.error("FATAL: D2 was NOT found during Router loop iteration!");
    } else {
        console.log("   > D2 found and extracted in Router loop.");
    }

    if (!vargaCharts.d2) {
        console.error("FATAL: vargaCharts.d2 is undefined after loop");
    }

    const profileContext = {
        charts: vargaCharts
    };

    // Step 3: AI Service Formatting Logic (Exact copy from server/services/ai.ts)
    console.log("3. Running AI Service Formatting Logic...");

    const formatChartsForPrompt = (charts: any) => {
        if (!charts) return "No divisional chart data available.";

        let output = "";
        const sortedKeys = Object.keys(charts).sort((a, b) => {
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
                const nakshatra = p.nakshatra ? ` [${p.nakshatra}]` : "";

                output += `- ${p.planet} in ${p.sign} (${p.house}H)${degreeInfo}${dignity}${retrograde}${nakshatra}\n`;
            });
        }
        return output;
    };

    const finalPromptSnippet = formatChartsForPrompt(profileContext.charts);

    console.log("--- FINAL PROMPT SNIPPET START ---");
    console.log(finalPromptSnippet);
    console.log("--- FINAL PROMPT SNIPPET END ---");

    if (finalPromptSnippet.includes("D2 (Hora - Wealth)")) {
        console.log("SUCCESS: Prompt contains 'D2 (Hora - Wealth)'");
    } else {
        console.error("FAILURE: Prompt DOES NOT contain 'D2 (Hora - Wealth)'");
    }
}

testPipeline().catch(console.error);
