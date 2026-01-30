import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useGuestChart } from "@/contexts/GuestChartContext";
import { useState, useMemo } from "react";
import {
  Compass,
  ArrowLeft,
  Star,
  Briefcase,
  TrendingUp,
  ChevronRight,
  Save,
  X,
  CheckCircle,
  Target,
  Sparkles,
  BrainCircuit,
  Loader2
} from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const HOLLAND_CODE_NAMES: Record<string, string> = {
  R: "Realistic (Hands-on)",
  I: "Investigative (Analytical)",
  A: "Artistic (Creative)",
  S: "Social (Helper)",
  E: "Enterprising (Leader)",
  C: "Conventional (Organizer)"
};

function getHollandCodeName(code: string): string {
  return HOLLAND_CODE_NAMES[code] || code;
}

interface CareerMatch {
  title: string;
  category: string;
  score: number;
  reasons: string[];
  description?: string;
  keySkills?: string[];
  planetarySupport?: string[];
  growthPotential?: string;
  challenges?: string[];
  astroLogic?: string[];
}

// Client-side career profile generation for guest users
function generateGuestCareerProfile(chartData: any) {
  if (!chartData?.d1?.planets) return null;

  const planets = chartData.d1.planets;
  const hollandCodes: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const skills: Record<string, number> = {};
  const industries: Record<string, number> = {};
  const workStyles: Record<string, number> = {};

  // Planet to Holland code mapping with varied weights
  const planetHolland: Record<string, { codes: string[], weight: number }> = {
    Sun: { codes: ["E", "R"], weight: 1.3 },
    Moon: { codes: ["S", "A"], weight: 1.1 },
    Mars: { codes: ["R", "E"], weight: 1.4 },
    Mercury: { codes: ["I", "C"], weight: 1.2 },
    Jupiter: { codes: ["S", "I"], weight: 1.3 },
    Venus: { codes: ["A", "S"], weight: 1.1 },
    Saturn: { codes: ["C", "R"], weight: 1.2 },
    Rahu: { codes: ["I", "E"], weight: 0.9 },
    Ketu: { codes: ["A", "I"], weight: 0.8 },
    Uranus: { codes: ["I", "R"], weight: 1.0 },
    Neptune: { codes: ["A", "S"], weight: 1.0 },
    Pluto: { codes: ["I", "E"], weight: 1.0 }
  };

  // Planet to skills mapping
  const planetSkills: Record<string, string[]> = {
    Sun: ["leadership", "management", "public_speaking"],
    Moon: ["empathy", "creativity", "intuition"],
    Mars: ["technical", "engineering", "athletics"],
    Mercury: ["communication", "analysis", "writing"],
    Jupiter: ["teaching", "counseling", "strategy"],
    Venus: ["design", "arts", "diplomacy"],
    Saturn: ["organization", "discipline", "research"],
    Rahu: ["innovation", "technology", "entrepreneurship"],
    Ketu: ["spirituality", "healing", "research"],
    Uranus: ["innovation", "technical", "problem_solving"],
    Neptune: ["creativity", "intuition", "empathy"],
    Pluto: ["research", "crisis_management", "analysis"]
  };

  // Planet to industries mapping
  const planetIndustries: Record<string, string[]> = {
    Sun: ["government", "entertainment", "healthcare"],
    Moon: ["hospitality", "healthcare", "retail"],
    Mars: ["engineering", "military", "sports"],
    Mercury: ["media", "technology", "education"],
    Jupiter: ["education", "finance", "consulting"],
    Venus: ["arts", "fashion", "hospitality"],
    Saturn: ["manufacturing", "real_estate", "law"],
    Rahu: ["technology", "aviation", "research"],
    Ketu: ["healthcare", "spirituality", "research"],
    Uranus: ["technology", "aviation", "science"],
    Neptune: ["entertainment", "healing", "oil_gas"],
    Pluto: ["mining", "research", "psychology"]
  };

  // House strength multipliers (angular houses strongest)
  const houseStrength: Record<number, number> = {
    1: 1.5, 4: 1.4, 7: 1.4, 10: 1.5, // Angular (Kendra)
    2: 1.2, 5: 1.3, 8: 0.9, 11: 1.2, // Succedent
    3: 1.0, 6: 0.8, 9: 1.3, 12: 0.7  // Cadent
  };

  const logicTrace: Record<string, string[]> = {};

  // Helper to add logic trace
  const addTrace = (key: string, condition: string) => {
    if (!logicTrace[key]) logicTrace[key] = [];
    if (!logicTrace[key].includes(condition)) logicTrace[key].push(condition);
  };

  planets.forEach((planet: any) => {
    const baseStrength = houseStrength[planet.house] || 1.0;
    const retrogradeBonus = planet.isRetrograde ? 0.1 : 0;
    const planetConfig = planetHolland[planet.planet];

    // Generate conditions string for this planet
    const conditions: string[] = [];

    // Sign check (simplified for guest)
    const exaltations: Record<string, string> = {
      "Sun": "Aries", "Moon": "Taurus", "Mars": "Capricorn", "Mercury": "Virgo",
      "Jupiter": "Cancer", "Venus": "Pisces", "Saturn": "Libra", "Rahu": "Taurus", "Ketu": "Scorpio",
      "Uranus": "Scorpio", "Neptune": "Leo", "Pluto": "Aries"
    };
    const ownSigns: Record<string, string[]> = {
      "Sun": ["Leo"], "Moon": ["Cancer"], "Mars": ["Aries", "Scorpio"],
      "Mercury": ["Gemini", "Virgo"], "Jupiter": ["Sagittarius", "Pisces"],
      "Venus": ["Taurus", "Libra"], "Saturn": ["Capricorn", "Aquarius"],
      "Uranus": ["Aquarius"], "Neptune": ["Pisces"], "Pluto": ["Scorpio"]
    };

    if (exaltations[planet.planet] === planet.sign) {
      conditions.push(`${planet.planet} Exalted in ${planet.sign}`);
    } else if (ownSigns[planet.planet]?.includes(planet.sign)) {
      conditions.push(`${planet.planet} in Own Sign (${planet.sign})`);
    }

    // House check
    if ([1, 4, 7, 10].includes(planet.house)) {
      conditions.push(`${planet.planet} in ${planet.house}th House (Kendra)`);
    } else if ([5, 9].includes(planet.house)) {
      conditions.push(`${planet.planet} in ${planet.house}th House (Trikona)`);
    } else if (planet.house === 2 || planet.house === 11) {
      conditions.push(`${planet.planet} in ${planet.house}th House`);
    }

    // Digbala check
    const digbala: Record<string, number> = {
      "Sun": 10, "Mars": 10, "Moon": 4, "Venus": 4,
      "Jupiter": 1, "Mercury": 1, "Saturn": 7
    };
    if (digbala[planet.planet] === planet.house) {
      conditions.push(`${planet.planet} has Digbala`);
    }
    // D9 Vargottama & Strength Check
    if (chartData.d9?.planets) {
      const d9Planet = chartData.d9.planets.find((p: any) => p.planet === planet.planet);
      if (d9Planet) {
        if (d9Planet.sign === planet.sign) {
          conditions.push(`${planet.planet} Vargottama (Strength)`);
        } else if (exaltations[planet.planet] === d9Planet.sign) {
          conditions.push(`${planet.planet} Exalted in D9`);
        } else if (ownSigns[planet.planet]?.includes(d9Planet.sign)) {
          conditions.push(`${planet.planet} in Own Sign in D9`);
        }
      }
    }

    if (planetConfig) {
      const strength = (baseStrength + retrogradeBonus) * planetConfig.weight;

      // Holland codes
      planetConfig.codes.forEach((code, idx) => {
        const codeWeight = idx === 0 ? strength : strength * 0.7;
        hollandCodes[code] = (hollandCodes[code] || 0) + codeWeight;

        // Add trace if significant
        if (strength > 1.2 && conditions.length > 0) {
          conditions.forEach(c => addTrace(`holland_code:${code}`, c));
        }
      });
    }

    // Skills with house-based weighting
    planetSkills[planet.planet]?.forEach((skill, idx) => {
      const skillWeight = baseStrength * (1 - idx * 0.15);
      skills[skill] = (skills[skill] || 0) + skillWeight;

      // Add trace
      if (baseStrength > 1.2 && conditions.length > 0) {
        conditions.forEach(c => addTrace(`skill:${skill}`, c));
      }
    });

    // Industries
    planetIndustries[planet.planet]?.forEach((ind, idx) => {
      const indWeight = baseStrength * (1 - idx * 0.1);
      industries[ind] = (industries[ind] || 0) + indWeight;
    });
  });

  // D10 Check (if available)
  if (chartData.d10?.planets) {
    chartData.d10.planets.forEach((p: any) => {
      if (["Uranus", "Neptune", "Pluto"].includes(p.planet)) return;
      if ([1, 10].includes(p.house)) {
        // Find related skills for this planet and boost trace
        const pSkills = planetSkills[p.planet] || [];
        pSkills.forEach(s => addTrace(`skill:${s}`, `${p.planet} strong in D10`));
      }
    });
  }

  // Work styles based on ascendant and Moon sign
  const ascSign = chartData.d1.ascendant?.sign;
  const moonPlanet = planets.find((p: any) => p.planet === "Moon");
  const moonSign = moonPlanet?.sign;

  const fireSign = ["Aries", "Leo", "Sagittarius"];
  const earthSign = ["Taurus", "Virgo", "Capricorn"];
  const airSign = ["Gemini", "Libra", "Aquarius"];
  const waterSign = ["Cancer", "Scorpio", "Pisces"];

  if (fireSign.includes(ascSign)) {
    workStyles["independent"] = 2.0;
    workStyles["fast_paced"] = 1.5;
    workStyles["leadership"] = 1.3;
  } else if (earthSign.includes(ascSign)) {
    workStyles["structured"] = 2.0;
    workStyles["stable"] = 1.5;
    workStyles["methodical"] = 1.3;
  } else if (airSign.includes(ascSign)) {
    workStyles["collaborative"] = 2.0;
    workStyles["flexible"] = 1.5;
    workStyles["communicative"] = 1.3;
  } else if (waterSign.includes(ascSign)) {
    workStyles["creative"] = 2.0;
    workStyles["supportive"] = 1.5;
    workStyles["intuitive"] = 1.3;
  }

  // Moon sign influence on work style
  if (moonSign && fireSign.includes(moonSign)) {
    workStyles["ambitious"] = (workStyles["ambitious"] || 0) + 1.0;
  } else if (moonSign && earthSign.includes(moonSign)) {
    workStyles["practical"] = (workStyles["practical"] || 0) + 1.0;
  } else if (moonSign && airSign.includes(moonSign)) {
    workStyles["intellectual"] = (workStyles["intellectual"] || 0) + 1.0;
  } else if (moonSign && waterSign.includes(moonSign)) {
    workStyles["empathetic"] = (workStyles["empathetic"] || 0) + 1.0;
  }

  return { hollandCodes, skills, industries, workStyles, logicTrace };
}

