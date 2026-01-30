/**
 * Career Mapping Engine
 * Connects astrological indicators to career recommendations
 * with accurate, varied scoring based on chart analysis
 */

import type { BirthChart, PlanetPosition, DetectedYoga, FullChartData, VargaChart } from "./calculations";
import { OCCUPATIONS } from "../data/career_database";

// ============================================
// TYPES
// ============================================

export interface CareerAttribute {
  type: "holland_code" | "skill" | "work_value" | "industry" | "work_style";
  value: string;
  weight: number;
  source: string;
}

export interface CareerProfile {
  hollandCodes: Record<string, number>;  // RIASEC scores (0-100)
  skills: Record<string, number>;
  workValues: Record<string, number>;
  industries: Record<string, number>;
  workStyles: Record<string, number>;
  dominantPlanets: string[];
  strongHouses: number[];
  logicTrace: Record<string, string[]>;
}

export interface CareerMatch {
  occupationId?: number;
  incomeStreamId?: number;
  title: string;
  category: string;
  matchScore: number;
  matchReasons: string[];
  planetarySupport: string[];
  timingInsights?: string;
  astroLogic?: string[];
  // Frontend compatibility fields
  score?: number;
  name?: string;
  reasons?: string[];
}

export interface IncomeStream {
  id: number;
  name: string;
  category: "active" | "passive" | "hybrid";
  riskLevel: "low" | "medium" | "high";
  favorablePlanets: string[];
  favorableHouses: number[];
  requiredSkills: string[];
  description: string;
}

// ============================================
// PLANET TO CAREER MAPPINGS
// ============================================

