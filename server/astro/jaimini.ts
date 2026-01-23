/**
 * Jaimini Astrology Calculations
 * Implements Phase 4 of the Master Framework: Social Status & Brand
 */

import { BirthChart, PlanetPosition } from "./calculations";

// Zodiac Signs for lookups
const ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SIGN_LORDS = [
    "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
    "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"
];

// Dual Lordship exceptions (Scorpio -> Mars/Ketu, Aquarius -> Saturn/Rahu)
// Standard Jaimini uses strongest lord for dual signs, but for simplicity we rely on main lords initially
// or implement strength algorithm later. Using Parashara lords for Phase 1.

export interface JaiminiData {
    arudhaLagna: {
        sign: string;
        signIndex: number;
        house: number; // House relative to Lagna
    };
    argala: {
        boosters: string[]; // Planets causing Shubha Argala on Lagna/AL
        blockers: string[]; // Planets causing Virodha Argala
    };
}

/**
 * Calculate Arudha Lagna (AL)
 * Rule: Count from Lagna to Lagna Lord, then count same distance again.
 * Exception: If AL falls in 1st or 7th from Lagna, apply jumps (10th/4th).
 */
export function calculateArudhaLagna(chart: BirthChart): JaiminiData['arudhaLagna'] {
    const ascIndex = chart.ascendant.signIndex;
    const lagnaLordName = SIGN_LORDS[ascIndex];
    const lagnaLord = chart.planets.find(p => p.planet === lagnaLordName);

    if (!lagnaLord) {
        // Fallback if something is wrong
        return { sign: chart.ascendant.sign, signIndex: ascIndex, house: 1 };
    }

    const lordSignIndex = lagnaLord.signIndex;

    // 1. Calculate distance from Lagna to Lord (forward counting)
    // Example: Lagna Aries (0), Mars in Gemini (2). Distance = 2 - 0 = +2. Distance count is inclusive or exclusive?
    // Classic way: Count signs. Aries(1) -> Gemini(3) = 3 signs.
    // Formula: (Lord - Lagna + 12) % 12.
    // Aries (0), Gemini (2). (2 - 0 + 12) % 12 = 2. 
    // Jaimini count usually is 1-based.
    // Let's us 0-based distance. 0->0 is 0 distance. 0->1 is 1 distance.

    let dist = (lordSignIndex - ascIndex + 12) % 12;

    // 2. Count same distance from Lord
    let alIndex = (lordSignIndex + dist) % 12;

    // 3. Apply Exceptions (Swasthe Daru)
    // If AL is same as Lagna (dist=0 or came back), jump to 10th
    // If AL is 7th from Lagna, jump to 4th (10th from AL)

    // Relative position of AL from Lagna
    const alRelToAsc = (alIndex - ascIndex + 12) % 12;

    if (alRelToAsc === 0) {
        // Jump to 10th from Lagna
        alIndex = (ascIndex + 9) % 12;
    } else if (alRelToAsc === 6) {
        // Jump to 4th from Lagna
        alIndex = (ascIndex + 3) % 12;
    }

    // Calculate house number (1-based)
    const house = ((alIndex - ascIndex + 12) % 12) + 1;

    return {
        sign: ZODIAC_SIGNS[alIndex],
        signIndex: alIndex,
        house
    };
}

/**
 * Calculate Argala (Intervention) on a specific House/Sign
 * Boosters (Primary): 2nd, 4th, 11th
 * Blockers (Virodha): 12th, 10th, 3rd (Obstructs 2, 4, 11 respectively)
 * Secondary: 5th (Booster) blocked by 9th.
 * Malefics in 3rd are boosters (Vipareeta Argala)? No, generally 3rd is malefic argala place but 3rd obstruction.
 * Simplified for Phase 1: Check 2, 4, 11 from Point of Interest (e.g. AL or Lagna).
 */
export function calculateArgala(chart: BirthChart, referenceSignIndex: number): JaiminiData['argala'] {
    const boosters: string[] = [];
    const blockers: string[] = [];

    const getPlanetsInSign = (idx: number) => chart.planets.filter(p => p.signIndex === idx);

    // 2nd House (Dhana Argala) blocked by 12th
    const idx2 = (referenceSignIndex + 1) % 12;
    const idx12 = (referenceSignIndex + 11) % 12;
    const p2 = getPlanetsInSign(idx2);
    const p12 = getPlanetsInSign(idx12);

    if (p2.length > 0) {
        if (p12.length <= p2.length) { // Blocked if opposing planets are greater/equal? (Simplified: check presence)
            // Add to boosters
            p2.forEach(p => boosters.push(`${p.planet} (2nd)`));
        } else {
            blockers.push(`${p12.map(p => p.planet).join(", ")} (12th blocking 2nd)`);
        }
    }

    // 4th House (Sukha Argala) blocked by 10th
    const idx4 = (referenceSignIndex + 3) % 12;
    const idx10 = (referenceSignIndex + 9) % 12;
    const p4 = getPlanetsInSign(idx4);
    const p10 = getPlanetsInSign(idx10);

    if (p4.length > 0) {
        if (p10.length <= p4.length) {
            p4.forEach(p => boosters.push(`${p.planet} (4th)`));
        } else {
            blockers.push(`${p10.map(p => p.planet).join(", ")} (10th blocking 4th)`);
        }
    }

    // 11th House (Labha Argala) blocked by 3rd
    const idx11 = (referenceSignIndex + 10) % 12;
    const idx3 = (referenceSignIndex + 2) % 12;
    const p11 = getPlanetsInSign(idx11);
    const p3 = getPlanetsInSign(idx3);

    if (p11.length > 0) {
        if (p3.length <= p11.length) {
            p11.forEach(p => boosters.push(`${p.planet} (11th)`));
        } else {
            blockers.push(`${p3.map(p => p.planet).join(", ")} (3rd blocking 11th)`);
        }
    }

    return { boosters, blockers };
}
