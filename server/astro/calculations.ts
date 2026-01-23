/**
 * Core Vedic Astrology Calculation Engine
 * Implements accurate planetary positions using astronomical algorithms
 */

// ============================================
// CONSTANTS
// ============================================

import { SwissEphemeris } from "./sweph";

export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
] as const;

export const PLANETS = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
  "Uranus", "Neptune", "Pluto"
] as const;

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
] as const;

type PlanetDignityInfo = {
  exalted: string;
  debilitated: string;
  own: readonly string[];
};

export const PLANET_DIGNITY: Record<string, PlanetDignityInfo> = {
  "Sun": { exalted: "Aries", debilitated: "Libra", own: ["Leo"] },
  "Moon": { exalted: "Taurus", debilitated: "Scorpio", own: ["Cancer"] },
  "Mars": { exalted: "Capricorn", debilitated: "Cancer", own: ["Aries", "Scorpio"] },
  "Mercury": { exalted: "Virgo", debilitated: "Pisces", own: ["Gemini", "Virgo"] },
  "Jupiter": { exalted: "Cancer", debilitated: "Capricorn", own: ["Sagittarius", "Pisces"] },
  "Venus": { exalted: "Pisces", debilitated: "Virgo", own: ["Taurus", "Libra"] },
  "Saturn": { exalted: "Libra", debilitated: "Aries", own: ["Capricorn", "Aquarius"] },
  "Rahu": { exalted: "Taurus", debilitated: "Scorpio", own: ["Aquarius"] }, // Common view
  "Ketu": { exalted: "Scorpio", debilitated: "Taurus", own: ["Scorpio"] }   // Common view
};

export const NAKSHATRA_LORDS = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
  "Jupiter", "Saturn", "Mercury", "Ketu", "Venus", "Sun",
  "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
  "Jupiter", "Saturn", "Mercury"
] as const;

// Vimshottari Dasha periods in years
export const DASHA_PERIODS: Record<string, number> = {
  "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
  "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17
};

// Total Vimshottari cycle = 120 years
export const TOTAL_DASHA_YEARS = 120;

// Ayanamsa calculation - Lahiri (Chitrapaksha)
export function calculateAyanamsa(jd: number): number {
  // Lahiri ayanamsa calculation based on IAU 1976 precession
  const t = (jd - 2451545.0) / 36525;
  // Lahiri ayanamsa for J2000.0 epoch
  const ayanamsa = 23.85 + 0.0137 * (jd - 2451545.0) / 365.25;
  return ayanamsa;
}

// Planet maturity ages
export const PLANET_MATURITY: Record<string, number> = {
  "Jupiter": 16, "Sun": 22, "Moon": 24, "Venus": 25,
  "Mars": 28, "Mercury": 32, "Saturn": 36, "Rahu": 42, "Ketu": 48,
  "Uranus": 48, "Neptune": 48, "Pluto": 48 // Defaulting outer planets
};

// Planet colors for UI
export const PLANET_COLORS: Record<string, string> = {
  "Sun": "#FF6B00", "Moon": "#C0C0C0", "Mars": "#DC2626",
  "Mercury": "#22C55E", "Jupiter": "#EAB308", "Venus": "#EC4899",
  "Saturn": "#3B82F6", "Rahu": "#6366F1", "Ketu": "#8B5CF6",
  "Uranus": "#06B6D4", "Neptune": "#3B82F6", "Pluto": "#64748B"
};

export const SIGN_LORDS = [
  "Mars",    // Aries
  "Venus",   // Taurus
  "Mercury", // Gemini
  "Moon",    // Cancer
  "Sun",     // Leo
  "Mercury", // Virgo
  "Venus",   // Libra
  "Mars",    // Scorpio
  "Jupiter", // Sagittarius
  "Saturn",  // Capricorn
  "Saturn",  // Aquarius
  "Jupiter"  // Pisces
] as const;

export function getSignLord(signIndex: number): string {
  return SIGN_LORDS[signIndex % 12];
}

// ============================================
// TYPES
// ============================================

export interface BirthData {
  date: string;      // YYYY-MM-DD
  time: string;      // HH:MM:SS
  latitude: number;
  longitude: number;
  timezone: number;  // Offset in hours
  ayanamsa?: "lahiri" | "raman" | "krishnamurti";
  placeName?: string;
}

export interface PlanetPosition {
  planet: string;
  longitude: number;
  sign: string;
  signIndex: number;
  degree: number;
  minute: number;
  nakshatra: string;
  nakshatraIndex: number;
  nakshatraPada: number;
  isRetrograde: boolean;
  house: number;
}

export interface HouseCusp {
  house: number;
  sign: string;
  signIndex: number;
  degree: number;
  minute: number;
  second: number;
  lord: string;
}

export interface DashaPeriod {
  planet: string;
  startDate: Date;
  endDate: Date;
  level: "mahadasha" | "antardasha" | "pratyantardasha";
  years: number;
  subPeriods?: DashaPeriod[];
}

export interface VargaChart {
  name: string;
  division: number;
  planets: PlanetPosition[];
  ascendant: { sign: string; signIndex: number; degree: number; minute: number; second: number };
}

export interface BirthChart {
  birthData: BirthData;
  ascendant: {
    sign: string;
    signIndex: number;
    degree: number;
    minute: number;
    second: number;
    nakshatra: string;
  };
  planets: PlanetPosition[];
  houses: HouseCusp[];
  ayanamsaUsed: string;
  ayanamsaValue: number;
}

export interface FullChartData {
  d1: BirthChart;
  d2?: VargaChart;
  d3?: VargaChart;
  d4?: VargaChart;
  d7?: VargaChart;
  d9?: VargaChart;
  d10?: VargaChart;
  d8?: VargaChart; // Ashtamsha
  d12?: VargaChart;
  d16?: VargaChart;
  d24?: VargaChart;
  d60?: VargaChart;
  dashas: DashaPeriod[];
  currentDasha: {
    mahadasha: string;
    mahadashaStart: Date;
    mahadashaEnd: Date;
    antardasha: string;
    antardashaStart: Date;
    antardashaEnd: Date;
    pratyantardasha: string;
    sookshmadasha: string;
    praanadasha: string;
    progress: number;
  };
  yogas: DetectedYoga[];
}

export interface DetectedYoga {
  name: string;
  category: string;
  strength: "strong" | "moderate" | "weak";
  description: string;
  effects?: string;
  careerImplication?: string;
}

// ============================================
// ASTRONOMICAL CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate Julian Day Number from date (Deprecated, use SwissEphemeris.getJulianDay)
 */
