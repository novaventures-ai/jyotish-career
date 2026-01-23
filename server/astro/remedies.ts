
/**
 * Advanced Remedies System
 * Generates personalized remedial measures including behavioral, lifestyle,
 * and standard astrological remedies based on deep chart analysis.
 */

import { FullChartData, PlanetPosition } from "./calculations";

export interface BehavioralRemedy {
    title: string;
    description: string;
    actionableSteps: string[];
    psychologicalShift: string;
    priority: "High" | "Medium" | "Low";
}

export interface StandardRemedy {
    planet: string;
    type: "Gemstone" | "Mantra" | "Ritual" | "Charity";
    description: string;
    instructions: string[];
}

export interface AdvancedRemedies {
    behavioral: BehavioralRemedy[];
    standard: StandardRemedy[];
    gemstones: { planet: string; gem: string; metal: string; wearDay: string }[];
    weakPlanets: string[]; // For UI highlighting
    strengtheningFocus: string; // "Deity Name" / "Concept"
}

/**
 * Generate comprehensive remedies based on Chart (D1, D9, D10) and Dashas
 */
export function generateAdvancedRemedies(chart: FullChartData): AdvancedRemedies {
    const weakPlanets = identifyWeakPlanets(chart);
    const dashaLord = chart.currentDasha.mahadasha;

    // behavioral remedies based on chart weaknesses + current dasha
    const behavioral = generateBehavioralRemedies(weakPlanets, dashaLord, chart);

    // standard remedies
    const standard = generateStandardRemedies(weakPlanets);
    const gemstones = generateGemstoneRecommendations(weakPlanets);

    return {
        behavioral,
        standard,
        gemstones,
        weakPlanets,
        strengtheningFocus: determineStrengtheningFocus(chart)
    };
}

/**
 * Identify planets needing attention/remediation
 * Logic: 
 * 1. Debilitated (simplified check)
 * 2. In Dusthana (6, 8, 12)
 * 3. Afflicted by Malefics (Rahu/Ketu/Saturn conjunct)
 */
function identifyWeakPlanets(chart: FullChartData): string[] {
    const weakProps: Set<string> = new Set();
    const d1 = chart.d1;

    // 1. Dusthana Placements
    d1.planets.forEach(p => {
        if ([6, 8, 12].includes(p.house)) {
            // Only consider Navagraha for remedies
            if (["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"].includes(p.planet)) {
                weakProps.add(p.planet);
            }
        }
    });

    // 2. Debility (Sign based)
    d1.planets.forEach(p => {
        if (isDebilitated(p)) weakProps.add(p.planet);
    });

    // 3. Current Dasha Lord is always a candidate for "Attention" if not exalted
    const currentLord = chart.currentDasha.mahadasha;
    if (!weakProps.has(currentLord)) {
        // We add it to 'behavioral' focus but maybe not 'weak' list for gemstones? 
        // For now, let's keep it separate or handled in behavioral logic specifically.
    }

    return Array.from(weakProps);
}

function isDebilitated(p: PlanetPosition): boolean {
    const debilities: Record<string, string> = {
        "Sun": "Libra", "Moon": "Scorpio", "Mars": "Cancer", "Mercury": "Pisces", "Jupiter": "Capricorn",
        "Venus": "Virgo", "Saturn": "Aries", "Rahu": "Scorpio", "Ketu": "Taurus"
    };
    return debilities[p.planet] === p.sign;
}


