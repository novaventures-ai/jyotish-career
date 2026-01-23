/**
 * Timing Engine
 * Implements Phase 5 of the Master Framework: Timing of Events
 * Now upgraded to Dynamic Dasha Analysis
 */

import { FullChartData, PlanetPosition, VargaChart } from "./calculations";

export interface MaturityEvent {
    planet: string;
    age: number;
    year: number;
    description: string;
    type?: "career" | "wealth" | "general" | "spiritual";
    score?: number; // Significance score
}

export interface TransitAnalysis {
    saturnAspect: boolean;
    jupiterAspect: boolean;
    doubleTransit: boolean;
    targetHouse: number;
}

// ------------------------------------------------------------------
// DYNAMIC ANALYSIS
// ------------------------------------------------------------------

/**
 * Generate forward-looking milestones based on Dashas and Sub-dashas
 * Looks ahead ~5-8 years from current date
 */
export function getDynamicMilestones(chart: FullChartData): MaturityEvent[] {
    const events: MaturityEvent[] = [];
    const birthYear = parseInt(chart.d1.birthData.date.split("-")[0]);
    const now = new Date();
    const lookLimit = new Date(now.getFullYear() + 8, now.getMonth(), now.getDate()); // 8 year horizon

    // 1. Flatten Dashas into a timeline of Antardashas (Sub-periods)
    const timeline: { planet: string; start: Date; end: Date; type: 'mahadasha' | 'antardasha' }[] = [];

    // Find current Mahadasha
    const currentMaha = chart.dashas.find(d => now >= d.startDate && now <= d.endDate);
    if (!currentMaha) return []; // Should not happen

    // Add remaining Antardashas of current Mahadasha
    if (currentMaha.subPeriods) {
        currentMaha.subPeriods.forEach(sub => {
            if (sub.endDate > now) {
                timeline.push({ planet: sub.planet, start: sub.startDate, end: sub.endDate, type: 'antardasha' });
            }
        });
    }

    // Add sub-periods of NEXT Mahadasha (if look window allows)
    const nextMahaIdx = chart.dashas.findIndex(d => d.planet === currentMaha.planet) + 1;
    if (nextMahaIdx < chart.dashas.length) {
        const nextMaha = chart.dashas[nextMahaIdx];
        if (nextMaha.subPeriods && nextMaha.startDate < lookLimit) {
            // Add Mahadasha logical start event
            timeline.push({
                planet: nextMaha.planet,
                start: nextMaha.startDate,
                end: nextMaha.endDate,
                type: 'mahadasha' // Mark as major shift
            });

            // Add its subs
            nextMaha.subPeriods.forEach(sub => {
                if (sub.endDate < lookLimit) {
                    timeline.push({ planet: sub.planet, start: sub.startDate, end: sub.endDate, type: 'antardasha' });
                }
            });
        }
    }

    // 2. Analyze each period
    let count = 0;
    for (const period of timeline) {
        if (count >= 5) break;

        // Skip past part of current period, focus on future start or current if significant
        const eventAge = Math.floor((period.start.getTime() - new Date(chart.d1.birthData.date).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        const currentRealAge = (now.getTime() - new Date(chart.d1.birthData.date).getTime()) / (1000 * 60 * 60 * 24 * 365.25);

        // Don't show events that started long ago. Show "Current Node" or "Upcoming"
        // If event started > 1 year ago, maybe skip unless it's a Major Mahadasha change
        if (period.start.getTime() < now.getTime() - (1000 * 60 * 60 * 24 * 365)) continue;

        const analysis = analyzePeriodInfluence(period.planet, chart, period.type === 'mahadasha');

        if (analysis.isSignificant) {
            events.push({
                planet: period.planet,
                age: period.start < now ? Math.floor(currentRealAge) : eventAge, // Use current age if running
                year: period.start < now ? now.getFullYear() : period.start.getFullYear(),
                description: period.type === 'mahadasha'
                    ? `Major Life Shift: Entering ${period.planet} Mahadasha. ${analysis.description}`
                    : `${analysis.headline} (${period.planet} period).`,
                type: analysis.category,
                score: analysis.score
            });
            count++;
        }
    }

    return events;
}

interface PeriodAnalysis {
    headline: string;
    description: string;
    category: "career" | "wealth" | "general" | "spiritual";
    isSignificant: boolean;
    score: number;
}

function analyzePeriodInfluence(planetName: string, chart: FullChartData, isMahadasha: boolean): PeriodAnalysis {
    let score = 0;
    let headline = `Focus on ${getPlanetSignifications(planetName)}`;
    let description = "";
    let category: PeriodAnalysis['category'] = "general";

    // P1: D10 Career Analysis (Dasamsa)
    if (chart.d10) {
        const pD10 = chart.d10.planets.find(p => p.planet === planetName);
        if (pD10) {
            // Check 10th House (Power) / 1st House (Self in Career) in D10
            if (pD10.house === 10) {
                score += 5;
                headline = "Career Peak & Recognition";
                description += "Expect major professional elevation and authority. ";
                category = "career";
            } else if (pD10.house === 1) {
                score += 4;
                headline = "New Career Beginning";
                description += "A fresh professional chapter begins. Great for job switching. ";
                category = "career";
            }

            // Check 7th House (Business) in D10
            if (pD10.house === 7) {
                score += 3;
                headline = "Business Expansion";
                description += "Favorable for partnerships and ventures. ";
                category = "career";
            }
        }
    }

    // P2: Wealth Analysis (D1 / D2)
    // Check D1 2nd/11th lords
    const d1House2Lord = chart.d1.houses[1].lord; // Index 1 = 2nd House
    const d1House11Lord = chart.d1.houses[10].lord; // Index 10 = 11th House

    if (planetName === d1House2Lord || planetName === d1House11Lord) {
        score += 4;
        headline = "Financial Growth Phase";
        description += "Income channels activate. Good time for investments. ";
        category = "wealth";
    }

    // P3: Transformation (8th House)
    if (chart.d1.planets.find(p => p.planet === planetName)?.house === 8) {
        score += 2; // Moderate score but important to note
        headline = "Transformation & Change";
        description += "Sudden changes or windfalls possible. ";
        category = "spiritual";
    }

    // P4: Mahadasha Weight
    if (isMahadasha) {
        score += 10; // Mahadasha changes are always significant
        headline = `Major Shift: ${planetName} Era`;
    }

    // Fallback for neutral periods
    if (score < 3 && !isMahadasha) {
        // Boost score slightly if it's a generally "good" planet
        if (["Jupiter", "Venus", "Mercury", "Sun", "Mars"].includes(planetName)) {
            score += 2;
        }
    }

    return {
        headline,
        description: description || `A period driven by ${planetName} energy (${getPlanetSignifications(planetName)}).`,
        category,
        isSignificant: score >= 3, // Only return if impactful
        score
    };
}

function getPlanetSignifications(planet: string): string {
    const map: Record<string, string> = {
        "Sun": "Authority & Ego",
        "Moon": "Emotions & Public",
        "Mars": "Action & Energy",
        "Mercury": "Communication & Craft",
        "Jupiter": "Wisdom & Expansion",
        "Venus": "Comfort & Relations",
        "Saturn": "Discipline & Delay",
        "Rahu": "Ambition & Change",
        "Ketu": "Detachment & Insight"
    };
    return map[planet] || "Energy";
}

// ------------------------------------------------------------------
// LEGACY / UTILS
// ------------------------------------------------------------------

// Planetary Maturity Ages (Fixed Years) - Keeping as fallback
export const MATURITY_AGES: Record<string, number> = {
    "Jupiter": 16, "Sun": 22, "Moon": 24, "Venus": 25,
    "Mars": 28, "Mercury": 32, "Saturn": 36, "Rahu": 42, "Ketu": 48
};

/**
 * Calculate Maturity Years for the native (Legacy Static)
 */
export function calculateMaturityEvents(birthYear: number): MaturityEvent[] {
    const events: MaturityEvent[] = [];
    for (const [planet, age] of Object.entries(MATURITY_AGES)) {
        events.push({
            planet,
            age,
            year: birthYear + age,
            description: `${planet} matures at age ${age}, triggering ${getMaturityEffect(planet)}`
        });
    }
    return events.sort((a, b) => a.age - b.age);
}

function getMaturityEffect(planet: string): string {
    switch (planet) {
        case "Jupiter": return "Expansion, Wisdom, Financial Growth";
        case "Sun": return "Status, Authority, Recognition";
        case "Moon": return "Emotional stability, Public change";
        case "Venus": return "Marriage, Relationship peak, Comfort";
        case "Mars": return "Career push, Energy peak, Initiative";
        case "Mercury": return "Intellectual peak, Business maturity";
        case "Saturn": return "Stabilization, Authority through experience";
        case "Rahu": return "Massive expansion, Foreign travel, Unconventional success";
        case "Ketu": return "Spiritual realization, Detachment, Sudden change";
        default: return "Activation";
    }
}

/**
 * Check Double Transit (Saturn + Jupiter)
 */
export function checkDoubleTransit(
    targetHouse: number, // 1-12
    currentJupiter: PlanetPosition,
    currentSaturn: PlanetPosition
): TransitAnalysis {
    // Aspects: Jupiter (1, 5, 9), Saturn (1, 3, 7, 10)
    const targetIdx = targetHouse - 1;
    const jupIdx = currentJupiter.signIndex;
    const satIdx = currentSaturn.signIndex;

    const jupDist = (targetIdx - jupIdx + 12) % 12;
    const satDist = (targetIdx - satIdx + 12) % 12;

    const jupAspects = [0, 4, 8];
    const satAspects = [0, 2, 6, 9];

    const jupiterAspect = jupAspects.includes(jupDist);
    const saturnAspect = satAspects.includes(satDist);

    return {
        saturnAspect,
        jupiterAspect,
        doubleTransit: jupiterAspect && saturnAspect,
        targetHouse
    };
}