export function calculateJulianDay(year: number, month: number, day: number, hour: number = 0): number {
  let y = year;
  let m = month;

  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);

  return Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day + hour / 24 + b - 1524.5;
}

/**
 * Calculate sidereal time for a given Julian Day and longitude
 */
export function calculateSiderealTime(jd: number, longitude: number): number {
  const t = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t - t * t * t / 38710000;

  gmst = gmst % 360;
  if (gmst < 0) gmst += 360;

  // Local sidereal time
  let lst = gmst + longitude;
  lst = lst % 360;
  if (lst < 0) lst += 360;

  return lst;
}

/**
 * Calculate Ascendant (Lagna) degree with professional accuracy using Swiss Ephemeris
 */
export async function calculateAscendantPrecision(
  jd: number,
  latitude: number,
  longitude: number
): Promise<{ siderealDegree: number }> {
  const result = await SwissEphemeris.getHouses(jd, latitude, longitude);
  return {
    siderealDegree: result.ascendant
  };
}

/**
 * High-precision planetary position calculation using Swiss Ephemeris
 */
export async function calculatePlanetaryPositionsPrecision(jd: number): Promise<PlanetPosition[]> {
  const planets: PlanetPosition[] = [];
  const planetNames = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Uranus", "Neptune", "Pluto"];

  for (const name of planetNames) {
    const id = SwissEphemeris.getPlanetId(name);
    const pos = await SwissEphemeris.getPlanetPosition(jd, id);

    const signIndex = Math.floor(pos.longitude / 30);
    const degreeInSign = pos.longitude % 30;
    const nakIndex = Math.floor(pos.longitude / (360 / 27));

    planets.push({
      planet: name,
      longitude: pos.longitude,
      sign: ZODIAC_SIGNS[signIndex],
      signIndex,
      degree: Math.floor(degreeInSign),
      minute: Math.floor((degreeInSign % 1) * 60),
      nakshatra: NAKSHATRAS[nakIndex],
      nakshatraIndex: nakIndex,
      nakshatraPada: Math.min(Math.floor((pos.longitude % (360 / 27)) / (360 / (27 * 4))) + 1, 4),
      isRetrograde: pos.speedLong < 0,
      house: 1 // Will be set later
    });
  }

  // Calculate Ketu (always 180° from Rahu)
  const rahu = planets.find(p => p.planet === "Rahu");
  if (rahu) {
    const ketuLong = (rahu.longitude + 180) % 360;
    const signIndex = Math.floor(ketuLong / 30);
    const degreeInSign = ketuLong % 30;
    const nakIndex = Math.floor(ketuLong / (360 / 27));

    planets.push({
      planet: "Ketu",
      longitude: ketuLong,
      sign: ZODIAC_SIGNS[signIndex],
      signIndex,
      degree: Math.floor(degreeInSign),
      minute: Math.floor((degreeInSign % 1) * 60),
      nakshatra: NAKSHATRAS[nakIndex],
      nakshatraIndex: nakIndex,
      nakshatraPada: Math.min(Math.floor((ketuLong % (360 / 27)) / (360 / (27 * 4))) + 1, 4),
      isRetrograde: rahu.isRetrograde, // Ketu is retrograde if Rahu is
      house: 1
    });
  }

  return planets;
}

/**
 * Calculate house cusps using Whole Sign system
 */
export function calculateHouseCusps(ascendantSignIndex: number): HouseCusp[] {

  const houses: HouseCusp[] = [];

  for (let i = 0; i < 12; i++) {
    const signIndex = (ascendantSignIndex + i) % 12;
    const sign = ZODIAC_SIGNS[signIndex];

    houses.push({
      house: i + 1,
      sign,
      signIndex,
      degree: 0,
      minute: 0, // For whole sign, cusps are at 0 degrees, 0 minutes, 0 seconds
      second: 0,
      lord: getSignLord(signIndex)
    });
  }

  return houses;
}

/**
 * Assign planets to houses based on ascendant
 */
export function assignPlanetsToHouses(
  planets: PlanetPosition[],
  ascendantSignIndex: number
): PlanetPosition[] {
  return planets.map(planet => {
    let house = planet.signIndex - ascendantSignIndex + 1;
    if (house <= 0) house += 12;
    return { ...planet, house };
  });
}

/**
 * Calculate Vimshottari Dasha periods with accurate dates
 */
export function calculateDashas(
  moonLongitude: number,
  birthDate: Date,
  depth: number = 3
): DashaPeriod[] {
  // Calculate nakshatra and position
  const nakshatraSpan = 360 / 27;
  const nakshatraIndex = Math.floor(moonLongitude / nakshatraSpan);
  const nakshatraLord = NAKSHATRA_LORDS[nakshatraIndex];

  // Calculate balance of dasha at birth
  const positionInNakshatra = moonLongitude % nakshatraSpan;
  const portionTraversed = positionInNakshatra / nakshatraSpan;
  const remainingPortion = 1 - portionTraversed;

  const dashaPeriod = DASHA_PERIODS[nakshatraLord];
  const balanceYears = dashaPeriod * remainingPortion;

  // Dasha sequence starting from nakshatra lord
  const dashaSequence = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
  ];

  const startIndex = dashaSequence.indexOf(nakshatraLord);
  const orderedSequence = [
    ...dashaSequence.slice(startIndex),
    ...dashaSequence.slice(0, startIndex)
  ];

  const dashas: DashaPeriod[] = [];
  let currentDate = new Date(birthDate);

  // First dasha with balance
  const balanceDays = balanceYears * 365.25;
  const firstEndDate = new Date(currentDate.getTime() + balanceDays * 24 * 60 * 60 * 1000);

  dashas.push({
    planet: orderedSequence[0],
    startDate: new Date(currentDate),
    endDate: firstEndDate,
    level: "mahadasha",
    years: balanceYears,
    subPeriods: calculateAntardashas(orderedSequence[0], currentDate, firstEndDate, balanceYears, depth)
  });

  currentDate = new Date(firstEndDate);

  // Subsequent dashas (full periods)
  for (let i = 1; i < 9; i++) {
    const planet = orderedSequence[i];
    const years = DASHA_PERIODS[planet];
    const days = years * 365.25;
    const endDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);

    dashas.push({
      planet,
      startDate: new Date(currentDate),
      endDate,
      level: "mahadasha",
      years,
      subPeriods: calculateAntardashas(planet, currentDate, endDate, years, depth)
    });

    currentDate = new Date(endDate);
  }

  return dashas;
}

/**
 * Calculate Antardasha (sub-periods) within a Mahadasha
 */
