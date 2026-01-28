async function testSwotFeature() {
    const url = "https://jyotish-career-main.vercel.app/api/trpc/ai.getSwotAnalysis";

    // First, generate a guest chart
    const chartUrl = "https://jyotish-career-main.vercel.app/api/trpc/chart.generateGuest";
    const chartPayload = {
        json: {
            birthDate: "1990-01-01",
            birthTime: "12:00",
            birthPlace: "Mumbai",
            latitude: 19.0760,
            longitude: 72.8777,
            timezoneOffset: 5.5,
            ayanamsa: "lahiri"
        }
    };

    console.log("1. Generating guest chart...");
    try {
        const chartResponse = await fetch(chartUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(chartPayload)
        });

        if (chartResponse.status !== 200) {
            throw new Error(`Chart generation failed: ${chartResponse.status}`);
        }

        const chartData = await chartResponse.json();
        console.log("✅ Chart generated successfully");

        // Now test SWOT with the chart data
        console.log("\n2. Testing SWOT Analysis with generated chart...");
        const swotPayload = {
            json: {
                chartData: chartData.result.data.json
            }
        };

        const swotResponse = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(swotPayload)
        });

        const status = swotResponse.status;
        const swotData = await swotResponse.json();

        if (status === 200) {
            console.log("✅ SWOT Analysis SUCCESS!");
            console.log("\nResponse preview:");
            console.log(JSON.stringify(swotData).substring(0, 300) + "...");
            return { success: true, data: swotData };
        } else {
            console.log(`❌ SWOT Analysis FAILED: ${status}`);
            console.log("Error:", JSON.stringify(swotData));
            return { success: false, error: swotData };
        }
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        return { success: false, error: error.message };
    }
}

testSwotFeature();