// [REMOVED PLANETARY_ASSOCIATIONS]

// Comprehensive career database with varied scoring potential
const CAREER_DATABASE: CareerMatch[] = [
  {
    title: "Software Engineer",
    category: "Technology",
    score: 0,
    reasons: [],
    description: "Design, develop, and maintain software applications and systems.",
    keySkills: ["Programming", "Problem-solving", "System design"],
    growthPotential: "High - Growing demand across all industries",
    challenges: ["Rapid technology changes", "Continuous learning required"]
  },
  {
    title: "Data Scientist",
    category: "Technology",
    score: 0,
    reasons: [],
    description: "Analyze complex data to help organizations make better decisions.",
    keySkills: ["Statistics", "Machine Learning", "Data visualization"],
    growthPotential: "Very High - Data-driven decision making is expanding",
    challenges: ["Complex mathematical concepts", "Data quality issues"]
  },
  {
    title: "Marketing Manager",
    category: "Business",
    score: 0,
    reasons: [],
    description: "Plan and execute marketing strategies to promote products or services.",
    keySkills: ["Strategic thinking", "Communication", "Creativity"],
    growthPotential: "Moderate - Evolving with digital transformation",
    challenges: ["Measuring ROI", "Keeping up with trends"]
  },
  {
    title: "Financial Analyst",
    category: "Finance",
    score: 0,
    reasons: [],
    description: "Evaluate financial data and provide investment recommendations.",
    keySkills: ["Financial modeling", "Analysis", "Attention to detail"],
    growthPotential: "Moderate - Stable demand in financial sector",
    challenges: ["Market volatility", "Regulatory changes"]
  },
  {
    title: "UX Designer",
    category: "Design",
    score: 0,
    reasons: [],
    description: "Create user-centered designs for digital products and services.",
    keySkills: ["User research", "Prototyping", "Visual design"],
    growthPotential: "High - User experience is increasingly valued",
    challenges: ["Balancing user needs with business goals"]
  },
  {
    title: "Project Manager",
    category: "Business",
    score: 0,
    reasons: [],
    description: "Lead teams and manage projects from initiation to completion.",
    keySkills: ["Leadership", "Organization", "Communication"],
    growthPotential: "High - Essential role across industries",
    challenges: ["Stakeholder management", "Resource constraints"]
  },
  {
    title: "Teacher/Professor",
    category: "Education",
    score: 0,
    reasons: [],
    description: "Educate and mentor students in academic or professional settings.",
    keySkills: ["Teaching", "Subject expertise", "Patience"],
    growthPotential: "Stable - Consistent demand for educators",
    challenges: ["Administrative burden", "Diverse learning needs"]
  },
  {
    title: "Healthcare Professional",
    category: "Healthcare",
    score: 0,
    reasons: [],
    description: "Provide medical care and support to patients.",
    keySkills: ["Medical knowledge", "Empathy", "Decision-making"],
    growthPotential: "Very High - Aging population increases demand",
    challenges: ["Emotional stress", "Long hours"]
  },
  {
    title: "Entrepreneur",
    category: "Business",
    score: 0,
    reasons: [],
    description: "Start and manage your own business venture.",
    keySkills: ["Risk-taking", "Innovation", "Leadership"],
    growthPotential: "Variable - Depends on business success",
    challenges: ["Financial uncertainty", "Work-life balance"]
  },
  {
    title: "Content Creator",
    category: "Media",
    score: 0,
    reasons: [],
    description: "Create engaging content for digital platforms and audiences.",
    keySkills: ["Creativity", "Communication", "Technical skills"],
    growthPotential: "High - Digital content consumption growing",
    challenges: ["Algorithm changes", "Monetization"]
  },
  {
    title: "Consultant",
    category: "Business",
    score: 0,
    reasons: [],
    description: "Provide expert advice to organizations in specialized areas.",
    keySkills: ["Problem-solving", "Communication", "Industry expertise"],
    growthPotential: "High - Organizations seek external expertise",
    challenges: ["Travel requirements", "Client management"]
  },
  {
    title: "Research Scientist",
    category: "Science",
    score: 0,
    reasons: [],
    description: "Conduct research to advance knowledge in scientific fields.",
    keySkills: ["Research methodology", "Analysis", "Writing"],
    growthPotential: "Moderate - Funding dependent",
    challenges: ["Grant writing", "Publication pressure"]
  },
  {
    title: "Lawyer/Legal Professional",
    category: "Legal",
    score: 0,
    reasons: [],
    description: "Provide legal advice and represent clients in legal matters.",
    keySkills: ["Legal knowledge", "Argumentation", "Research"],
    growthPotential: "Moderate - Stable demand for legal services",
    challenges: ["Long hours", "High stress"]
  },
  {
    title: "Architect",
    category: "Design",
    score: 0,
    reasons: [],
    description: "Design buildings and structures that are functional and aesthetic.",
    keySkills: ["Design", "Technical drawing", "Creativity"],
    growthPotential: "Moderate - Tied to construction industry",
    challenges: ["Long project timelines", "Client expectations"]
  },
  {
    title: "Psychologist/Counselor",
    category: "Healthcare",
    score: 0,
    reasons: [],
    description: "Help individuals with mental health and personal challenges.",
    keySkills: ["Empathy", "Active listening", "Assessment"],
    growthPotential: "High - Growing mental health awareness",
    challenges: ["Emotional toll", "Complex cases"]
  },
  {
    title: "Sales Executive",
    category: "Business",
    score: 0,
    reasons: [],
    description: "Drive revenue by selling products or services to customers.",
    keySkills: ["Persuasion", "Relationship building", "Negotiation"],
    growthPotential: "High - Essential for business growth",
    challenges: ["Target pressure", "Rejection handling"]
  },
  {
    title: "Artist/Creative Professional",
    category: "Arts",
    score: 0,
    reasons: [],
    description: "Create visual art, music, or other creative works.",
    keySkills: ["Creativity", "Technical skills", "Self-expression"],
    growthPotential: "Variable - Depends on recognition",
    challenges: ["Income stability", "Market competition"]
  },
  {
    title: "Human Resources Manager",
    category: "Business",
    score: 0,
    reasons: [],
    description: "Manage employee relations, recruitment, and organizational culture.",
    keySkills: ["People management", "Communication", "Conflict resolution"],
    growthPotential: "Moderate - Essential organizational function",
    challenges: ["Employee conflicts", "Policy compliance"]
  }
];