function calculateAntardashas(
  mahadashaLord: string,
  startDate: Date,
  endDate: Date,
  totalYears: number,
  depth: number = 3
): DashaPeriod[] {
  const dashaSequence = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
  ];

  const startIndex = dashaSequence.indexOf(mahadashaLord);
  const orderedSequence = [
    ...dashaSequence.slice(startIndex),
    ...dashaSequence.slice(0, startIndex)
  ];

  const antardashas: DashaPeriod[] = [];
  let currentDate = new Date(startDate);

  for (const planet of orderedSequence) {
    // Antardasha duration = (Mahadasha years × Antardasha planet years) / 120
    const antarYears = (totalYears * DASHA_PERIODS[planet]) / TOTAL_DASHA_YEARS;
    const antarDays = antarYears * 365.25;
    const antarEndDate = new Date(currentDate.getTime() + antarDays * 24 * 60 * 60 * 1000);

    antardashas.push({
      planet,
      startDate: new Date(currentDate),
      endDate: antarEndDate,
      level: "antardasha",
      years: antarYears,
      subPeriods: depth > 2 ? calculatePratyantardashas(mahadashaLord, planet, currentDate, antarEndDate, antarYears, depth) : undefined
    });

    currentDate = new Date(antarEndDate);
  }

  return antardashas;
}

/**
 * Calculate Pratyantardasha (sub-sub-periods) within an Antardasha
 */
function calculatePratyantardashas(
  mahadashaLord: string,
  antardashaLord: string,
  startDate: Date,
  endDate: Date,
  totalYears: number,
  depth: number = 3
): DashaPeriod[] {
  const dashaSequence = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
  ];

  const startIndex = dashaSequence.indexOf(antardashaLord);
  const orderedSequence = [
    ...dashaSequence.slice(startIndex),
    ...dashaSequence.slice(0, startIndex)
  ];

  const pratyantardashas: DashaPeriod[] = [];
  let currentDate = new Date(startDate);

  for (const planet of orderedSequence) {
    // Pratyantardasha duration = (Antardasha years × Planet years) / 120
    const pratyantarYears = (totalYears * DASHA_PERIODS[planet]) / TOTAL_DASHA_YEARS;
    const pratyantarDays = pratyantarYears * 365.25;
    const pratyantarEndDate = new Date(currentDate.getTime() + pratyantarDays * 24 * 60 * 60 * 1000);

    pratyantardashas.push({
      planet,
      startDate: new Date(currentDate),
      endDate: pratyantarEndDate,
      level: "pratyantardasha",
      years: pratyantarYears,
      subPeriods: depth > 3 ? calculateSookshmadashas(mahadashaLord, antardashaLord, planet, currentDate, pratyantarEndDate, pratyantarYears, depth) : undefined
    });

    currentDate = new Date(pratyantarEndDate);
  }

  return pratyantardashas;
}

/**
 * Calculate Sookshmadasha (4th level)
 */
function calculateSookshmadashas(
  mdLord: string,
  adLord: string,
  pdLord: string,
  startDate: Date,
  endDate: Date,
  totalYears: number,
  depth: number = 3
): DashaPeriod[] {
  const dashaSequence = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
  const startIndex = dashaSequence.indexOf(pdLord);
  const orderedSequence = [...dashaSequence.slice(startIndex), ...dashaSequence.slice(0, startIndex)];

  const sookshmadashas: DashaPeriod[] = [];
  let currentDate = new Date(startDate);

  for (const planet of orderedSequence) {
    const years = (totalYears * DASHA_PERIODS[planet]) / TOTAL_DASHA_YEARS;
    const days = years * 365.25;
    const nextEndDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);

    sookshmadashas.push({
      planet,
      startDate: new Date(currentDate),
      endDate: nextEndDate,
      level: "sookshmadasha" as any,
      years,
      subPeriods: depth > 4 ? calculatePraanadashas(mdLord, adLord, pdLord, planet, currentDate, nextEndDate, years, depth) : undefined
    });

    currentDate = new Date(nextEndDate);
  }
  return sookshmadashas;
}

/**
 * Calculate Praanadasha (5th level - Daily/Hourly)
 */
function calculatePraanadashas(
  mdLord: string,
  adLord: string,
  pdLord: string,
  sdLord: string,
  startDate: Date,
  endDate: Date,
  totalYears: number,
  depth: number = 3
): DashaPeriod[] {
  const dashaSequence = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
  const startIndex = dashaSequence.indexOf(sdLord);
  const orderedSequence = [...dashaSequence.slice(startIndex), ...dashaSequence.slice(0, startIndex)];

  const praanadashas: DashaPeriod[] = [];
  let currentDate = new Date(startDate);

  for (const planet of orderedSequence) {
    const years = (totalYears * DASHA_PERIODS[planet]) / TOTAL_DASHA_YEARS;
    const days = years * 365.25;
    const nextEndDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);

    praanadashas.push({
      planet,
      startDate: new Date(currentDate),
      endDate: nextEndDate,
      level: "praanadasha" as any,
      years
    });

    currentDate = new Date(nextEndDate);
  }
  return praanadashas;
}

/**
 * Get current Dasha period with progress calculation
 */
export function getCurrentDasha(
  dashas: DashaPeriod[],
  date: Date = new Date()
): {
  mahadasha: string;
  mahadashaStart: Date;
  mahadashaEnd: Date;
  antardasha: string;
  antardashaStart: Date;
  antardashaEnd: Date;
  pratyantardasha: string;
  sookshmadasha: string;
  praanadasha: string;
  progress: number;
} {
  let result = {
    mahadasha: "",
    mahadashaStart: new Date(),
    mahadashaEnd: new Date(),
    antardasha: "",
    antardashaStart: new Date(),
    antardashaEnd: new Date(),
    pratyantardasha: "",
    sookshmadasha: "",
    praanadasha: "",
    progress: 0
  };

  for (const dasha of dashas) {
    if (date >= dasha.startDate && date <= dasha.endDate) {
      result.mahadasha = dasha.planet;
      result.mahadashaStart = dasha.startDate;
      result.mahadashaEnd = dasha.endDate;

      // Calculate Mahadasha progress
      const totalDuration = dasha.endDate.getTime() - dasha.startDate.getTime();
      const elapsed = date.getTime() - dasha.startDate.getTime();
      result.progress = Math.round((elapsed / totalDuration) * 100);

      if (dasha.subPeriods) {
        for (const antar of dasha.subPeriods) {
          if (date >= antar.startDate && date <= antar.endDate) {
            result.antardasha = antar.planet;
            result.antardashaStart = antar.startDate;
            result.antardashaEnd = antar.endDate;

            // Check for Pratyantardasha
            if (antar.subPeriods) {
              for (const pratyantar of antar.subPeriods) {
                if (date >= pratyantar.startDate && date <= pratyantar.endDate) {
                  result.pratyantardasha = pratyantar.planet;

                  // Check for Sookshmadasha
                  if (pratyantar.subPeriods) {
                    for (const sookshma of pratyantar.subPeriods) {
                      if (date >= sookshma.startDate && date <= sookshma.endDate) {
                        result.sookshmadasha = sookshma.planet;

                        // Check for Praanadasha
                        if (sookshma.subPeriods) {
                          for (const praana of sookshma.subPeriods) {
                            if (date >= praana.startDate && date <= praana.endDate) {
                              result.praanadasha = praana.planet;
                              break;
                            }
                          }
                        }
                        break;
                      }
                    }
                  }
                  break;
                }
              }
            }
            break;
          }
        }
      }
      break;
    }
  }

  return result;
}

