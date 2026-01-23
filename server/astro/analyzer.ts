/**
 * Master Framework Analyzer
 * Orchestrates the full 6-Phase Analysis
 */

import { BirthChart, FullChartData, PlanetPosition, VargaChart } from "./calculations";
import { calculateArudhaLagna, calculateArgala, JaiminiData } from "./jaimini";
import { calculateMaturityEvents, checkDoubleTransit, MaturityEvent, getDynamicMilestones } from "./timing";
import { generateAdvancedRemedies, AdvancedRemedies } from "./remedies";
import { generateSWOTAnalysis, SWOTAnalysis } from "./swot";

export interface MasterAnalysis {
    orientation: {
        type: "Employment" | "Business" | "Consultant";
        score: { service: number; business: number };
        drivingPlanet: string;
        description: string;
    };
    wealth: {
        d2Source: "Active (Sun)" | "Passive (Moon)" | "Mixed";
        d10Status: string;
        d8Windfall: string;
        d12Legacy: "Self-Made" | "Inherited";
        d16Assets: string;
        d24Niche: string;
    };
    status: {
        arudhaLagna: string;
        reputation: string;
        boosters: string[];
        blockers: string[];
    };
    timing: {
        maturityEvents: MaturityEvent[];
        // doubleTransit implementation requires current positions, omitted for static analysis
    };
    remedies: AdvancedRemedies;
    swot: SWOTAnalysis;
}



/**
 * Phase 1: Foundational Orientation (D1)
 */
function analyzeOrientation(d1: BirthChart): MasterAnalysis['orientation'] {
    let serviceScore = 0;
    let businessScore = 0;

    // 1. Service vs Enterprise Check

    // 6th House Strength (Service)
    const planetsIn6 = d1.planets.filter(p => p.house === 6).length;
    serviceScore += planetsIn6 * 10;

    // 7th House Strength (Business)
    const planetsIn7 = d1.planets.filter(p => p.house === 7).length;
    businessScore += planetsIn7 * 10;

    // 3rd House (Risk) - Enterprise booster
    const planetsIn3 = d1.planets.filter(p => p.house === 3).length;
    businessScore += planetsIn3 * 5;

    // 10th Lord Placement
    const lord10Name = d1.houses[9].lord;
    const lord10 = d1.planets.find(p => p.planet === lord10Name);

    if (lord10) {
        if (lord10.house === 6) serviceScore += 20;
        if (lord10.house === 7) businessScore += 20;
    }

    // Verdict
    let type: "Employment" | "Business" | "Consultant" = "Employment";
    if (businessScore > serviceScore + 5) {
        type = "Business";
    } else if (Math.abs(businessScore - serviceScore) <= 5) {
        type = "Consultant"; // Hybrid
    }

    // Driving Planet (Strongest / 10th Lord)
    const drivingPlanet = lord10Name || "Saturn";

    return {
        type,
        score: { service: serviceScore, business: businessScore },
        drivingPlanet,
        description: `Primary orientation is towards ${type} based on dominance of ${type === 'Business' ? '7th (Trade) & 3rd (Risk)' : '6th (Service)'} houses.`
    };
}

/**
 * Phase 2: Wealth Architecture (Vargas)
 */