const PLANET_CAREER_ATTRIBUTES: Record<string, CareerAttribute[]> = {
  "Sun": [
    { type: "holland_code", value: "E", weight: 2.0, source: "Sun - Leadership" },
    { type: "skill", value: "leadership", weight: 2.0, source: "Sun - Authority" },
    { type: "work_value", value: "recognition", weight: 1.8, source: "Sun - Fame" },
    { type: "industry", value: "government", weight: 1.5, source: "Sun - Authority" },
    { type: "industry", value: "politics", weight: 1.5, source: "Sun - Power" },
    { type: "work_style", value: "independent", weight: 1.5, source: "Sun - Self" },
  ],
  "Moon": [
    { type: "holland_code", value: "S", weight: 2.0, source: "Moon - Nurturing" },
    { type: "skill", value: "emotional_intelligence", weight: 2.0, source: "Moon - Emotions" },
    { type: "work_value", value: "helping_others", weight: 1.8, source: "Moon - Care" },
    { type: "industry", value: "healthcare", weight: 1.6, source: "Moon - Healing" },
    { type: "industry", value: "hospitality", weight: 1.4, source: "Moon - Comfort" },
    { type: "industry", value: "food", weight: 1.3, source: "Moon - Nourishment" },
    { type: "work_style", value: "collaborative", weight: 1.5, source: "Moon - Connection" },
  ],
  "Mars": [
    { type: "holland_code", value: "R", weight: 2.0, source: "Mars - Action" },
    { type: "skill", value: "technical", weight: 1.8, source: "Mars - Engineering" },
    { type: "skill", value: "physical", weight: 1.6, source: "Mars - Strength" },
    { type: "work_value", value: "achievement", weight: 1.8, source: "Mars - Competition" },
    { type: "industry", value: "engineering", weight: 1.7, source: "Mars - Technical" },
    { type: "industry", value: "military", weight: 1.5, source: "Mars - Combat" },
    { type: "industry", value: "sports", weight: 1.6, source: "Mars - Physical" },
    { type: "industry", value: "real_estate", weight: 1.4, source: "Mars - Property" },
    { type: "work_style", value: "competitive", weight: 1.6, source: "Mars - Drive" },
  ],
  "Mercury": [
    { type: "holland_code", value: "I", weight: 1.8, source: "Mercury - Analysis" },
    { type: "holland_code", value: "C", weight: 1.6, source: "Mercury - Detail" },
    { type: "skill", value: "communication", weight: 2.0, source: "Mercury - Speech" },
    { type: "skill", value: "analytical", weight: 1.8, source: "Mercury - Logic" },
    { type: "skill", value: "writing", weight: 1.6, source: "Mercury - Expression" },
    { type: "industry", value: "technology", weight: 1.8, source: "Mercury - Computing" },
    { type: "industry", value: "media", weight: 1.6, source: "Mercury - Communication" },
    { type: "industry", value: "finance", weight: 1.5, source: "Mercury - Calculation" },
    { type: "industry", value: "trading", weight: 1.4, source: "Mercury - Commerce" },
    { type: "work_style", value: "detail_oriented", weight: 1.6, source: "Mercury - Precision" },
  ],
  "Jupiter": [
    { type: "holland_code", value: "S", weight: 1.6, source: "Jupiter - Teaching" },
    { type: "holland_code", value: "E", weight: 1.4, source: "Jupiter - Expansion" },
    { type: "skill", value: "teaching", weight: 2.0, source: "Jupiter - Wisdom" },
    { type: "skill", value: "advisory", weight: 1.8, source: "Jupiter - Guidance" },
    { type: "work_value", value: "growth", weight: 1.8, source: "Jupiter - Expansion" },
    { type: "industry", value: "education", weight: 2.0, source: "Jupiter - Knowledge" },
    { type: "industry", value: "law", weight: 1.7, source: "Jupiter - Justice" },
    { type: "industry", value: "consulting", weight: 1.6, source: "Jupiter - Advisory" },
    { type: "industry", value: "banking", weight: 1.4, source: "Jupiter - Wealth" },
    { type: "work_style", value: "mentoring", weight: 1.6, source: "Jupiter - Guidance" },
  ],
  "Venus": [
    { type: "holland_code", value: "A", weight: 2.0, source: "Venus - Arts" },
    { type: "skill", value: "creativity", weight: 2.0, source: "Venus - Beauty" },
    { type: "skill", value: "design", weight: 1.8, source: "Venus - Aesthetics" },
    { type: "skill", value: "negotiation", weight: 1.4, source: "Venus - Diplomacy" },
    { type: "work_value", value: "beauty", weight: 1.6, source: "Venus - Harmony" },
    { type: "industry", value: "entertainment", weight: 1.8, source: "Venus - Pleasure" },
    { type: "industry", value: "fashion", weight: 1.7, source: "Venus - Beauty" },
    { type: "industry", value: "luxury", weight: 1.6, source: "Venus - Comfort" },
    { type: "industry", value: "hospitality", weight: 1.5, source: "Venus - Service" },
    { type: "work_style", value: "harmonious", weight: 1.5, source: "Venus - Balance" },
  ],
  "Saturn": [
    { type: "holland_code", value: "C", weight: 2.0, source: "Saturn - Structure" },
    { type: "holland_code", value: "R", weight: 1.4, source: "Saturn - Labor" },
    { type: "skill", value: "management", weight: 1.8, source: "Saturn - Organization" },
    { type: "skill", value: "discipline", weight: 2.0, source: "Saturn - Persistence" },
    { type: "work_value", value: "stability", weight: 2.0, source: "Saturn - Security" },
    { type: "industry", value: "construction", weight: 1.6, source: "Saturn - Building" },
    { type: "industry", value: "agriculture", weight: 1.4, source: "Saturn - Land" },
    { type: "industry", value: "manufacturing", weight: 1.5, source: "Saturn - Industry" },
    { type: "industry", value: "mining", weight: 1.4, source: "Saturn - Earth" },
    { type: "work_style", value: "methodical", weight: 1.8, source: "Saturn - Process" },
  ],
  "Rahu": [
    { type: "holland_code", value: "E", weight: 1.6, source: "Rahu - Ambition" },
    { type: "holland_code", value: "I", weight: 1.4, source: "Rahu - Research" },
    { type: "skill", value: "innovation", weight: 1.8, source: "Rahu - Unconventional" },
    { type: "skill", value: "networking", weight: 1.6, source: "Rahu - Connections" },
    { type: "work_value", value: "status", weight: 1.8, source: "Rahu - Material" },
    { type: "industry", value: "technology", weight: 2.0, source: "Rahu - Modern" },
    { type: "industry", value: "foreign", weight: 1.8, source: "Rahu - Foreign" },
    { type: "industry", value: "research", weight: 1.6, source: "Rahu - Discovery" },
    { type: "industry", value: "aviation", weight: 1.4, source: "Rahu - Sky" },
    { type: "work_style", value: "unconventional", weight: 1.8, source: "Rahu - Breaking norms" },
  ],
  "Ketu": [
    { type: "holland_code", value: "I", weight: 1.6, source: "Ketu - Research" },
    { type: "skill", value: "intuition", weight: 1.8, source: "Ketu - Insight" },
    { type: "skill", value: "spiritual", weight: 2.0, source: "Ketu - Moksha" },
    { type: "skill", value: "programming", weight: 1.4, source: "Ketu - Abstract" },
    { type: "industry", value: "spirituality", weight: 1.8, source: "Ketu - Liberation" },
    { type: "industry", value: "healing", weight: 1.6, source: "Ketu - Alternative" },
    { type: "industry", value: "research", weight: 1.6, source: "Ketu - Deep study" },
    { type: "industry", value: "occult", weight: 1.4, source: "Ketu - Hidden" },
    { type: "work_style", value: "independent", weight: 1.6, source: "Ketu - Detachment" },
  ],
  "Uranus": [
    { type: "holland_code", value: "I", weight: 1.8, source: "Uranus - Innovation" },
    { type: "skill", value: "innovation", weight: 2.0, source: "Uranus - Disruption" },
    { type: "skill", value: "technical", weight: 1.6, source: "Uranus - Tech" },
    { type: "industry", value: "technology", weight: 2.0, source: "Uranus - Electricity" },
    { type: "industry", value: "aviation", weight: 1.6, source: "Uranus - Sky" },
    { type: "industry", value: "science", weight: 1.8, source: "Uranus - Discovery" },
    { type: "work_style", value: "unconventional", weight: 1.8, source: "Uranus - Rebellion" },
  ],
  "Neptune": [
    { type: "holland_code", value: "A", weight: 1.8, source: "Neptune - Imagination" },
    { type: "skill", value: "creativity", weight: 2.0, source: "Neptune - Dreams" },
    { type: "skill", value: "intuition", weight: 1.8, source: "Neptune - Mystic" },
    { type: "industry", value: "entertainment", weight: 1.8, source: "Neptune - Film" },
    { type: "industry", value: "healing", weight: 1.6, source: "Neptune - Compassion" },
    { type: "industry", value: "oil_gas", weight: 1.4, source: "Neptune - Liquids" },
    { type: "work_style", value: "creative", weight: 1.6, source: "Neptune - Flow" },
  ],
  "Pluto": [
    { type: "holland_code", value: "I", weight: 1.8, source: "Pluto - Depth" },
    { type: "skill", value: "research", weight: 2.0, source: "Pluto - Investigation" },
    { type: "skill", value: "crisis_management", weight: 1.8, source: "Pluto - Transformation" },
    { type: "industry", value: "mining", weight: 1.6, source: "Pluto - Underground" },
    { type: "industry", value: "research", weight: 1.8, source: "Pluto - Hidden" },
    { type: "industry", value: "psychology", weight: 1.6, source: "Pluto - Subconscious" },
    { type: "work_style", value: "intense", weight: 1.6, source: "Pluto - Intensity" },
  ],
};

// ============================================
// HOUSE TO CAREER MAPPINGS
// ============================================