/**
 * Prune dasha tree to only include current and relevant future periods for AI context
 */
export function pruneDashaTree(dasha: any, currentDate: Date = new Date()) {
  if (!dasha) return null;
  const pruned = { ...dasha };

  if (pruned.subPeriods) {
    // Keep all Antardashas
    pruned.subPeriods = pruned.subPeriods.map((antar: any) => {
      const prunedAntar = { ...antar };

      const isCurrentAntar = currentDate >= new Date(antar.startDate) && currentDate <= new Date(antar.endDate);

      if (prunedAntar.subPeriods) {
        if (isCurrentAntar) {
          // For current Antardasha, keep all Pratyantardashas
          prunedAntar.subPeriods = prunedAntar.subPeriods.map((pratyantar: any) => {
            const prunedPratyantar = { ...pratyantar };
            const isCurrentPratyantar = currentDate >= new Date(pratyantar.startDate) && currentDate <= new Date(pratyantar.endDate);

            if (prunedPratyantar.subPeriods) {
              if (isCurrentPratyantar) {
                // For current Pratyantardasha, keep all Sookshma
                prunedPratyantar.subPeriods = prunedPratyantar.subPeriods.map((sookshma: any) => {
                  const prunedSookshma = { ...sookshma };
                  const isCurrentSookshma = currentDate >= new Date(sookshma.startDate) && currentDate <= new Date(sookshma.endDate);

                  if (!isCurrentSookshma && prunedSookshma.subPeriods) {
                    delete prunedSookshma.subPeriods;
                  }
                  return prunedSookshma;
                });
              } else {
                // Future/Past Pratyantars: remove Sookshma/Praana
                delete prunedPratyantar.subPeriods;
              }
            }
            return prunedPratyantar;
          });
        } else {
          // Not current Antardasha: remove deep layers
          delete prunedAntar.subPeriods;
        }
      }
      return prunedAntar;
    });
  }
  return pruned;
}

/**
 * Calculate Varga (Divisional) Chart with CORRECT formulas
 */