// Career scoring configuration
const CAREER_SCORING: Record<string, { holland: string[], skills: string[], industries: string[], baseScore: number }> = {
  "Software Engineer": { holland: ["I", "R"], skills: ["technical", "analysis", "innovation"], industries: ["technology"], baseScore: 45 },
  "Data Scientist": { holland: ["I", "C"], skills: ["analysis", "research", "technical"], industries: ["technology", "research"], baseScore: 42 },
  "Marketing Manager": { holland: ["E", "A"], skills: ["communication", "creativity", "strategy"], industries: ["media", "retail"], baseScore: 48 },
  "Financial Analyst": { holland: ["C", "I"], skills: ["analysis", "organization", "discipline"], industries: ["finance"], baseScore: 44 },
  "UX Designer": { holland: ["A", "I"], skills: ["design", "creativity", "empathy"], industries: ["technology", "arts"], baseScore: 46 },
  "Project Manager": { holland: ["E", "C"], skills: ["leadership", "organization", "communication"], industries: ["technology", "consulting"], baseScore: 50 },
  "Teacher/Professor": { holland: ["S", "I"], skills: ["teaching", "communication", "empathy"], industries: ["education"], baseScore: 47 },
  "Healthcare Professional": { holland: ["S", "I"], skills: ["empathy", "healing", "intuition"], industries: ["healthcare"], baseScore: 43 },
  "Entrepreneur": { holland: ["E", "R"], skills: ["entrepreneurship", "leadership", "innovation"], industries: ["technology", "retail"], baseScore: 40 },
  "Content Creator": { holland: ["A", "E"], skills: ["creativity", "communication", "writing"], industries: ["media", "entertainment"], baseScore: 45 },
  "Consultant": { holland: ["E", "I"], skills: ["strategy", "analysis", "communication"], industries: ["consulting", "finance"], baseScore: 48 },
  "Research Scientist": { holland: ["I", "R"], skills: ["research", "analysis", "discipline"], industries: ["research", "healthcare"], baseScore: 41 },
  "Lawyer/Legal Professional": { holland: ["E", "C"], skills: ["communication", "analysis", "discipline"], industries: ["law"], baseScore: 44 },
  "Architect": { holland: ["A", "R"], skills: ["design", "creativity", "technical"], industries: ["real_estate", "arts"], baseScore: 43 },
  "Psychologist/Counselor": { holland: ["S", "I"], skills: ["empathy", "counseling", "intuition"], industries: ["healthcare", "education"], baseScore: 46 },
  "Sales Executive": { holland: ["E", "S"], skills: ["communication", "diplomacy", "entrepreneurship"], industries: ["retail", "technology"], baseScore: 49 },
  "Artist/Creative Professional": { holland: ["A", "S"], skills: ["creativity", "design", "arts"], industries: ["arts", "entertainment"], baseScore: 38 },
  "Human Resources Manager": { holland: ["S", "E"], skills: ["empathy", "communication", "organization"], industries: ["consulting", "hospitality"], baseScore: 47 }
};