const HOUSE_CAREER_ATTRIBUTES: Record<number, CareerAttribute[]> = {
  1: [
    { type: "work_style", value: "independent", weight: 1.5, source: "1st House - Self" },
    { type: "work_value", value: "autonomy", weight: 1.4, source: "1st House - Identity" },
    { type: "skill", value: "self_promotion", weight: 1.2, source: "1st House - Personality" },
  ],
  2: [
    { type: "industry", value: "finance", weight: 1.6, source: "2nd House - Wealth" },
    { type: "industry", value: "banking", weight: 1.4, source: "2nd House - Money" },
    { type: "skill", value: "financial", weight: 1.5, source: "2nd House - Resources" },
    { type: "industry", value: "food", weight: 1.3, source: "2nd House - Sustenance" },
  ],
  3: [
    { type: "skill", value: "communication", weight: 1.6, source: "3rd House - Communication" },
    { type: "industry", value: "media", weight: 1.5, source: "3rd House - Writing" },
    { type: "industry", value: "marketing", weight: 1.4, source: "3rd House - Promotion" },
    { type: "skill", value: "writing", weight: 1.4, source: "3rd House - Expression" },
  ],
  4: [
    { type: "industry", value: "real_estate", weight: 1.6, source: "4th House - Property" },
    { type: "work_value", value: "security", weight: 1.5, source: "4th House - Home" },
    { type: "industry", value: "agriculture", weight: 1.3, source: "4th House - Land" },
    { type: "industry", value: "automotive", weight: 1.2, source: "4th House - Vehicles" },
  ],
  5: [
    { type: "holland_code", value: "A", weight: 1.5, source: "5th House - Creativity" },
    { type: "industry", value: "entertainment", weight: 1.6, source: "5th House - Performance" },
    { type: "industry", value: "education", weight: 1.4, source: "5th House - Teaching" },
    { type: "industry", value: "sports", weight: 1.3, source: "5th House - Games" },
    { type: "industry", value: "investing", weight: 1.4, source: "5th House - Speculation" },
  ],
  6: [
    { type: "work_style", value: "service", weight: 1.5, source: "6th House - Service" },
    { type: "industry", value: "healthcare", weight: 1.5, source: "6th House - Healing" },
    { type: "industry", value: "legal", weight: 1.3, source: "6th House - Disputes" },
    { type: "skill", value: "problem_solving", weight: 1.4, source: "6th House - Obstacles" },
  ],
  7: [
    { type: "work_style", value: "partnership", weight: 1.6, source: "7th House - Partnership" },
    { type: "industry", value: "consulting", weight: 1.5, source: "7th House - Clients" },
    { type: "industry", value: "law", weight: 1.4, source: "7th House - Contracts" },
    { type: "skill", value: "negotiation", weight: 1.5, source: "7th House - Agreements" },
  ],
  8: [
    { type: "industry", value: "insurance", weight: 1.5, source: "8th House - Other's money" },
    { type: "industry", value: "research", weight: 1.6, source: "8th House - Investigation" },
    { type: "industry", value: "occult", weight: 1.4, source: "8th House - Hidden" },
    { type: "skill", value: "research", weight: 1.5, source: "8th House - Deep study" },
    { type: "industry", value: "psychology", weight: 1.4, source: "8th House - Transformation" },
  ],
  9: [
    { type: "industry", value: "education", weight: 1.6, source: "9th House - Higher learning" },
    { type: "industry", value: "law", weight: 1.5, source: "9th House - Philosophy" },
    { type: "industry", value: "foreign", weight: 1.6, source: "9th House - Long distance" },
    { type: "industry", value: "publishing", weight: 1.4, source: "9th House - Knowledge" },
    { type: "industry", value: "spirituality", weight: 1.3, source: "9th House - Dharma" },
  ],
  10: [
    { type: "work_value", value: "recognition", weight: 1.8, source: "10th House - Career" },
    { type: "skill", value: "leadership", weight: 1.6, source: "10th House - Authority" },
    { type: "work_style", value: "ambitious", weight: 1.6, source: "10th House - Status" },
    { type: "industry", value: "government", weight: 1.4, source: "10th House - Public" },
  ],
  11: [
    { type: "work_style", value: "networking", weight: 1.6, source: "11th House - Networks" },
    { type: "industry", value: "technology", weight: 1.5, source: "11th House - Innovation" },
    { type: "work_value", value: "income", weight: 1.6, source: "11th House - Gains" },
    { type: "industry", value: "social_media", weight: 1.4, source: "11th House - Groups" },
  ],
  12: [
    { type: "industry", value: "spirituality", weight: 1.5, source: "12th House - Moksha" },
    { type: "industry", value: "foreign", weight: 1.6, source: "12th House - Foreign lands" },
    { type: "industry", value: "healthcare", weight: 1.4, source: "12th House - Hospitals" },
    { type: "industry", value: "charity", weight: 1.3, source: "12th House - Service" },
    { type: "work_style", value: "behind_scenes", weight: 1.4, source: "12th House - Hidden work" },
  ],
};

// ============================================
// OCCUPATION DATABASE
// ============================================

// OCCUPATIONS moved to ../data/career_database.ts

// ============================================
// INCOME STREAMS DATABASE
// ============================================