export function calculateVargaChart(
  d1Planets: PlanetPosition[],
  ascendantLongitude: number,
  division: number,
  name: string
): VargaChart {
  const vargaPlanets: PlanetPosition[] = d1Planets.map(planet => {
    // Total longitude in D1
    const totalDegree = planet.longitude;

    let vargaSignIndex: number;
    const degreeInSign = totalDegree % 30;
    const d1SignIndex = Math.floor(totalDegree / 30);

    // Apply correct Varga calculation formulas
    // Note: All sign calculations use 0-based indices (Aries=0, Pisces=11)

    switch (division) {
      case 2: // Hora (D2) - Parashara
        // Odd: Sun (Leo), Even: Moon (Cancer)
        if (d1SignIndex % 2 === 0) { // Odd signs (0, 2, 4...) -> Leo (4)
          vargaSignIndex = degreeInSign < 15 ? 4 : 3;
        } else { // Even signs (1, 3, 5...) -> Cancer (3)
          vargaSignIndex = degreeInSign < 15 ? 3 : 4;
        }
        break;

      case 3: // Drekkana (D3) - Standard Parashara
        // 0-10°: Same sign, 10-20°: 5th sign, 20-30°: 9th sign
        const d3Part = Math.floor(degreeInSign / 10);
        const d3Offsets = [0, 4, 8]; // 1st, 5th, 9th
        vargaSignIndex = (d1SignIndex + d3Offsets[d3Part]) % 12;
        break;

      case 4: // Chaturthamsa (D4) - Parashara
        // Standard Rule: Kendra distribution (1, 4, 7, 10 pattern)
        // Starts from the sign itself.
        // Sign 1: 1, 4, 7, 10
        // Sign 2: 2, 5, 8, 11
        // Sign 3: 3, 6, 9, 12
        const chaturPart = Math.floor(degreeInSign / 7.5);
        vargaSignIndex = (d1SignIndex + (chaturPart * 3)) % 12;
        break;

      case 7: // Saptamsa (D7)
        const d7Part = Math.floor(degreeInSign / (30 / 7));
        if (d1SignIndex % 2 === 0) { // Odd signs start from Sign
          vargaSignIndex = (d1SignIndex + d7Part) % 12;
        } else { // Even signs start from 7th from Sign
          vargaSignIndex = (d1SignIndex + 6 + d7Part) % 12;
        }
        break;

      case 8: // Ashtamsha (D8)
        const d8Part = Math.floor(degreeInSign / 3.75); // 30 / 8 = 3.75
        // Movable (1,4,7,10): Start Aries (0)
        // Fixed (2,5,8,11): Start Sagittarius (8)
        // Dual (3,6,9,12): Start Leo (4)
        if (d1SignIndex % 3 === 0) { // Movable: Aries, Cancer, Libra, Cap (Indices 0, 3, 6, 9 -> %3 == 0)
          vargaSignIndex = (0 + d8Part) % 12;
        } else if (d1SignIndex % 3 === 1) { // Fixed: Taurus, Leo, Scorp, Aqu (Indices 1, 4, 7, 10 -> %3 == 1)
          vargaSignIndex = (8 + d8Part) % 12;
        } else { // Dual: Gemini, Virgo, Sag, Pisces (Indices 2, 5, 8, 11 -> %3 == 2)
          vargaSignIndex = (4 + d8Part) % 12;
        }
        break;

      case 9: // Navamsa (D9)
        const d9Part = Math.floor(degreeInSign / (30 / 9));
        // Fire (0,4,8) start Aries(0)
        // Earth (1,5,9) start Capricorn(9)
        // Air (2,6,10) start Libra(6)
        // Water (3,7,11) start Cancer(3)
        const element = d1SignIndex % 4;
        const startSign = [0, 9, 6, 3][element];
        vargaSignIndex = (startSign + d9Part) % 12;
        break;

      case 10: // Dasamsa (D10)
        const d10Part = Math.floor(degreeInSign / 3);
        if (d1SignIndex % 2 === 0) { // Odd: Start from Sign
          vargaSignIndex = (d1SignIndex + d10Part) % 12;
        } else { // Even: Start from 9th
          vargaSignIndex = (d1SignIndex + 8 + d10Part) % 12;
        }
        break;

      case 12: // Dwadasamsa (D12)
        // Starts from Sign itself
        const d12Part = Math.floor(degreeInSign / 2.5);
        vargaSignIndex = (d1SignIndex + d12Part) % 12;
        break;

      case 16: // Shodashamsa (D16)
        const d16Part = Math.floor(degreeInSign / 1.875);
        if (d1SignIndex % 3 === 0) { // Movable: Aries(0)
          vargaSignIndex = (0 + d16Part) % 12;
        } else if (d1SignIndex % 3 === 1) { // Fixed: Leo(4)
          vargaSignIndex = (4 + d16Part) % 12;
        } else { // Dual: Sagittarius(8)
          vargaSignIndex = (8 + d16Part) % 12;
        }
        break;

      case 24: // Chaturvimshamsha (D24)
        const d24Part = Math.floor(degreeInSign / 1.25);
        if (d1SignIndex % 2 === 0) { // Odd: Start Leo(4)
          vargaSignIndex = (4 + d24Part) % 12;
        } else { // Even: Start Cancer(3)
          vargaSignIndex = (3 + d24Part) % 12;
        }
        break;

      case 60: // Shashtiamsa (D60)
        const d60Part = Math.floor(degreeInSign / 0.5);
        // Standard: Start from Sign itself
        vargaSignIndex = (d1SignIndex + d60Part) % 12;
        break;

      default:
        // Use standard "harmonic" rule if defined, else generic continuous
        const defaultPart = Math.floor(degreeInSign / (30 / division));
        vargaSignIndex = (d1SignIndex * division + defaultPart) % 12; // Not really valid for all
    }

    // Calculate degree within the varga sign
    const vargaDegreeInSign = (degreeInSign * division) % 30;

    return {
      ...planet,
      longitude: vargaSignIndex * 30 + vargaDegreeInSign,
      sign: ZODIAC_SIGNS[vargaSignIndex],
      signIndex: vargaSignIndex,
      degree: Math.floor(vargaDegreeInSign),
      minute: Math.floor((vargaDegreeInSign % 1) * 60),
      second: Math.round(((vargaDegreeInSign % 1) * 60 % 1) * 60),
      house: 1
    };
  });

  // Calculate Varga ascendant
  const ascDegreeInSign = ascendantLongitude % 30;
  const ascD1SignIndex = Math.floor(ascendantLongitude / 30);
  console.log(`[DEBUG] Chart: ${name}, division: ${division}, ascD1SignIndex: ${ascD1SignIndex}, ascDegreeInSign: ${ascDegreeInSign}`);
  let vargaAscSignIndex: number;

  switch (division) {
    case 2:
      vargaAscSignIndex = ascD1SignIndex % 2 === 0
        ? (ascDegreeInSign < 15 ? 4 : 3)
        : (ascDegreeInSign < 15 ? 3 : 4);
      break;
    case 3: // Drekkana - Standard Parashara
      const ascD3Part = Math.floor(ascDegreeInSign / 10);
      const ascD3Offsets = [0, 4, 8];
      vargaAscSignIndex = (ascD1SignIndex + ascD3Offsets[ascD3Part]) % 12;
      break;
    case 4:
      vargaAscSignIndex = (ascD1SignIndex + (Math.floor(ascDegreeInSign / 7.5) * 3)) % 12;
      break;
    case 7:
      const v7Part = Math.floor(ascDegreeInSign / (30 / 7));
      vargaAscSignIndex = (ascD1SignIndex % 2 === 0) ? (ascD1SignIndex + v7Part) % 12 : (ascD1SignIndex + 6 + v7Part) % 12;
      break;
    case 8: // Ashtamsha Asc
      const ascD8Part = Math.floor(ascDegreeInSign / 3.75);
      if (ascD1SignIndex % 3 === 0) { // Movable
        vargaAscSignIndex = (0 + ascD8Part) % 12;
      } else if (ascD1SignIndex % 3 === 1) { // Fixed
        vargaAscSignIndex = (8 + ascD8Part) % 12;
      } else { // Dual
        vargaAscSignIndex = (4 + ascD8Part) % 12;
      }
      break;
    case 9:
      const ascNavamsaPart = Math.floor(ascDegreeInSign / (30 / 9));
      const ascElement = ascD1SignIndex % 4;
      const ascStartSign = [0, 9, 6, 3][ascElement];
      vargaAscSignIndex = (ascStartSign + ascNavamsaPart) % 12;
      break;
    case 10:
      const ascDasamsaPart = Math.floor(ascDegreeInSign / 3);
      vargaAscSignIndex = (ascD1SignIndex % 2 === 0) ? (ascD1SignIndex + ascDasamsaPart) % 12 : (ascD1SignIndex + 8 + ascDasamsaPart) % 12;
      break;
    case 12:
      vargaAscSignIndex = (ascD1SignIndex + Math.floor(ascDegreeInSign / 2.5)) % 12;
      break;
    case 16: // Shodashamsa - Apply same logic as planets
      const v16Part = Math.floor(ascDegreeInSign / 1.875);
      if (ascD1SignIndex % 3 === 0) { // Movable: Aries(0)
        vargaAscSignIndex = (0 + v16Part) % 12;
      } else if (ascD1SignIndex % 3 === 1) { // Fixed: Leo(4)
        vargaAscSignIndex = (4 + v16Part) % 12;
      } else { // Dual: Sagittarius(8)
        vargaAscSignIndex = (8 + v16Part) % 12;
      }
      break;
    case 24:
      const ascD24Part = Math.floor(ascDegreeInSign / 1.25);
      vargaAscSignIndex = (ascD1SignIndex % 2 === 0) ? (4 + ascD24Part) % 12 : (3 + ascD24Part) % 12;
      break;
    case 60:
      vargaAscSignIndex = (ascD1SignIndex + Math.floor(ascDegreeInSign / 0.5)) % 12;
      break;
    default:
      const ascPart = Math.floor(ascDegreeInSign / (30 / division));
      vargaAscSignIndex = (ascD1SignIndex * division + ascPart) % 12;
  }

  // Assign houses in varga chart
  const planetsWithHouses = assignPlanetsToHouses(vargaPlanets, vargaAscSignIndex);

  return {
    name,
    division,
    planets: planetsWithHouses,
    ascendant: {
      sign: ZODIAC_SIGNS[vargaAscSignIndex],
      signIndex: vargaAscSignIndex,
      degree: Math.floor((ascDegreeInSign * division) % 30),
      minute: Math.floor((((ascDegreeInSign * division) % 30) % 1) * 60),
      second: Math.round(((((ascDegreeInSign * division) % 30) % 1) * 60 % 1) * 60)
    }
  };
}