// Client-side career recommendations with varied scoring
function generateGuestRecommendations(careerProfile: any): { matches: CareerMatch[], timingInsights: string[] } {
  if (!careerProfile) return { matches: [], timingInsights: [] };

  const matches: CareerMatch[] = CAREER_DATABASE.map(career => {
    const config = CAREER_SCORING[career.title];
    if (!config) return { ...career, score: 50, reasons: ["General match"] };

    let score = config.baseScore;
    const reasons: string[] = [];
    const planetarySupport: string[] = [];
    const astroLogicSet = new Set<string>();

    // Holland code matching (max 25 points)
    let hollandBonus = 0;
    config.holland.forEach((code, idx) => {
      const codeScore = careerProfile.hollandCodes[code] || 0;
      const weight = idx === 0 ? 1.0 : 0.6;
      if (codeScore > 1.5) {
        hollandBonus += Math.min(codeScore * 4 * weight, 15);
        reasons.push(`Strong ${getHollandCodeName(code).split(" ")[0]} aptitude`);
        // Add traces
        const traces = careerProfile.logicTrace?.[`holland_code:${code}`];
        if (traces) traces.forEach((t: string) => astroLogicSet.add(t));
      } else if (codeScore > 0.8) {
        hollandBonus += Math.min(codeScore * 2 * weight, 8);
      }
    });
    score += Math.min(hollandBonus, 25);

    // Skills matching (max 20 points)
    let skillBonus = 0;
    config.skills.forEach((skill, idx) => {
      const skillScore = careerProfile.skills[skill] || 0;
      if (skillScore > 1.2) {
        skillBonus += Math.min(skillScore * 3, 8);
        if (idx < 2) reasons.push(`${skill.replace(/_/g, " ")} skills`);
        planetarySupport.push(skill);
        // Add traces
        const traces = careerProfile.logicTrace?.[`skill:${skill}`];
        if (traces) traces.forEach((t: string) => astroLogicSet.add(t));
      } else if (skillScore > 0.5) {
        skillBonus += Math.min(skillScore * 1.5, 4);
      }
    });
    score += Math.min(skillBonus, 20);

    // Industry matching (max 10 points)
    let industryBonus = 0;
    config.industries.forEach(ind => {
      const indScore = careerProfile.industries[ind] || 0;
      if (indScore > 1.0) {
        industryBonus += Math.min(indScore * 2, 5);
      }
    });
    score += Math.min(industryBonus, 10);

    // Work style alignment (max 5 points)
    const workStyleKeys = Object.keys(careerProfile.workStyles || {});
    if (workStyleKeys.length > 0) {
      const topWorkStyle = workStyleKeys.reduce((a, b) =>
        (careerProfile.workStyles[a] || 0) > (careerProfile.workStyles[b] || 0) ? a : b
      );

      // Certain careers align better with certain work styles
      const workStyleMatch: Record<string, string[]> = {
        "independent": ["Entrepreneur", "Artist/Creative Professional", "Content Creator"],
        "collaborative": ["Project Manager", "Human Resources Manager", "Consultant"],
        "structured": ["Financial Analyst", "Research Scientist", "Lawyer/Legal Professional"],
        "creative": ["UX Designer", "Content Creator", "Artist/Creative Professional"],
        "leadership": ["Project Manager", "Marketing Manager", "Entrepreneur"]
      };

      if (workStyleMatch[topWorkStyle]?.includes(career.title)) {
        score += 5;
        reasons.push(`Matches your ${topWorkStyle.replace(/_/g, " ")} work style`);
      }
    }

    // Cap score at 95 and ensure minimum of 35
    const finalScore = Math.max(35, Math.min(Math.round(score), 95));

    return {
      ...career,
      score: finalScore,
      reasons: reasons.slice(0, 4),
      planetarySupport: planetarySupport.slice(0, 3),
      astroLogic: Array.from(astroLogicSet).slice(0, 5)
    };
  });

  // Sort by score and return top 12
  const sortedMatches = matches.sort((a, b) => b.score - a.score).slice(0, 12);

  // Generate timing insights based on profile
  const timingInsights = generateTimingInsights(careerProfile);

  return { matches: sortedMatches, timingInsights };
}