export const INCOME_STREAMS: IncomeStream[] = [
  // Active Income
  { id: 1, name: "Freelance Consulting", category: "active", riskLevel: "medium", favorablePlanets: ["Jupiter", "Mercury", "Sun"], favorableHouses: [7, 10, 11], requiredSkills: ["advisory", "communication"], description: "Offer expertise to clients on project basis" },
  { id: 2, name: "Online Coaching", category: "active", riskLevel: "low", favorablePlanets: ["Jupiter", "Moon", "Mercury"], favorableHouses: [5, 9, 11], requiredSkills: ["teaching", "communication"], description: "Teach skills through online sessions" },
  { id: 3, name: "E-commerce Business", category: "active", riskLevel: "medium", favorablePlanets: ["Mercury", "Venus", "Rahu"], favorableHouses: [2, 7, 11], requiredSkills: ["financial", "communication", "innovation"], description: "Sell products through online platforms" },
  { id: 4, name: "Content Creation", category: "active", riskLevel: "medium", favorablePlanets: ["Venus", "Mercury", "Moon"], favorableHouses: [3, 5, 11], requiredSkills: ["creativity", "communication", "writing"], description: "Create videos, blogs, or social media content" },
  { id: 5, name: "Professional Services", category: "active", riskLevel: "low", favorablePlanets: ["Saturn", "Jupiter", "Mercury"], favorableHouses: [6, 10, 11], requiredSkills: ["technical", "discipline", "management"], description: "Offer specialized professional services" },

  // Passive Income
  { id: 6, name: "Dividend Investing", category: "passive", riskLevel: "low", favorablePlanets: ["Jupiter", "Saturn", "Venus"], favorableHouses: [2, 5, 11], requiredSkills: ["financial", "analytical"], description: "Earn from stock dividends" },
  { id: 7, name: "Rental Income", category: "passive", riskLevel: "low", favorablePlanets: ["Saturn", "Mars", "Venus"], favorableHouses: [4, 2, 11], requiredSkills: ["financial", "management"], description: "Income from property rentals" },
  { id: 8, name: "Digital Products", category: "passive", riskLevel: "medium", favorablePlanets: ["Mercury", "Rahu", "Venus"], favorableHouses: [3, 5, 11], requiredSkills: ["creativity", "technical", "writing"], description: "Sell courses, ebooks, templates" },
  { id: 9, name: "Royalties", category: "passive", riskLevel: "medium", favorablePlanets: ["Venus", "Mercury", "Jupiter"], favorableHouses: [5, 9, 11], requiredSkills: ["creativity", "writing"], description: "Earn from intellectual property" },
  { id: 10, name: "Long-term Investments", category: "passive", riskLevel: "medium", favorablePlanets: ["Saturn", "Jupiter", "Ketu"], favorableHouses: [8, 11, 12], requiredSkills: ["financial", "analytical", "discipline"], description: "Growth through index funds, bonds" },

  // Hybrid Income
  { id: 11, name: "Affiliate Marketing", category: "hybrid", riskLevel: "low", favorablePlanets: ["Mercury", "Rahu", "Venus"], favorableHouses: [3, 7, 11], requiredSkills: ["communication", "networking", "writing"], description: "Earn commissions promoting products" },
  { id: 12, name: "Spiritual Services", category: "hybrid", riskLevel: "low", favorablePlanets: ["Ketu", "Jupiter", "Moon"], favorableHouses: [9, 12, 5], requiredSkills: ["spiritual", "intuition", "teaching"], description: "Astrology, healing, counseling" },
  { id: 13, name: "Research & Analysis", category: "hybrid", riskLevel: "low", favorablePlanets: ["Ketu", "Mercury", "Saturn"], favorableHouses: [8, 9, 11], requiredSkills: ["research", "analytical", "writing"], description: "Market research, data analysis" },
  { id: 14, name: "App/Software Development", category: "hybrid", riskLevel: "high", favorablePlanets: ["Mercury", "Rahu", "Ketu"], favorableHouses: [3, 5, 11], requiredSkills: ["technical", "innovation", "analytical"], description: "Build and monetize applications" },
  { id: 15, name: "Trading & Speculation", category: "hybrid", riskLevel: "high", favorablePlanets: ["Mercury", "Rahu", "Mars"], favorableHouses: [5, 8, 11], requiredSkills: ["analytical", "financial", "innovation"], description: "Active trading in markets" },
];

// ============================================
// CAREER MAPPING FUNCTIONS
// ============================================

/**
 * Generate career profile from birth chart with accurate scoring
 */
export function generateCareerProfile(chartData: FullChartData): CareerProfile {
  const profile: CareerProfile = {
    hollandCodes: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
    skills: {},
    workValues: {},
    industries: {},
    workStyles: {},
    dominantPlanets: [],
    strongHouses: [],
    logicTrace: {},
  };

  const { d1, d10, d9, yogas } = chartData;

  // Calculate planet strengths
  const planetStrengths: Record<string, number> = {};

  for (const planet of d1.planets) {
    const strength = calculatePlanetStrength(planet, d1);
    planetStrengths[planet.planet] = strength;

    const conditions = getPlanetConditions(planet, d1, d10, d9);

    // Process planet's career attributes with its strength
    processPlanetalInfluence(planet, profile, strength, conditions);
  }

  // Process D10 (Dasamsa) chart with higher weight for career
  if (d10) {
    for (const planet of d10.planets) {
      if (["Uranus", "Neptune", "Pluto"].includes(planet.planet)) continue;

      const d10Strength = calculateVargaPlanetStrength(planet, d10);
      // For D10, we can add a specific condition
      const d10Conditions: string[] = [];
      if (d10Strength > 1.2) d10Conditions.push(`${planet.planet} strong in D10`);

      processPlanetalInfluence(planet, profile, d10Strength * 1.5, d10Conditions);
    }
  }

  // Process house placements
  for (const planet of d1.planets) {
    const houseAttrs = HOUSE_CAREER_ATTRIBUTES[planet.house];
    if (houseAttrs) {
      const strength = planetStrengths[planet.planet] || 1.0;
      // Derived condition
      const conditions: string[] = [`${planet.planet} in ${planet.house}th House`];

      for (const attr of houseAttrs) {
        addAttribute(profile, attr, strength, conditions);
      }
    }
  }

  // Process 10th house lord specifically (career significator)
  const tenthHouseLord = d1.houses[9]?.lord;
  if (tenthHouseLord) {
    const lordPlanet = d1.planets.find(p => p.planet === tenthHouseLord);
    if (lordPlanet) {
      const strength = planetStrengths[tenthHouseLord] || 1.0;
      processPlanetalInfluence(lordPlanet, profile, strength * 2.0, [`10th Lord (${tenthHouseLord})`]);
    }
  }

  // Process 2nd house lord (wealth)
  const secondHouseLord = d1.houses[1]?.lord;
  if (secondHouseLord) {
    const lordPlanet = d1.planets.find(p => p.planet === secondHouseLord);
    if (lordPlanet) {
      const strength = planetStrengths[secondHouseLord] || 1.0;
      processPlanetalInfluence(lordPlanet, profile, strength * 1.3, [`2nd Lord (${secondHouseLord})`]);
    }
  }

  // Process 11th house lord (gains)
  const eleventhHouseLord = d1.houses[10]?.lord;
  if (eleventhHouseLord) {
    const lordPlanet = d1.planets.find(p => p.planet === eleventhHouseLord);
    if (lordPlanet) {
      const strength = planetStrengths[eleventhHouseLord] || 1.0;
      processPlanetalInfluence(lordPlanet, profile, strength * 1.3, [`11th Lord (${eleventhHouseLord})`]);
    }
  }

  // Boost from yogas
  for (const yoga of yogas) {
    const boost = yoga.strength === "strong" ? 2.0 : yoga.strength === "moderate" ? 1.5 : 1.0;
    const yogaCondition = [yoga.name];

    if (yoga.name.includes("Raja")) {
      profile.hollandCodes["E"] += boost * 10;
      profile.workValues["recognition"] = (profile.workValues["recognition"] || 0) + boost * 10;
      addAttribute(profile, { type: "holland_code", value: "E", weight: 1.0, source: "Yoga" }, boost * 10, yogaCondition);
    }
    if (yoga.name.includes("Dhana") || yoga.name.includes("Vasumati") || yoga.name.includes("Lakshmi")) {
      profile.industries["finance"] = (profile.industries["finance"] || 0) + boost * 10;
      profile.workValues["income"] = (profile.workValues["income"] || 0) + boost * 10;
      addAttribute(profile, { type: "industry", value: "finance", weight: 1.0, source: "Yoga" }, boost * 10, yogaCondition);
    }
    if (yoga.name.includes("Saraswati")) {
      profile.hollandCodes["A"] += boost * 10;
      profile.industries["education"] = (profile.industries["education"] || 0) + boost * 10;
      addAttribute(profile, { type: "holland_code", value: "A", weight: 1.0, source: "Yoga" }, boost * 10, yogaCondition);
    }
    if (yoga.name.includes("Budhaditya")) {
      profile.hollandCodes["I"] += boost * 8;
      profile.skills["communication"] = (profile.skills["communication"] || 0) + boost * 10;
      addAttribute(profile, { type: "skill", value: "communication", weight: 1.0, source: "Yoga" }, boost * 10, yogaCondition);
    }
    if (yoga.name.includes("Gaja Kesari")) {
      profile.hollandCodes["S"] += boost * 8;
      profile.skills["teaching"] = (profile.skills["teaching"] || 0) + boost * 10;
      addAttribute(profile, { type: "skill", value: "teaching", weight: 1.0, source: "Yoga" }, boost * 10, yogaCondition);
    }
  }

  // Identify dominant planets (top 3 by strength)
  const sortedPlanets = Object.entries(planetStrengths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([planet]) => planet);
  profile.dominantPlanets = sortedPlanets;

  // Identify strong houses (houses with benefics or strong planets)
  const strongHouses: number[] = [];
  for (const planet of d1.planets) {
    if (planetStrengths[planet.planet] > 1.2) {
      if (!strongHouses.includes(planet.house)) {
        strongHouses.push(planet.house);
      }
    }
  }
  profile.strongHouses = strongHouses.sort((a, b) => a - b);

  // Normalize scores to 0-100 scale
  normalizeProfile(profile);

  return profile;
}