/**
 * Detect Yogas (planetary combinations)
 */
export function detectYogas(chart: BirthChart): DetectedYoga[] {
  const yogas: DetectedYoga[] = [];
  const planets = chart.planets;
  const houses = chart.houses;

  // Helper functions
  const getPlanetByName = (name: string) => planets.find(p => p.planet === name);
  const getPlanetsInHouse = (house: number) => planets.filter(p => p.house === house);
  const getHouseLord = (house: number) => houses[house - 1]?.lord;

  // Check if two planets are in kendra (1,4,7,10) from each other
  const areInKendra = (house1: number, house2: number) => {
    const diff = Math.abs(house1 - house2);
    return [0, 3, 6, 9].includes(diff) || [0, 3, 6, 9].includes(12 - diff);
  };

  // 1. Dhana Yoga - Lords of 2nd and 11th in conjunction or mutual aspect
  const lord2 = getHouseLord(2);
  const lord11 = getHouseLord(11);
  const planet2 = getPlanetByName(lord2 || "");
  const planet11 = getPlanetByName(lord11 || "");

  if (planet2 && planet11 && planet2.house === planet11.house) {
    yogas.push({
      name: "Dhana Yoga",
      category: "wealth",
      strength: "strong",
      description: "Lords of 2nd and 11th houses are conjunct, indicating strong wealth potential.",
      effects: "Accumulation of wealth through multiple sources.",
      careerImplication: "Favorable for careers in finance, business, and wealth management."
    });
  }

  // 2. Gaja Kesari Yoga - Jupiter in kendra from Moon
  const jupiter = getPlanetByName("Jupiter");
  const moon = getPlanetByName("Moon");
  if (jupiter && moon && areInKendra(jupiter.house, moon.house)) {
    yogas.push({
      name: "Gaja Kesari Yoga",
      category: "career",
      strength: "strong",
      description: "Jupiter in kendra from Moon, bestowing wisdom, fame, and prosperity.",
      effects: "Recognition, respect, and success in endeavors.",
      careerImplication: "Success in teaching, advisory roles, and positions of authority."
    });
  }

  // 3. Raja Yoga - Lord of trikona conjunct lord of kendra
  const trikonaHouses = [1, 5, 9];
  const kendraHouses = [1, 4, 7, 10];
  const trikonaLords = trikonaHouses.map(h => getHouseLord(h));
  const kendraLords = kendraHouses.map(h => getHouseLord(h));

  for (const tLord of trikonaLords) {
    for (const kLord of kendraLords) {
      if (tLord && kLord && tLord !== kLord) {
        const tPlanet = getPlanetByName(tLord);
        const kPlanet = getPlanetByName(kLord);
        if (tPlanet && kPlanet && tPlanet.house === kPlanet.house) {
          yogas.push({
            name: "Raja Yoga",
            category: "raja",
            strength: "strong",
            description: `Lords of trikona and kendra houses (${tLord} and ${kLord}) are conjunct.`,
            effects: "Rise to positions of power and authority.",
            careerImplication: "Indicates rise to positions of power and leadership."
          });
          break;
        }
      }
    }
  }

  // 4. Budhaditya Yoga - Sun and Mercury conjunction
  const sun = getPlanetByName("Sun");
  const mercury = getPlanetByName("Mercury");
  if (sun && mercury && sun.house === mercury.house) {
    yogas.push({
      name: "Nipuna (Budha-Aditya) Yoga",
      category: "career",
      strength: "moderate",
      description: "Sun and Mercury conjunction, bestowing intelligence and communication skills.",
      effects: "Sharp intellect, good communication, and analytical abilities.",
      careerImplication: "Excellent for careers in communication, writing, and intellectual pursuits."
    });
  }

  // 5. Chandra-Mangala Yoga - Moon and Mars conjunction
  const mars = getPlanetByName("Mars");
  if (moon && mars && moon.house === mars.house) {
    yogas.push({
      name: "Chandra-Mangala Yoga",
      category: "wealth",
      strength: "moderate",
      description: "Moon and Mars conjunction, indicating earning through courage and initiative.",
      effects: "Wealth through bold actions and entrepreneurship.",
      careerImplication: "Success in real estate, manufacturing, and entrepreneurial ventures."
    });
  }

  // 6. Vasumati Yoga - Benefics in upachayas (3, 6, 10, 11) from Moon
  const benefics = ["Jupiter", "Venus", "Mercury"];
  const upachayas = [3, 6, 10, 11];
  let beneficsInUpachaya = 0;

  if (moon) {
    for (const benefic of benefics) {
      const planet = getPlanetByName(benefic);
      if (planet) {
        let houseFromMoon = planet.house - moon.house + 1;
        if (houseFromMoon <= 0) houseFromMoon += 12;
        if (upachayas.includes(houseFromMoon)) beneficsInUpachaya++;
      }
    }
  }

  if (beneficsInUpachaya >= 2) {
    yogas.push({
      name: "Vasumati Yoga",
      category: "wealth",
      strength: beneficsInUpachaya >= 3 ? "strong" : "moderate",
      description: "Benefic planets in upachaya houses from Moon, indicating wealth accumulation.",
      effects: "Steady growth of wealth over time.",
      careerImplication: "Financial success through multiple income streams."
    });
  }

  // 7. Saraswati Yoga - Jupiter, Venus, Mercury in kendras or trikonas
  const saraswatiPlanets = ["Jupiter", "Venus", "Mercury"];
  const kendraTrikonas = [1, 4, 5, 7, 9, 10];
  let saraswatiCount = 0;

  for (const pName of saraswatiPlanets) {
    const planet = getPlanetByName(pName);
    if (planet && kendraTrikonas.includes(planet.house)) {
      saraswatiCount++;
    }
  }

  if (saraswatiCount >= 2) {
    yogas.push({
      name: "Saraswati Yoga",
      category: "knowledge",
      strength: saraswatiCount >= 3 ? "strong" : "moderate",
      description: "Jupiter, Venus, and Mercury well-placed, bestowing knowledge and artistic talents.",
      effects: "Excellence in learning, arts, and creative expression.",
      careerImplication: "Excellence in education, arts, music, and creative fields."
    });
  }

  // 8. Lakshmi Yoga - Lord of 9th in kendra/trikona and strong
  const lord9 = getHouseLord(9);
  const planet9 = getPlanetByName(lord9 || "");
  if (planet9 && kendraTrikonas.includes(planet9.house)) {
    yogas.push({
      name: "Lakshmi Yoga",
      category: "wealth",
      strength: "strong",
      description: "9th lord well-placed in kendra or trikona, blessing with fortune and prosperity.",
      effects: "Good fortune, wealth, and spiritual growth.",
      careerImplication: "Success in politics, government, and public service."
    });
  }

  // 9. Parivartana Yoga (Exchange of Signs)
  for (let h1 = 1; h1 <= 12; h1++) {
    for (let h2 = h1 + 1; h2 <= 12; h2++) {
      const lord1 = getHouseLord(h1);
      const lord2 = getHouseLord(h2);

      const p1 = getPlanetByName(lord1 || "");
      const p2 = getPlanetByName(lord2 || "");

      // Avoid Rahu/Ketu as they don't own signs
      if (lord1 && lord2 && p1 && p2 &&
        !lord1.includes("Rahu") && !lord1.includes("Ketu") &&
        !lord2.includes("Rahu") && !lord2.includes("Ketu")) {

        // Sign Exchange Check: Planet 1 is in Sign(House 2) AND Planet 2 is in Sign(House 1)
        // With Whole Sign Houses, House Number directly maps to Sign Index relative to Ascendant
        // But here we can simply check: Planet 1 is in House 2 AND Planet 2 is in House 1

        if (p1.house === h2 && p2.house === h1) {
          let type = "Maha Parivartana"; // Wealth houses (1, 2, 4, 5, 7, 9, 10, 11)
          const dusthanas = [6, 8, 12];
          const third = 3; // Neutral/Malefic

          if (dusthanas.includes(h1) || dusthanas.includes(h2)) {
            type = "Dainya Parivartana"; // Bad exchange
          } else if (h1 === 3 || h2 === 3) {
            type = "Khala Parivartana"; // Mixed
          }

          yogas.push({
            name: `${type} (Exchange)`,
            category: "wealth",
            strength: type === "Maha Parivartana" ? "strong" : "moderate",
            description: `Exchange of lords between house ${h1} and ${h2}. Money generates money loop.`,
            effects: type === "Maha Parivartana" ? "Great prosperity and success." : "Mixed results with some struggles.",
            careerImplication: "Indicates strong interconnected ventures or career paths."
          });
        }
      }
    }
  }

  // 10. Pushkala Yoga - Moon sign lord + Lagna lord in Kendra/Friend
  const lagnaLordName = getHouseLord(1);
  const moonPlanet = getPlanetByName("Moon");
  // Need calculation of Moon Sign Lord - Moon's sign index is known from planet position?
  // We have moon.sign index.
  // We need a helper for Sign Lord mappings
  // Since we don't have a direct 'getSignLord(signIndex)' helper in this scope, we can infer from Moon's house if we assume Whole Sign 
  // But Moon's house depends on Lagna. It is better to rely on Moon's sign directly.

  // Simplified Pushkala Logic: 
  if (lagnaLordName && moonPlanet) {
    // Check if they are together
    const lagnaLord = getPlanetByName(lagnaLordName);
    // We need a proper Sign -> Lord mapper.
    // Let's postpone Pushkala slightly complexity-wise or implement a local mapper

    const signLords = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"]; // Aries to Pisces
    const moonSignLordName = signLords[moonPlanet.signIndex];

    const msLord = getPlanetByName(moonSignLordName);

    if (lagnaLord && msLord && lagnaLord.house === msLord.house) {
      // Together
      if ([1, 4, 7, 10, 5, 9].includes(lagnaLord.house)) {
        yogas.push({
          name: "Pushkala Yoga",
          category: "status",
          strength: "strong",
          description: "Moon sign lord and Lagna lord are conjunct in a good house.",
          effects: "Wealth, honor, and sweet speech.",
          careerImplication: "High status and reputation."
        });
      }
    }
  }

  // 11. Vipareeta Rajayoga
  const dusthanaLords = [6, 8, 12].map(h => getHouseLord(h));
  for (const lordName of dusthanaLords) {
    if (lordName) {
      const planet = getPlanetByName(lordName);
      if (planet && [6, 8, 12].includes(planet.house)) {
        // Check if this planet is NOT lords of any Good house (to be pure Vipareeta)? 
        // Simplified: If Dusthana Lord is in Dusthana
        yogas.push({
          name: "Vipareeta Rajayoga",
          category: "raja",
          strength: "moderate", // Depends on if lagna lord is strong
          description: `Lord of dusthana (${lordName}) placed in dusthana house (${planet.house}).`,
          effects: "Success through obstacles or competitors' failures.",
          careerImplication: "Success in crisis management, law, or competitive fields."
        });
        break; // One instance is enough to mention
      }
    }
  }

  // 12. Vesi Yoga - Planet (except Moon, Rahu, Ketu) in 2nd from Sun
  if (sun) {
    const house2FromSun = (sun.house % 12) + 1;
    const vesiPlanets = planets.filter(p =>
      p.house === house2FromSun &&
      !["Moon", "Rahu", "Ketu"].includes(p.planet)
    );

    if (vesiPlanets.length > 0) {
      yogas.push({
        name: "Vesi Yoga",
        category: "personality",
        strength: "moderate",
        description: `Formed by ${vesiPlanets.map(p => p.planet).join(", ")} in 2nd house from Sun.`,
        effects: "May have weak eyesight but firm in word and hardworking. Financially stable.",
        careerImplication: "Success through hard work and persistence."
      });
    }
  }

  // 10. Bhadra Maha Purusha Yoga - Mercury in Kendra in Own/Exalted sign
  // Mercury Own: Gemini(3), Virgo(6). Exalted: Virgo(6).
  if (mercury) {
    const mercurySignIndex = mercury.signIndex; // 0-based: Gemini=2, Virgo=5 ? No, ZODIAC_SIGNS index
    // Gemini (Index 2), Virgo (Index 5)
    // Code uses 0-based indices for signs? 
    // Wait, calculations.ts ZODIAC_SIGNS: Aries=0, Gemini=2, Virgo=5.
    const isStrongSign = [2, 5].includes(mercury.signIndex);
    const isInKendra = [1, 4, 7, 10].includes(mercury.house);

    if (isStrongSign && isInKendra) {
      yogas.push({
        name: "Bhadra Maha Purusha Yoga",
        category: "mahapurusha",
        strength: "strong",
        description: "Mercury in Kendra (1, 4, 7, 10) in its own or exalted sign (Gemini/Virgo).",
        effects: "Knowledgeable, joyful, supportive of family. Excellent communication skills, analytical mind, good sense of humor.",
        careerImplication: "Excellent for analytics, mathematics, communication, and business."
      });
    }
  }

  // 11. Conjunction Yogas
  const getConjunction = (pNames: string[]) => {
    const pObjs = pNames.map(n => getPlanetByName(n)).filter(p => p !== undefined);
    if (pObjs.length !== pNames.length) return false;
    const firstHouse = pObjs[0]!.house;
    return pObjs.every(p => p!.house === firstHouse);
  };

  if (getConjunction(["Sun", "Mercury", "Venus"])) {
    yogas.push({
      name: "Sun + Mercury + Venus Yoga",
      category: "conjunction",
      strength: "strong",
      description: "Sun, Mercury, and Venus conjunction.",
      effects: "Insatiable nature, talkative demeanor, inclination towards travel. Skilled in arts and luxury.",
      careerImplication: "Success in media, travel, or luxury industries."
    });
  }

  // Check pairs independent of triple conjunction
  if (getConjunction(["Sun", "Venus"])) {
    yogas.push({
      name: "Sun + Venus (Dwi Graha)",
      category: "conjunction",
      strength: "moderate",
      description: "Sun and Venus conjunction.",
      effects: "Charming personality, skilled in arts, attraction to luxury. Potential for leadership.",
      careerImplication: "Arts, entertainment, and diplomacy."
    });
  }
  if (getConjunction(["Mercury", "Venus"])) {
    yogas.push({
      name: "Mercury + Venus (Dwi Graha)",
      category: "conjunction",
      strength: "strong",
      description: "Mercury and Venus conjunction.",
      effects: "Considerable wealth, eloquence in speech, talents in singing/humor.",
      careerImplication: "Politics, public speaking, arts, and commerce."
    });
  }

  // Note: Budhaditya (Sun+Mercury) and Chandra-Mangala (Moon+Mars) are already checked above

  return yogas;
}