function generateTimingInsights(careerProfile: any): string[] {
  const insights: string[] = [];

  const topHolland = Object.entries(careerProfile.hollandCodes || {})
    .sort(([, a], [, b]) => (b as number) - (a as number))[0];

  if (topHolland) {
    const [code] = topHolland;
    if (code === "E") {
      insights.push("Your enterprising nature is highlighted now - good time for leadership roles and business ventures.");
    } else if (code === "I") {
      insights.push("Analytical energies are strong - ideal period for research, learning, and skill development.");
    } else if (code === "A") {
      insights.push("Creative energies are flowing - excellent time for artistic pursuits and innovative projects.");
    } else if (code === "S") {
      insights.push("Social connections are favored - networking and collaborative opportunities will be beneficial.");
    } else if (code === "R") {
      insights.push("Practical skills are emphasized - hands-on work and technical projects will be rewarding.");
    } else if (code === "C") {
      insights.push("Organizational abilities are strong - good time for systematic planning and structured work.");
    }
  }

  insights.push("Consider exploring career opportunities that align with your top strengths for maximum success.");
  insights.push("Professional development and certifications in your strong areas will yield good returns.");

  return insights;
}

export default function CareerPathfinder() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { guestChart, hasGuestChart } = useGuestChart();
  const [selectedCareer, setSelectedCareer] = useState<CareerMatch | null>(null);
  const [aiCareers, setAiCareers] = useState<any[]>([]);

  // Mutation for AI expansion
  const expandMutation = trpc.ai.expandCareerList.useMutation({
    onSuccess: (data: any) => {
      setAiCareers(data);
      toast.success("Cosmic suggestions loaded!");
    },
    onError: (error) => {
      toast.error(`Failed to load suggestions: ${error.message}`);
    }
  });

  // For authenticated users - fetch from database
  const { data: profiles, isLoading: profilesLoading } = trpc.profile.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const primaryProfile = profiles?.find(p => p.isPrimary) || profiles?.[0];

  const { data: careerProfile, isLoading: careerLoading } = trpc.career.getProfile.useQuery(
    { profileId: primaryProfile?.id || 0 },
    { enabled: isAuthenticated && !!primaryProfile?.id }
  );

  const { data: recommendations, isLoading: recsLoading } = trpc.career.getRecommendations.useQuery(
    { profileId: primaryProfile?.id || 0, limit: 12 },
    { enabled: isAuthenticated && !!primaryProfile?.id }
  );

  // Generate guest career data client-side
  const guestCareerProfile = useMemo(() => {
    if (!isAuthenticated && hasGuestChart && guestChart?.chartData) {
      return generateGuestCareerProfile(guestChart.chartData);
    }
    return null;
  }, [isAuthenticated, hasGuestChart, guestChart]);

  const guestRecommendations = useMemo(() => {
    if (guestCareerProfile) {
      return generateGuestRecommendations(guestCareerProfile);
    }
    return null;
  }, [guestCareerProfile]);

  // Use appropriate data based on auth status
  const activeCareerProfile = isAuthenticated ? careerProfile : guestCareerProfile;
  const activeRecommendations = isAuthenticated ? recommendations : guestRecommendations;

  const isLoading = authLoading || (isAuthenticated && (profilesLoading || careerLoading || recsLoading));
  const hasData = isAuthenticated ? !!primaryProfile : hasGuestChart;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <Compass className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Profile Found</h2>
            <p className="text-muted-foreground mb-4">
              Create your birth chart to discover your career path.
            </p>
            <Button asChild>
              <Link href="/onboarding">Create Chart</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center gap-4 h-16">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">Career Pathfinder</h1>
            <p className="text-sm text-muted-foreground">Discover your cosmic career blueprint</p>
          </div>
          {!isAuthenticated && hasGuestChart && (
            <Button variant="outline" size="sm" onClick={() => window.location.href = getLoginUrl()}>
              <Save className="w-4 h-4 mr-2" />
              Sign In to Save
            </Button>
          )}
        </div>
      </header>

      <main className="container py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Guest mode banner */}
          {!isAuthenticated && hasGuestChart && (
            <Card className="border-amber-500/50 bg-amber-500/10">
              <CardContent className="p-4 flex items-center gap-3">
                <Save className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Guest Mode</p>
                  <p className="text-sm text-amber-700">Sign in to save your career analysis and track changes over time</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Career Profile Summary */}
          {activeCareerProfile && (
            <Card className="cosmic-gradient text-white">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Your Career Profile</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-white/80 text-sm mb-1">Top Holland Code</p>
                    <p className="text-lg font-semibold">
                      {Object.entries(activeCareerProfile.hollandCodes || {})
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 1)
                        .map(([code]) => getHollandCodeName(code))
                        .join(", ") || "Analyzing..."}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm mb-1">Top Industry</p>
                    <p className="text-lg font-semibold capitalize">
                      {Object.entries(activeCareerProfile.industries || {})
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 1)
                        .map(([ind]) => ind.replace(/_/g, " "))
                        .join(", ") || "Analyzing..."}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm mb-1">Top Skill</p>
                    <p className="text-lg font-semibold capitalize">
                      {Object.entries(activeCareerProfile.skills || {})
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 1)
                        .map(([skill]) => skill.replace(/_/g, " "))
                        .join(", ") || "Analyzing..."}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm mb-1">Work Style</p>
                    <p className="text-lg font-semibold capitalize">
                      {Object.entries(activeCareerProfile.workStyles || {})
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 1)
                        .map(([style]) => style.replace(/_/g, " "))
                        .join(", ") || "Analyzing..."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Core Strengths */}
          {activeCareerProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Core Strengths
                </CardTitle>
                <CardDescription>
                  Natural abilities indicated by your planetary positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(activeCareerProfile.skills || {})
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 6)
                    .map(([skill], i) => (
                      <Badge key={i} variant="secondary" className="text-sm py-1 px-3 capitalize">
                        {skill.replace(/_/g, " ")}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Career Recommendations */}
          {activeRecommendations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Recommended Career Paths
                </CardTitle>
                <CardDescription>
                  Careers aligned with your astrological profile - click to view details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeRecommendations.matches?.map((match: any, i: number) => (
                    <button
                      key={i}
                      className="w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-left cursor-pointer"
                      onClick={() => setSelectedCareer(match)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{match.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {match.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${typeof match.score === 'number' && match.score >= 90 ? "bg-purple-600 hover:bg-purple-700" :
                                typeof match.score === 'number' && match.score >= 80 ? "bg-green-600 hover:bg-green-700" :
                                  typeof match.score === 'number' && match.score >= 60 ? "bg-blue-600 hover:bg-blue-700" :
                                    "bg-slate-500 hover:bg-slate-600"
                              } border-none text-white`}>
                              {typeof match.score === 'number' && match.score >= 90 ? "✨ Destiny Match" :
                                typeof match.score === 'number' && match.score >= 80 ? "High Match" :
                                  typeof match.score === 'number' && match.score >= 60 ? "Good Match" : "Moderate"}
                            </Badge>
                            <span className="text-sm font-bold ml-1">{match.score}%</span>
                            <Progress value={match.score} className="h-2 w-20 ml-auto" />
                          </div>

                          {match.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {match.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1">
                            {match.reasons?.slice(0, 3).map((reason: string, j: number) => (
                              <span key={j} className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border">
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </button>
                  ))}

                  {(!activeRecommendations.matches || activeRecommendations.matches.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">
                      No career recommendations available yet. Please ensure your chart data is complete.
                    </p>
                  )}

                  <div className="pt-4 mt-2">
                    {/* AI Career Suggestions */}
                    <div className="mb-6 pb-4 border-b">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            Cosmic Suggestions
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            AI-generated career paths based on your unique chart
                          </p>
                        </div>
                        {!aiCareers.length && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (isAuthenticated && primaryProfile?.id) {
                                expandMutation.mutate({ profileId: primaryProfile.id });
                              } else if (guestChart?.chartData) {
                                expandMutation.mutate({ chartData: guestChart.chartData });
                              } else {
                                toast.error("No chart data available for analysis");
                              }
                            }}
                            disabled={expandMutation.isPending}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                          >
                            {expandMutation.isPending ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing Stars...</>
                            ) : (
                              "Reveal Hidden Paths"
                            )}
                          </Button>
                        )}
                      </div>

                      {/* AI Results List */}
                      {aiCareers.length > 0 && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                          {aiCareers.map((career: any, i: number) => (
                            <div key={i} className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">{career.title}</h4>
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 text-xs">
                                      AI Suggested
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">{career.description}</p>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {career.skills?.map((skill: string, j: number) => (
                                      <span key={j} className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="text-xs text-purple-600 italic">
                                    "{career.reason}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <BrainCircuit className="w-4 h-4 text-primary" />
                          Don't see your dream job?
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Use our AI Validator to check compatibility with any specific role.
                        </p>
                      </div>
                      <Button asChild size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                        <Link href="/career-validator">
                          Validate a Role
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timing Insights */}
          {activeRecommendations?.timingInsights && Array.isArray(activeRecommendations.timingInsights) && activeRecommendations.timingInsights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Career Timing Insights
                </CardTitle>
                <CardDescription>
                  Best periods for career moves based on your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeRecommendations.timingInsights.map((insight: string, i: number) => (
                    <div key={i} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{insight}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Career Detail Dialog */}
      <Dialog open={!!selectedCareer} onOpenChange={() => setSelectedCareer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCareer?.title}
              <Badge variant="outline">{selectedCareer?.category}</Badge>
            </DialogTitle>
            <DialogDescription>
              Career match analysis based on your astrological profile
            </DialogDescription>
          </DialogHeader>

          {selectedCareer && (
            <div className="space-y-4">
              {/* Match Score */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Match Score</span>
                  <span className={`text-lg font-bold ${selectedCareer.score >= 80 ? "text-green-600" :
                    selectedCareer.score >= 60 ? "text-primary" :
                      "text-muted-foreground"
                    }`}>{selectedCareer.score}%</span>
                </div>
                <Progress value={selectedCareer.score} className="h-3" />
              </div>

              {/* Description */}
              {selectedCareer.description && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    About This Career
                  </h4>
                  <p className="text-sm text-muted-foreground">{selectedCareer.description}</p>
                </div>
              )}

              {/* Match Reasons */}
              {selectedCareer.reasons && selectedCareer.reasons.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Why This Matches You
                  </h4>
                  <ul className="space-y-1">
                    {selectedCareer.reasons.map((reason, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}


              {/* Astro Logic */}
              {selectedCareer.astroLogic && selectedCareer.astroLogic.length > 0 && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg my-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Sparkles className="w-4 h-4" />
                    Astro Logic
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    This career match is supported by the following planetary influences in your chart:
                  </p>
                  <ul className="space-y-1">
                    {selectedCareer.astroLogic.map((logic, i) => (
                      <li key={i} className="text-sm text-foreground/80 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                        {logic}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Skills */}
              {selectedCareer.keySkills && (
                <div>
                  <h4 className="font-medium mb-2">Key Skills Required</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCareer.keySkills.map((skill, i) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Growth Potential */}
              {selectedCareer.growthPotential && (
                <div>
                  <h4 className="font-medium mb-1">Growth Potential</h4>
                  <p className="text-sm text-muted-foreground">{selectedCareer.growthPotential}</p>
                </div>
              )}

              {/* Challenges */}
              {selectedCareer.challenges && selectedCareer.challenges.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Potential Challenges</h4>
                  <ul className="space-y-1">
                    {selectedCareer.challenges.map((challenge, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