/**
 * Calculate planet strength based on multiple factors
 */
function calculatePlanetStrength(planet: PlanetPosition, chart: BirthChart): number {
  let strength = 1.0;

  // Exaltation/debilitation
  const exaltations: Record<string, string> = {
    "Sun": "Aries", "Moon": "Taurus", "Mars": "Capricorn", "Mercury": "Virgo",
    "Jupiter": "Cancer", "Venus": "Pisces", "Saturn": "Libra", "Rahu": "Taurus", "Ketu": "Scorpio"
  };

  const debilitations: Record<string, string> = {
    "Sun": "Libra", "Moon": "Scorpio", "Mars": "Cancer", "Mercury": "Pisces",
    "Jupiter": "Capricorn", "Venus": "Virgo", "Saturn": "Aries", "Rahu": "Scorpio", "Ketu": "Taurus"
  };

  if (exaltations[planet.planet] === planet.sign) {
    strength *= 1.8;
  } else if (debilitations[planet.planet] === planet.sign) {
    strength *= 0.4;
  }

  // Own sign bonus
  const ownSigns: Record<string, string[]> = {
    "Sun": ["Leo"], "Moon": ["Cancer"], "Mars": ["Aries", "Scorpio"],
    "Mercury": ["Gemini", "Virgo"], "Jupiter": ["Sagittarius", "Pisces"],
    "Venus": ["Taurus", "Libra"], "Saturn": ["Capricorn", "Aquarius"],
    "Rahu": ["Aquarius"], "Ketu": ["Scorpio"]
  };

  if (ownSigns[planet.planet]?.includes(planet.sign)) {
    strength *= 1.5;
  }

  // Moolatrikona bonus
  const moolatrikona: Record<string, { sign: string; start: number; end: number }> = {
    "Sun": { sign: "Leo", start: 0, end: 20 },
    "Moon": { sign: "Taurus", start: 4, end: 30 },
    "Mars": { sign: "Aries", start: 0, end: 12 },
    "Mercury": { sign: "Virgo", start: 16, end: 20 },
    "Jupiter": { sign: "Sagittarius", start: 0, end: 10 },
    "Venus": { sign: "Libra", start: 0, end: 15 },
    "Saturn": { sign: "Aquarius", start: 0, end: 20 },
  };

  const mt = moolatrikona[planet.planet];
  if (mt && planet.sign === mt.sign && planet.degree >= mt.start && planet.degree <= mt.end) {
    strength *= 1.4;
  }

  // Kendra placement bonus (1, 4, 7, 10)
  if ([1, 4, 7, 10].includes(planet.house)) {
    strength *= 1.3;
  }

  // Trikona placement bonus (1, 5, 9)
  if ([5, 9].includes(planet.house)) {
    strength *= 1.2;
  }

  // Dusthana placement penalty (6, 8, 12)
  if ([6, 8, 12].includes(planet.house)) {
    strength *= 0.8;
  }

  // Retrograde consideration
  if (planet.isRetrograde && !["Rahu", "Ketu"].includes(planet.planet)) {
    strength *= 0.85;
  }

  // Degree-based strength (avoid sandhi - junction points)
  if (planet.degree < 1 || planet.degree > 29) {
    strength *= 0.9;
  }

  return strength;
}

/**
 * Calculate planet strength in Varga chart
 */