function generateBehavioralRemedies(weakPlanets: string[], dashaLord: string, chart: FullChartData): BehavioralRemedy[] {
    const remedies: BehavioralRemedy[] = [];

    // 1. Dasha-Specific Behavioral Adjustment (Highest Priority)
    // The current period dictates the 'flavor' of life lessons
    const dashaRemedy = getDashaBehavioralRemedy(dashaLord);
    if (dashaRemedy) {
        remedies.push({ ...dashaRemedy, priority: "High" });
    }

    // 2. Weak Planet Behavioral Adjustments
    weakPlanets.forEach(planet => {
        // Skip dasha lord if already added to avoid duplicates, although dasha remedy is specific
        if (planet === dashaLord) return;

        const remedy = getPlanetBehavioralRemedy(planet);
        if (remedy) {
            remedies.push({ ...remedy, priority: "Medium" });
        }
    });

    // 3. Saturn/Rahu Special Checks (Karmic Planets)
    // If Saturn is in 10th (Career) -> Discipline
    const saturn = chart.d1.planets.find(p => p.planet === "Saturn");
    if (saturn && saturn.house === 10) {
        remedies.push({
            title: "Professional Endurance",
            description: "Saturn in the 10th house demands absolute integrity and patience in career.",
            actionableSteps: ["Do not cut corners at work", "Accept delays gracefully", "Mentor juniors"],
            psychologicalShift: "View work as service, not just a means to status.",
            priority: "High"
        });
    }

    return remedies.slice(0, 5); // Limit to top 5 impactful changes
}

function getDashaBehavioralRemedy(planet: string): BehavioralRemedy | null {
    const map: Record<string, BehavioralRemedy> = {
        "Sun": {
            title: "Mastering Ego & Authority",
            description: "During Sun periods, issues with ego, father figures, or authority often surface.",
            actionableSteps: ["Wake up before sunrise daily", "Take responsibility for errors immediately", "Respect your father/boss even if you disagree"],
            psychologicalShift: "I am a servant leader. My confidence serves others, not just myself.",
            priority: "High"
        },
        "Moon": {
            title: "Emotional Regulation",
            description: "Moon periods can bring emotional volatility and sensitivity.",
            actionableSteps: ["Practice daily meditation/mindfulness", "Stay hydrated (water represents moon)", "Keep your living space spotless"],
            psychologicalShift: "I observe my emotions without becoming them.",
            priority: "High"
        },
        "Mars": {
            title: "Channeling Aggression",
            description: "Mars energy brings drive but can lead to conflict and burnout.",
            actionableSteps: ["Daily physical exercise is non-negotiable", "Count to 10 before reacting to provocation", "Avoid competitive arguments"],
            psychologicalShift: "My strength is for protection, not domination.",
            priority: "High"
        },
        "Rahu": {
            title: "Grounding & Reality Checks",
            description: "Rahu periods create illusions, obsessions, and desire for shortcuts.",
            actionableSteps: ["Stick to established traditions/routines", "Avoid 'too good to be true' schemes", "Clean your toilets/bathroom yourself (removes vanity)"],
            psychologicalShift: "I accept the present moment rather than chasing the next big thing.",
            priority: "High"
        },
        "Jupiter": {
            title: "Cultivating Wisdom",
            description: "Jupiter periods test your wisdom, ethics, and ability to learn.",
            actionableSteps: ["Respect teachers and elders", "Read philosophical/educational books", "Avoid arrogance of knowledge"],
            psychologicalShift: "I am a lifelong student. Wisdom comes from humility.",
            priority: "High"
        },
        "Saturn": {
            title: "Discipline & Service",
            description: "Saturn periods demand hard work, patience, and facing reality.",
            actionableSteps: ["Create and stick to a strict daily schedule", "Perform selfless service (Seva)", "Declutter your life"],
            psychologicalShift: "Discipline is freedom. I embrace the grind.",
            priority: "High"
        },
        "Mercury": {
            title: "Truthful Communication",
            description: "Mercury periods highlight speech, business, and intellect.",
            actionableSteps: ["Listen twice as much as you speak", "Avoid gossip strictly", "Keep financial records organized"],
            psychologicalShift: "My words create my reality. I speak with clarity and kindness.",
            priority: "High"
        },
        "Ketu": {
            title: "Letting Go",
            description: "Ketu periods bring detachment, confusion, or spiritual growth.",
            actionableSteps: ["Declutter physical possessions", "Spend time in solitude/nature", "Don't force outcomes"],
            psychologicalShift: "I trust the universe. I release what no longer serves me.",
            priority: "High"
        },
        "Venus": {
            title: "Harmony & Balance",
            description: "Venus periods test relationships and desires.",
            actionableSteps: ["Respect your partner deeply", "Engage in creative or artistic hobbies", "Maintain personal grooming"],
            psychologicalShift: "I find beauty in balance, not excess.",
            priority: "High"
        }
    };
    return map[planet] || null;
}