/**
 * Generate complete birth chart from birth data with high precision
 */
export async function generateBirthChart(birthData: BirthData): Promise<BirthChart> {
  const [year, month, day] = birthData.date.split("-").map(Number);
  const [hour, min, sec] = birthData.time.split(":").map(Number);

  // Use professional JD calculation
  const birthDate = new Date(Date.UTC(year, month - 1, day, hour, min, sec || 0));
  const localJd = await SwissEphemeris.getJulianDay(birthDate);
  const jd = localJd - (birthData.timezone / 24); // Convert local to UT

  const ayanamsaValue = await SwissEphemeris.getAyanamsa(jd);

  // Calculate precision ascendant
  const ascResult = await calculateAscendantPrecision(jd, birthData.latitude, birthData.longitude);
  const ascSidereal = ascResult.siderealDegree;
  const ascSignIndex = Math.floor(ascSidereal / 30);
  const ascDegreeInSign = ascSidereal % 30;
  const ascNakIndex = Math.floor(ascSidereal / (360 / 27));

  // Calculate precision planetary positions
  let planets = await calculatePlanetaryPositionsPrecision(jd);

  // Calculate house cusps (Whole Sign)
  const houses = calculateHouseCusps(ascSignIndex);

  // Assign planets to houses
  planets = assignPlanetsToHouses(planets, ascSignIndex);

  return {
    birthData,
    ascendant: {
      sign: ZODIAC_SIGNS[ascSignIndex],
      signIndex: ascSignIndex,
      degree: Math.floor(ascDegreeInSign),
      minute: Math.floor((ascDegreeInSign % 1) * 60),
      second: Math.round(((ascDegreeInSign % 1) * 60 % 1) * 60),
      nakshatra: NAKSHATRAS[ascNakIndex]
    },
    planets,
    houses,
    ayanamsaUsed: "Lahiri",
    ayanamsaValue
  };
}