function calculateVargaPlanetStrength(planet: PlanetPosition, varga: VargaChart): number {
  let strength = 1.0;

  // Own sign in varga
  const ownSigns: Record<string, string[]> = {
    "Sun": ["Leo"], "Moon": ["Cancer"], "Mars": ["Aries", "Scorpio"],
    "Mercury": ["Gemini", "Virgo"], "Jupiter": ["Sagittarius", "Pisces"],
    "Venus": ["Taurus", "Libra"], "Saturn": ["Capricorn", "Aquarius"]
  };

  if (ownSigns[planet.planet]?.includes(planet.sign)) {
    strength *= 1.4;
  }

  // Kendra in varga
  if ([1, 4, 7, 10].includes(planet.house)) {
    strength *= 1.2;
  }

  return strength;
}

/**
 * Process a planet's influence on career profile
 */
function processPlanetalInfluence(
  planet: PlanetPosition,
  profile: CareerProfile,
  strength: number,
  conditions: string[] = []
): void {
  const attrs = PLANET_CAREER_ATTRIBUTES[planet.planet];
  if (!attrs) return;

  for (const attr of attrs) {
    addAttribute(profile, attr, strength, conditions);
  }
}

/**
 * Add an attribute to the career profile
 */
function addAttribute(
  profile: CareerProfile,
  attr: CareerAttribute,
  strength: number,
  conditions: string[] = []
): void {
  const score = attr.weight * strength;

  // Format key for logic trace
  const traceKey = `${attr.type}:${attr.value}`;

  // Initialize trace array if needed
  if (!profile.logicTrace) {
    profile.logicTrace = {};
  }
  if (!profile.logicTrace[traceKey]) {
    profile.logicTrace[traceKey] = [];
  }

  // Add unique conditions for this attribute
  // Only add if the strength contribution is significant (> 1.2) to reduce noise
  if (strength > 1.2 && conditions.length > 0) {
    for (const condition of conditions) {
      if (!profile.logicTrace[traceKey].includes(condition)) {
        profile.logicTrace[traceKey].push(condition);
      }
    }
  }

  switch (attr.type) {
    case "holland_code":
      profile.hollandCodes[attr.value] = (profile.hollandCodes[attr.value] || 0) + score;
      break;
    case "skill":
      profile.skills[attr.value] = (profile.skills[attr.value] || 0) + score;
      break;
    case "work_value":
      profile.workValues[attr.value] = (profile.workValues[attr.value] || 0) + score;
      break;
    case "industry":
      profile.industries[attr.value] = (profile.industries[attr.value] || 0) + score;
      break;
    case "work_style":
      profile.workStyles[attr.value] = (profile.workStyles[attr.value] || 0) + score;
      break;
  }
}

/**
 * Get detailed condition description for a planet
 */
function getPlanetConditions(
  planet: PlanetPosition,
  chart: BirthChart,
  d10?: VargaChart,
  d9?: VargaChart
): string[] {
  const conditions: string[] = [];
  const pName = planet.planet;

  // Sign Placement
  const ownSigns: Record<string, string[]> = {
    "Sun": ["Leo"], "Moon": ["Cancer"], "Mars": ["Aries", "Scorpio"],
    "Mercury": ["Gemini", "Virgo"], "Jupiter": ["Sagittarius", "Pisces"],
    "Venus": ["Taurus", "Libra"], "Saturn": ["Capricorn", "Aquarius"],
    "Rahu": ["Aquarius"], "Ketu": ["Scorpio"],
    "Uranus": ["Aquarius"], "Neptune": ["Pisces"], "Pluto": ["Scorpio"]
  };

  const exaltations: Record<string, string> = {
    "Sun": "Aries", "Moon": "Taurus", "Mars": "Capricorn", "Mercury": "Virgo",
    "Jupiter": "Cancer", "Venus": "Pisces", "Saturn": "Libra", "Rahu": "Taurus", "Ketu": "Scorpio",
    "Uranus": "Scorpio", "Neptune": "Leo", "Pluto": "Aries"
  };

  if (exaltations[pName] === planet.sign) {
    conditions.push(`${pName} Exalted in ${planet.sign}`);
  } else if (ownSigns[pName]?.includes(planet.sign)) {
    conditions.push(`${pName} in Own Sign (${planet.sign})`);
  } else {
    // Only mention house if not exalted/own sign to save space, unless it's angular
  }

  // House Placement
  if ([1, 4, 7, 10].includes(planet.house)) {
    conditions.push(`${pName} in ${planet.house}th House (Kendra)`);
  } else if ([5, 9].includes(planet.house)) {
    conditions.push(`${pName} in ${planet.house}th House (Trikona)`);
  } else if (planet.house === 2 || planet.house === 11) {
    conditions.push(`${pName} in ${planet.house}th House (Wealth)`);
  }

  // Directional Strength (Digbala)
  const digbala: Record<string, number> = {
    "Sun": 10, "Mars": 10, "Moon": 4, "Venus": 4,
    "Jupiter": 1, "Mercury": 1, "Saturn": 7
  };
  if (digbala[pName] === planet.house) {
    conditions.push(`${pName} has Digbala`);
  }

  // D9 (Navamsa) - Vargottama Check
  if (d9) {
    const d9Planet = d9.planets.find(p => p.planet === pName);
    if (d9Planet && d9Planet.sign === planet.sign) {
      conditions.push(`${pName} Vargottama (Strength)`);
    } else if (d9Planet && ownSigns[pName]?.includes(d9Planet.sign)) {
      conditions.push(`${pName} in Own Sign in D9`);
    } else if (d9Planet && exaltations[pName] === d9Planet.sign) {
      conditions.push(`${pName} Exalted in D9`);
    }
  }

  // D10 Placement (Career specific)
  if (d10) {
    const d10Planet = d10.planets.find(p => p.planet === pName);
    if (d10Planet) {
      if ([1, 10].includes(d10Planet.house)) {
        conditions.push(`${pName} strong in D10 (Dasamsa)`);
      } else if (ownSigns[pName]?.includes(d10Planet.sign)) {
        conditions.push(`${pName} own sign in D10`);
      }
    }
  }

  return conditions;
}

/**
 * Normalize profile scores to 0-100 scale with variance
 */
