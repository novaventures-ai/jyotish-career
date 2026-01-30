
import { generateFullChartData } from './server/astro/calculations';
import { getPlanetDignity } from './server/astro/calculations';

async function test() {
    const birthData = {
        date: "1995-09-28",
        time: "00:50",
        latitude: 19.0760,
        longitude: 72.8777,
        timezone: 5.5
    };

    console.log("Generating chart data...");
    const chartData: any = await generateFullChartData(birthData as any);

    console.log("Keys in chartData:", Object.keys(chartData));

    // The logic added to routers.ts
    const vargaCharts: any = {};
    for (const key of Object.keys(chartData)) {
        if (key.match(/^d\d+$/) && chartData[key]?.planets) {
            console.log(`Found chart: ${key}`);
            vargaCharts[key] = chartData[key].planets.map((p: any) => ({
                planet: p.planet,
                house: p.house,
                sign: p.sign
            }));
        } else {
            if (key.startsWith('d')) console.log(`Skipping key: ${key} (Type: ${typeof chartData[key]})`);
        }
    }

    console.log("Final vargaCharts keys:", Object.keys(vargaCharts));

    console.log("Final vargaCharts keys:", Object.keys(vargaCharts));

    if (!vargaCharts.d2) {
        console.error("FAIL: d2 missing from vargaCharts");
    } else {
        console.log("SUCCESS: d2 present");
        console.log("D2 Planets:", JSON.stringify(vargaCharts.d2, null, 2));
    }
}

test().catch(console.error);