function getPlanetBehavioralRemedy(planet: string): BehavioralRemedy | null {
    // Similar to Dasha but usually Medium priority and less 'era' focused
    const base = getDashaBehavioralRemedy(planet);
    if (base) {
        return {
            ...base,
            description: `${planet} needs strengthening in your chart.`,
            priority: "Medium"
        };
    }
    return null;
}

function generateStandardRemedies(weakPlanets: string[]): StandardRemedy[] {
    // Generate mantas/rituals/charity
    const remedies: StandardRemedy[] = [];

    // Mapping constants (simplified for this example)
    const mantraMap: Record<string, string> = { "Sun": "Om Suryaya Namaha", "Moon": "Om Chandraya Namaha", "Mars": "Om Mangalaya Namaha", "Mercury": "Om Budhaya Namaha", "Jupiter": "Om Gurave Namaha", "Venus": "Om Shukraya Namaha", "Saturn": "Om Shanaye Namaha", "Rahu": "Om Rahave Namaha", "Ketu": "Om Ketave Namaha" };

    weakPlanets.forEach(p => {
        if (mantraMap[p]) {
            remedies.push({
                planet: p,
                type: "Mantra",
                description: `Chant for ${p}`,
                instructions: [`Recite "${mantraMap[p]}" 108 times`, "Best done in the morning"]
            });
            remedies.push({
                planet: p,
                type: "Charity",
                description: `Donate items related to ${p}`,
                instructions: ["Donate on the day of the planet"]
            });
        }
    });

    return remedies;
}

function generateGemstoneRecommendations(weakPlanets: string[]) {
    const gems: Record<string, any> = {
        "Sun": { gem: "Ruby", metal: "Gold", wearDay: "Sunday" },
        "Moon": { gem: "Pearl", metal: "Silver", wearDay: "Monday" },
        "Mars": { gem: "Red Coral", metal: "Copper/Gold", wearDay: "Tuesday" },
        "Mercury": { gem: "Emerald", metal: "Gold", wearDay: "Wednesday" },
        "Jupiter": { gem: "Yellow Sapphire", metal: "Gold", wearDay: "Thursday" },
        "Venus": { gem: "Diamond/White Sapphire", metal: "Silver/Platinum", wearDay: "Friday" },
        "Saturn": { gem: "Blue Sapphire", metal: "Iron/Silver", wearDay: "Saturday" },
        "Rahu": { gem: "Hessonite", metal: "Silver", wearDay: "Saturday" },
        "Ketu": { gem: "Cat's Eye", metal: "Silver", wearDay: "Tuesday" }
    };

    return weakPlanets.map(p => {
        const g = gems[p];
        if (!g) return null;
        return { planet: p, ...g };
    }).filter(g => g !== null) as any[];
}

function determineStrengtheningFocus(chart: FullChartData): string {
    // If 10th lord is weak -> Ganesha/Work Deity
    // Generally -> Ishta Devata (12th from Karkamsa in D9) - Advanced calc.
    // For now: Dasha Lord Deity
    const dashaLord = chart.currentDasha.mahadasha;
    const deityMap: Record<string, string> = {
        "Sun": "Lord Shiva / Rama",
        "Moon": "Goddess Parvati / Krishna",
        "Mars": "Lord Hanuman / Kartikeya",
        "Mercury": "Lord Vishnu",
        "Jupiter": "Lord Shiva / Brihaspati",
        "Venus": "Goddess Lakshmi",
        "Saturn": "Lord Hanuman / Shiva",
        "Rahu": "Goddess Durga",
        "Ketu": "Lord Ganesha"
    };

    return deityMap[dashaLord] || "Ishta Devata";
}