function normalizeProfile(profile: CareerProfile): void {
  const normalizeWithVariance = (obj: Record<string, number>) => {
    const values = Object.values(obj);
    if (values.length === 0) return;

    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    for (const key of Object.keys(obj)) {
      // Normalize to 0-100 with variance preserved
      const normalized = ((obj[key] - min) / range) * 70 + 15; // Range: 15-85
      obj[key] = Math.round(normalized);
    }
  };

  normalizeWithVariance(profile.hollandCodes);
  normalizeWithVariance(profile.skills);
  normalizeWithVariance(profile.workValues);
  normalizeWithVariance(profile.industries);
  normalizeWithVariance(profile.workStyles);
  normalizeWithVariance(profile.workValues);
  normalizeWithVariance(profile.industries);
  normalizeWithVariance(profile.workStyles);
}

/**
 * Get top career matches based on profile with varied scoring
 */
export function getTopCareerMatches(
  profile: CareerProfile,
  limit: number = 10
): CareerMatch[] {
  const matches: CareerMatch[] = [];

  for (const occupation of OCCUPATIONS) {
    let score = 0;
    const reasons: string[] = [];
    const planetarySupport: string[] = [];
    const astroLogicSet = new Set<string>();

    // Match Holland codes (40% weight)
    let hollandScore = 0;
    let hollandMatches = 0;
    for (const [code, value] of Object.entries(occupation.hollandCodes)) {
      const profileValue = profile.hollandCodes[code] || 0;
      // Strict coverage ratio: If profile has 80 and job needs 80, result is 1.0 (Full points)
      // If profile has 40 and job needs 80, result is 0.5
      // If profile has 90 and job needs 80, result is 1.0 (capped)
      const matchContribution = Math.min(profileValue, value) / Math.max(value, 1);

      hollandScore += matchContribution;
      hollandMatches++;

      if (matchContribution >= 0.8) { // 80% match or better
        const hollandNames: Record<string, string> = {
          R: "Realistic", I: "Investigative", A: "Artistic",
          S: "Social", E: "Enterprising", C: "Conventional"
        };
        reasons.push(`Strong ${hollandNames[code]} aptitude`);

        // Add specific logic traces
        const traces = profile.logicTrace?.[`holland_code:${code}`];
        if (traces) {
          traces.forEach(t => astroLogicSet.add(t));
        }
      }
    }
    // Normalize holland score contribution
    score += (hollandScore / Math.max(hollandMatches, 1)) * 40;

    // Match skills (30% weight - Increased from 25%)
    let skillScore = 0;
    for (const skill of occupation.skills) {
      const profileValue = profile.skills[skill.toLowerCase()] || profile.skills[skill] || 0;
      if (profileValue > 50) {
        skillScore += Math.min(profileValue, 90) / 90; // Normalize against a high standard
        reasons.push(`${skill.charAt(0).toUpperCase() + skill.slice(1)} skills indicated`);

        // Add specific logic traces
        const traces = profile.logicTrace?.[`skill:${skill.toLowerCase()}`];
        if (traces) {
          traces.forEach(t => astroLogicSet.add(t));
        }
      } else if (profileValue > 30) {
        // Scaled partial credit instead of flat 0.4
        // Example: 45 -> 0.45 * 0.8 = 0.36
        skillScore += (profileValue / 100) * 0.8;
      }
    }
    score += (skillScore / Math.max(occupation.skills.length, 1)) * 30;

    // Match industry (15% weight - Decreased from 20%)
    const categoryLower = occupation.category.toLowerCase();
    let industryScore = 0;
    for (const [industry, value] of Object.entries(profile.industries)) {
      if (categoryLower.includes(industry) || industry.includes(categoryLower.split(" ")[0])) {
        // Industry match should be relatively easy to hit 100% if relevant
        industryScore = Math.min(value * 1.2, 100);
        reasons.push(`${occupation.category} industry alignment`);
      }
    }
    score += (industryScore / 100) * 15;

    // Planetary support (15% weight)
    let planetScore = 0;
    for (const planet of occupation.primaryPlanets) {
      if (profile.dominantPlanets.includes(planet)) {
        planetarySupport.push(planet);
        planetScore += 1;
      }
    }
    // Boost planet score simply: 1 planet = 50%, 2+ planets = 100% relative to weight
    // Or just linear: count / total (usually 3)
    score += (planetScore / Math.max(occupation.primaryPlanets.length, 1)) * 15;

    // Ensure score is in reasonable range (40-98)
    // We want good matches to be > 75
    const finalScore = Math.max(40, Math.min(98, Math.round(score)));

    matches.push({
      occupationId: occupation.id,
      title: occupation.title,
      category: occupation.category,
      matchScore: finalScore,
      score: finalScore, // Add for frontend compatibility
      matchReasons: Array.from(new Set(reasons)).slice(0, 4),
      reasons: Array.from(new Set(reasons)).slice(0, 4), // Add for frontend compatibility
      planetarySupport,
      astroLogic: Array.from(astroLogicSet).slice(0, 5),
    });
  }

  // Sort by score and return top matches
  return matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * Get income stream recommendations with varied scoring
 */
export function getIncomeStreamRecommendations(
  profile: CareerProfile,
  chartData: FullChartData,
  limit: number = 10
): CareerMatch[] {
  const matches: CareerMatch[] = [];
  const { d1 } = chartData;

  for (const stream of INCOME_STREAMS) {
    let score = 0;
    const reasons: string[] = [];
    const planetarySupport: string[] = [];
    const astroLogicSet = new Set<string>();

    // Planetary support (35% weight)
    let planetScore = 0;
    for (const planet of stream.favorablePlanets) {
      if (profile.dominantPlanets.includes(planet)) {
        planetarySupport.push(planet);
        planetScore += 2;
        reasons.push(`Supported by ${planet}`);

        // Add detailed trace
        const traces = profile.logicTrace?.[`skill:${stream.requiredSkills[0]}`] || [];
        if (traces.length > 0) {
          traces.forEach(t => astroLogicSet.add(t));
        } else {
          const planetPos = d1.planets.find(p => p.planet === planet);
          if (planetPos) {
            if ([1, 4, 7, 10].includes(planetPos.house)) astroLogicSet.add(`${planet} in Kendra (Strength)`);
            if ([2, 11].includes(planetPos.house)) astroLogicSet.add(`${planet} in Wealth House (${planetPos.house}th)`);
          }
        }
      } else {
        const planetPos = d1.planets.find(p => p.planet === planet);
        if (planetPos && [1, 4, 5, 7, 9, 10, 11].includes(planetPos.house)) {
          planetarySupport.push(planet);
          planetScore += 1;
          if ([2, 11].includes(planetPos.house)) {
            astroLogicSet.add(`${planet} in ${planetPos.house}th House (Wealth)`);
          } else if ([1, 4, 7, 10].includes(planetPos.house)) {
            astroLogicSet.add(`${planet} in Kendra (Action)`);
          } else if (planetPos.house === 5 || planetPos.house === 9) {
            astroLogicSet.add(`${planet} in Trikona (Fortune)`);
          }
        }
      }
    }

    // Check D2 (Hora) for Wealth Strength
    if (chartData.d2) {
      for (const planet of stream.favorablePlanets) {
        const d2Planet = chartData.d2.planets.find(p => p.planet === planet);
        if (d2Planet && [2, 11].includes(d2Planet.house)) {
          planetScore += 0.5;
          astroLogicSet.add(`${planet} strong in D2 (Wealth Chart)`);
        }
      }
    }

    // Check D10 (Dasamsa) for Career Strength
    if (chartData.d10) {
      for (const planet of stream.favorablePlanets) {
        const d10Planet = chartData.d10.planets.find(p => p.planet === planet);
        if (d10Planet && [1, 10].includes(d10Planet.house)) {
          planetScore += 0.5;
          astroLogicSet.add(`${planet} strong in D10 (Career Action)`);
        }
      }
    }

    score += (planetScore / (stream.favorablePlanets.length * 2 + 1)) * 35;

    // House support (25% weight)
    let houseScore = 0;
    for (const house of stream.favorableHouses) {
      if (profile.strongHouses.includes(house)) {
        houseScore += 1;
        reasons.push(`Strong ${house}th house`);
      }
    }
    score += (houseScore / stream.favorableHouses.length) * 25;

    // Skill match (25% weight)
    let skillScore = 0;
    for (const skill of stream.requiredSkills) {
      const profileValue = profile.skills[skill] || 0;
      if (profileValue > 50) {
        skillScore += profileValue / 100;
        reasons.push(`${skill.charAt(0).toUpperCase() + skill.slice(1)} aptitude`);

        // Add skill traces
        const traces = profile.logicTrace?.[`skill:${skill}`];
        if (traces) {
          traces.forEach(t => astroLogicSet.add(t));
        }
      }
    }
    score += (skillScore / stream.requiredSkills.length) * 25;

    // Work style match (15% weight)
    if (stream.category === "passive" && profile.workStyles["independent"]) {
      score += (profile.workStyles["independent"] / 100) * 15;
      reasons.push("Suits independent style");
    } else if (stream.category === "active" && profile.workStyles["collaborative"]) {
      score += (profile.workStyles["collaborative"] / 100) * 15;
      reasons.push("Suits collaborative style");
    } else if (stream.category === "hybrid") {
      score += 10;
    }

    // Risk tolerance adjustment
    const marsInfluence = profile.industries["engineering"] || profile.industries["sports"] || 0;
    const saturnInfluence = profile.workValues["stability"] || 0;

    if (stream.riskLevel === "high" && marsInfluence > saturnInfluence) {
      score += 5;
      reasons.push("Risk tolerance indicated");
    } else if (stream.riskLevel === "low" && saturnInfluence > marsInfluence) {
      score += 5;
      reasons.push("Preference for stability");
    }

    // Ensure varied scores (25-90 range)
    const finalScore = Math.max(25, Math.min(90, Math.round(score)));

    matches.push({
      incomeStreamId: stream.id,
      title: stream.name,
      name: stream.name, // Add for frontend compatibility
      category: stream.category,
      matchScore: finalScore,
      score: finalScore, // Add for frontend compatibility
      matchReasons: Array.from(new Set(reasons)).slice(0, 4),
      reasons: Array.from(new Set(reasons)).slice(0, 4), // Add for frontend compatibility
      planetarySupport,
      astroLogic: Array.from(astroLogicSet).slice(0, 5),
    });
  }

  return matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * Get timing insights for career moves
 */
export function getCareerTimingInsights(chartData: FullChartData): string[] {
  const insights: string[] = [];
  const { currentDasha, dashas } = chartData;

  // Current Mahadasha insights
  const mahadashaInsights: Record<string, string> = {
    "Sun": "Current period favors leadership roles, government positions, and authority-based careers.",
    "Moon": "Ideal time for careers in healthcare, hospitality, and public-facing roles.",
    "Mars": "Period supports technical careers, engineering, sports, and competitive fields.",
    "Mercury": "Excellent for communication, technology, finance, and analytical careers.",
    "Jupiter": "Favorable for education, law, consulting, and advisory positions.",
    "Venus": "Best period for arts, entertainment, luxury goods, and creative fields.",
    "Saturn": "Supports careers requiring discipline, management, and long-term building.",
    "Rahu": "Period favors unconventional careers, technology, and foreign opportunities.",
    "Ketu": "Suitable for research, spiritual pursuits, and healing professions.",
  };

  if (currentDasha.mahadasha && mahadashaInsights[currentDasha.mahadasha]) {
    insights.push(mahadashaInsights[currentDasha.mahadasha]);
  }

  // Antardasha refinement
  if (currentDasha.antardasha) {
    insights.push(
      `The ${currentDasha.antardasha} sub-period adds its influence, ` +
      `creating a ${currentDasha.mahadasha}-${currentDasha.antardasha} energy combination.`
    );
  }

  // Find upcoming favorable periods
  const now = new Date();
  for (const dasha of dashas) {
    if (dasha.startDate > now && dasha.startDate.getTime() - now.getTime() < 365 * 24 * 60 * 60 * 1000) {
      insights.push(
        `Upcoming ${dasha.planet} period starting ${dasha.startDate.toLocaleDateString()} ` +
        `will bring new career opportunities aligned with ${dasha.planet}'s significations.`
      );
      break;
    }
  }

  return insights;
}
