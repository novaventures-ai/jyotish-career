
/**
 * SWOT Analysis Engine
 * Generates Strengths, Weaknesses, Opportunities, and Threats based on deep chart analysis.
 */

import { FullChartData, PlanetPosition, VargaChart, DetectedYoga, getSignLord, SIGN_LORDS } from "./calculations";

export interface SWOTItem {
    id: string;
    category: "Strength" | "Weakness" | "Opportunity" | "Threat";
    title: string;
    description: string;
    impactScore: number; // 1-10
    actionableAdvice: string;
    tags: string[];
}

export interface SWOTAnalysis {
    strengths: SWOTItem[];
    weaknesses: SWOTItem[];
    opportunities: SWOTItem[];
    threats: SWOTItem[];
    summary: string;
}

// ---------------------------------------------------------
// Main Analysis Function
// ---------------------------------------------------------

export function generateSWOTAnalysis(chart: FullChartData): SWOTAnalysis {
    const strengths: SWOTItem[] = [];
    const weaknesses: SWOTItem[] = [];
    const opportunities: SWOTItem[] = [];
    const threats: SWOTItem[] = [];

    // 1. Analyze Planets (S/W)
    chart.d1.planets.forEach(p => {
        analyzePlanetStrength(p, chart, strengths, weaknesses);
    });

    // 2. Analyze Yogas (S)
    if (chart.yogas) {
        chart.yogas.forEach(yoga => {
            // Yogas are inherently strengths
            strengths.push({
                id: `yoga-${yoga.name.replace(/\s+/g, '-').toLowerCase()}`,
                category: "Strength",
                title: `${yoga.name} (${yoga.category})`,
                description: yoga.description,
                impactScore: yoga.strength === 'strong' ? 9 : yoga.strength === 'moderate' ? 7 : 5,
                actionableAdvice: `Leverage this ${yoga.category} yoga by focusing on ${yoga.careerImplication || 'leadership and growth'}.`,
                tags: ["Yoga", yoga.category]
            });
        });
    }

    // 3. Analyze Houses (S/W/T)
    analyzeHouseStructure(chart.d1, strengths, weaknesses, threats);

    // 4. Analyze Dasha (O/T)
    analyzeDashaTimeline(chart, opportunities, threats);

    // 5. Analyze Vargas (D9, D10) (S/W/O)
    analyzeVargaCharts(chart, strengths, weaknesses, opportunities);

    return {
        strengths: sortAndLimit(strengths),
        weaknesses: sortAndLimit(weaknesses),
        opportunities: sortAndLimit(opportunities),
        threats: sortAndLimit(threats),
        summary: generateSummary(strengths, weaknesses, opportunities, threats)
    };
}

// ---------------------------------------------------------
// Helper Logic
// ---------------------------------------------------------

function sortAndLimit(items: SWOTItem[]): SWOTItem[] {
    return items.sort((a, b) => b.impactScore - a.impactScore).slice(0, 5);
}