/**
 * Generate full chart data including vargas and dashas
 */
export async function generateFullChartData(birthData: BirthData, includeDeepDashas: boolean = false): Promise<FullChartData> {
  console.log('[DEBUG] generateFullChartData input:', JSON.stringify(birthData));
  const d1 = await generateBirthChart(birthData);

  const ascLongitude = d1.ascendant.signIndex * 30 + d1.ascendant.degree;

  const vargas = {
    d2: calculateVargaChart(d1.planets, ascLongitude, 2, "Hora"),
    d3: calculateVargaChart(d1.planets, ascLongitude, 3, "Drekkana"),
    d4: calculateVargaChart(d1.planets, ascLongitude, 4, "Chaturthamsa"),
    d7: calculateVargaChart(d1.planets, ascLongitude, 7, "Saptamsa"),
    d8: calculateVargaChart(d1.planets, ascLongitude, 8, "Ashtamsha"),
    d9: calculateVargaChart(d1.planets, ascLongitude, 9, "Navamsa"),
    d10: calculateVargaChart(d1.planets, ascLongitude, 10, "Dasamsa"),
    d12: calculateVargaChart(d1.planets, ascLongitude, 12, "Dwadasamsa"),
    d16: calculateVargaChart(d1.planets, ascLongitude, 16, "Shodashamsa"),
    d24: calculateVargaChart(d1.planets, ascLongitude, 24, "Chaturvimshamsha"),
    d60: calculateVargaChart(d1.planets, ascLongitude, 60, "Shashtiamsa")
  };

  const moon = d1.planets.find(p => p.planet === "Moon");
  const [year, month, day] = birthData.date.split("-").map(Number);
  const [hour, min, sec] = birthData.time.split(":").map(Number);
  const birthDate = new Date(Date.UTC(year, month - 1, day, hour, min, sec || 0));

  const dashas = calculateDashas(moon?.longitude || 0, birthDate, includeDeepDashas ? 5 : 3);
  const currentDasha = getCurrentDasha(dashas);
  const yogas = detectYogas(d1);

  return {
    d1,
    d2: vargas.d2,
    d3: vargas.d3,
    d4: vargas.d4,
    d7: vargas.d7,
    d8: vargas.d8,
    d9: vargas.d9,
    d10: vargas.d10,
    d12: vargas.d12,
    d16: vargas.d16,
    d24: vargas.d24,
    d60: vargas.d60,
    dashas,
    currentDasha,
    yogas
  };
}

/**
 * Get planet dignity (Exalted, Debilitated, Own, Neutral)
 */
export function getPlanetDignity(planetName: string, signName: string): "exalted" | "debilitated" | "own" | "neutral" {
  const dignity = PLANET_DIGNITY[planetName as keyof typeof PLANET_DIGNITY];

  if (!dignity) return "neutral";

  if (dignity.exalted === signName) return "exalted";
  if (dignity.debilitated === signName) return "debilitated";
  if (dignity.own.includes(signName)) return "own";

  return "neutral";
}