function analyzeWealthArchitecture(fullChart: FullChartData): MasterAnalysis['wealth'] {
    // D2 Hora - Active vs Passive
    // Sun Hora (Leo) vs Moon Hora (Cancer)
    const d2 = fullChart.d2; // Assuming vargas are populated
    let sunHoraCount = 0;
    let moonHoraCount = 0;

    // In D2, planets are either in Cancer(3) or Leo(4) - indices 3 and 4
    if (d2) {
        d2.planets.forEach(p => {
            if (p.signIndex === 3) moonHoraCount++; // Cancer
            if (p.signIndex === 4) sunHoraCount++; // Leo
        });
    }

    const d2Source = sunHoraCount > moonHoraCount ? "Active (Sun)"
        : moonHoraCount > sunHoraCount ? "Passive (Moon)"
            : "Mixed";

    // D10 Dasamsa - Scale
    // Check 10th house of D10
    let d10Status = "Standard";
    const d10 = fullChart.d10;
    if (d10) {
        const planetsIn10 = d10.planets.filter(p => p.house === 10); // Note: house calculation in vargas needs to be accurate relative to varga Asc
        // Assuming varga 'house' property is calculated relative to varga asc
        if (planetsIn10.length > 0) d10Status = "High Prominence (Planets in 10th)";

        // Check Exaltations in 10th (Simplified check)
        planetsIn10.forEach(p => {
            if (isExalted(p)) d10Status = "Executive/Director Level (Exalted Planet in 10th)";
        });
    }

    // D8 Ashtamsha - Windfalls
    // Check 2nd and 11th in D8
    // Since we just added D8 calculation, we need to access it. 
    // For now assuming dynamic access or we'll update types later.
    const d8 = fullChart.d8;
    let d8Windfall = "Average";
    if (d8) {
        const p2 = d8.planets.filter(p => p.house === 2);
        const p11 = d8.planets.filter(p => p.house === 11);
        const beneficCount = [...p2, ...p11].filter(p => ["Jupiter", "Venus", "Mercury", "Moon"].includes(p.planet)).length;
        const maleficCount = [...p2, ...p11].filter(p => ["Saturn", "Mars", "Rahu", "Ketu", "Sun"].includes(p.planet)).length;

        if (beneficCount > maleficCount) d8Windfall = "High Potential (Inheritance/Lottery)";
        else if (maleficCount > beneficCount) d8Windfall = "Risk of Sudden Loss";
    }

    // D12 - Legacy
    const d12 = fullChart.d12;
    let d12Legacy: "Self-Made" | "Inherited" = "Self-Made"; // Default
    if (d12) {
        // Check Sun and Moon strength/placement (Simplified: placements in Kendra/Trikona)
        const sun = d12.planets.find(p => p.planet === "Sun");
        const moon = d12.planets.find(p => p.planet === "Moon");
        if (sun && [1, 4, 7, 10, 5, 9].includes(sun.house)) d12Legacy = "Inherited"; // Strong ancestral link
    }

    // D16 - Joy of Assets
    const d16 = fullChart.d16;
    let d16Assets = "Standard";
    const lord4D1 = fullChart.d1.houses[3].lord;
    if (d16 && lord4D1) {
        const p = d16.planets.find(p => p.planet === lord4D1);
        if (p) {
            if ([6, 8, 12].includes(p.house)) d16Assets = "Challenges with Assets (Legal/Repairs)";
            else if (["Saturn", "Rahu", "Mars"].some(m => checkConjunction(p, m, d16))) d16Assets = "Stressful Assets";
            else d16Assets = "Joyful/Comfortable Assets";
        }
    }

    // D24 - Niche
    const d24 = fullChart.d24;
    let d24Niche = "General";
    if (d24) {
        const ascLordName = getSafeSignLord(d24.ascendant.signIndex);
        d24Niche = `${ascLordName} related specalization`;
    }

    return { d2Source, d10Status, d8Windfall, d12Legacy, d16Assets, d24Niche };
}

/**
 * Phase 6: Verdict & Remedies
 */


// Helpers
function isExalted(p: PlanetPosition): boolean {
    const exaltations: Record<string, string> = {
        "Sun": "Aries", "Moon": "Taurus", "Mars": "Capricorn", "Mercury": "Virgo",
        "Jupiter": "Cancer", "Venus": "Pisces", "Saturn": "Libra", "Rahu": "Taurus", "Ketu": "Scorpio"
    };
    return exaltations[p.planet] === p.sign;
}

function checkConjunction(p1: PlanetPosition, p2Name: string, chart: VargaChart) {
    const p2 = chart.planets.find(p => p.planet === p2Name);
    return p2 && p2.house === p1.house;
}

function getSafeSignLord(idx: number): string {
    const lords = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
    return lords[idx] || "Unknown";
}

/**
 * Main Entry Point
 */
export function generateMasterAnalysis(fullChart: FullChartData): MasterAnalysis {
    const orientation = analyzeOrientation(fullChart.d1);
    const wealth = analyzeWealthArchitecture(fullChart);

    // Jaimini
    const al = calculateArudhaLagna(fullChart.d1);
    const argala = calculateArgala(fullChart.d1, al.signIndex); // Argala on AL? Or Lagna? "Brand" is AL.

    const status = {
        arudhaLagna: al.sign,
        reputation: `Seen as ${orientation.type === 'Business' ? 'Enterprising' : 'Reliable'} (AL in ${al.sign})`,
        boosters: argala.boosters,
        blockers: argala.blockers
    };

    // Timing - Dynamic Milestones
    // Replaced static maturity events with dynamic dasha-based analysis
    const maturityEvents = getDynamicMilestones(fullChart);

    // Fallback to static if no dynamic events found (rare, but good safety)
    if (maturityEvents.length === 0) {
        const birthYear = parseInt(fullChart.d1.birthData.date.split("-")[0]);
        const staticEvents = calculateMaturityEvents(birthYear);
        // Filter only future static events
        const currentYear = new Date().getFullYear();
        staticEvents.forEach(e => {
            if (e.year >= currentYear) maturityEvents.push(e);
        });
    }

    // Remedies - Advanced System
    const remedies = generateAdvancedRemedies(fullChart);

    // New SWOT Analysis
    const swot = generateSWOTAnalysis(fullChart);

    return {
        orientation,
        wealth,
        status,
        timing: { maturityEvents },
        remedies,
        swot
    };
}