function analyzePlanetStrength(p: PlanetPosition, chart: FullChartData, s: SWOTItem[], w: SWOTItem[]) {
    // D1 Strength Analysis
    const isExalted = checkExaltation(p);
    const isDebilitated = checkDebilitation(p);
    const isOwnSign = checkOwnSign(p);
    const isVargottama = checkVargottama(p, chart.d9);

    if (isExalted) {
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

    if (isDebilitated) {
        // Check Neecha Bhanga (Simplified)
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

function analyzeHouseStructure(d1: any, s: SWOTItem[], w: SWOTItem[], t: SWOTItem[]) {
    // Check Dusthanas (6, 8, 12)
    const planetsIn6 = d1.planets.filter((p: any) => p.house === 6);
    const planetsIn8 = d1.planets.filter((p: any) => p.house === 8);
    const planetsIn12 = d1.planets.filter((p: any) => p.house === 12);

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
        t.push({
            id: "active-8th",
            category: "Threat",
            title: "Hidden Transformations",
            description: "Planets in 8th house can bring sudden changes.",
            impactScore: 6,
            actionableAdvice: "Maintain an emergency fund and avoid risky speculation.",
            tags: ["House 8", "Risk"]
        });
    }

    // Check Kendras (1, 4, 7, 10) for Strength
    const planetsInKendra = d1.planets.filter((p: any) => [1, 4, 7, 10].includes(p.house));
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

function analyzeDashaTimeline(chart: FullChartData, o: SWOTItem[], t: SWOTItem[]) {
    const currentLord = chart.currentDasha.mahadasha;
    const isLordBenefic = ["Jupiter", "Venus", "Moon", "Mercury"].includes(currentLord); // Simplified natural benefic

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
        // Natural Malefic - Check placement
        const p = chart.d1.planets.find(p => p.planet === currentLord);
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
            t.push({
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

function analyzeVargaCharts(chart: FullChartData, s: SWOTItem[], w: SWOTItem[], o: SWOTItem[]) {
    // D10 Career Analysis
    if (chart.d10) {
        const lord10d1 = chart.d1.houses[9].lord; // 10th lord name from D1 (House array is 0-indexed, so index 9 is 10th house)
        const lord10inD10 = chart.d10.planets.find(p => p.planet === lord10d1);

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

// ---------------------------------------------------------
// Utilities
// ---------------------------------------------------------

function getPlanetKeywords(planet: string): string {
    const map: Record<string, string> = {
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

function checkExaltation(p: PlanetPosition): boolean {
    const signs: Record<string, string> = { "Sun": "Aries", "Moon": "Taurus", "Mars": "Capricorn", "Mercury": "Virgo", "Jupiter": "Cancer", "Venus": "Pisces", "Saturn": "Libra", "Rahu": "Taurus", "Ketu": "Scorpio" };
    return signs[p.planet] === p.sign;
}

function checkDebilitation(p: PlanetPosition): boolean {
    const signs: Record<string, string> = { "Sun": "Libra", "Moon": "Scorpio", "Mars": "Cancer", "Mercury": "Pisces", "Jupiter": "Capricorn", "Venus": "Virgo", "Saturn": "Aries", "Rahu": "Scorpio", "Ketu": "Taurus" };
    return signs[p.planet] === p.sign;
}

function checkOwnSign(p: PlanetPosition): boolean {
    const lords = SIGN_LORDS;
    // Map sign name to index to check lord? Or just hardcode sign ownership.
    // Calculations.ts exports SIGN_LORDS array where index 0 = Aries.
    // Need to convert p.sign string to index or check ownership map.
    // Simple map:
    const ownership: Record<string, string[]> = {
        "Sun": ["Leo"], "Moon": ["Cancer"], "Mars": ["Aries", "Scorpio"],
        "Mercury": ["Gemini", "Virgo"], "Jupiter": ["Sagittarius", "Pisces"],
        "Venus": ["Taurus", "Libra"], "Saturn": ["Capricorn", "Aquarius"]
    };
    return ownership[p.planet]?.includes(p.sign) || false;
}

function checkVargottama(p: PlanetPosition, d9?: VargaChart): boolean {
    if (!d9) return false;
    const pD9 = d9.planets.find(dp => dp.planet === p.planet);
    return pD9 ? pD9.sign === p.sign : false;
}

function checkNeechaBhanga(p: PlanetPosition, d1: any): boolean {
    // Simplified logic: If dispositor is in Kendra from Moon or Ascendant
    // This requires complex relative references. 
    // Placeholder: Return true if Jupiter aspects it (Simplified optimistic view for now)
    return false;
}

function generateSummary(s: SWOTItem[], w: SWOTItem[], o: SWOTItem[], t: SWOTItem[]): string {
    const strong = s.length > w.length;
    return `Your chart shows ${strong ? "more strengths than weaknesses" : "significant areas for improvement"}. 
    Focus on "${o[0]?.title || 'ucoming opportunities'}" to mitigate "${t[0]?.title || 'potential risks'}. 
    Your ${s[0]?.title || 'core strength'} is your biggest asset.`;
}
