
export interface Occupation {
    id: number;
    title: string;
    category: string;
    hollandCodes: Record<string, number>;
    skills: string[];
    primaryPlanets: string[];
}

export const OCCUPATIONS: Occupation[] = [
    // =================================================================
    // TIER 1: MODERN TECH & AGILE (High Priority)
    // =================================================================

    // Agile & Product
    { id: 101, title: "Scrum Master", category: "Technology", hollandCodes: { S: 85, E: 75, C: 60 }, skills: ["leadership", "communication", "management", "problem_solving"], primaryPlanets: ["Mercury", "Saturn", "Jupiter"] },
    { id: 102, title: "Agile Coach", category: "Technology", hollandCodes: { S: 90, E: 70, I: 50 }, skills: ["teaching", "leadership", "communication", "emotional_intelligence"], primaryPlanets: ["Jupiter", "Mercury", "Saturn"] },
    { id: 103, title: "Product Owner", category: "Technology", hollandCodes: { E: 85, C: 70, I: 60 }, skills: ["leadership", "analytical", "communication", "management"], primaryPlanets: ["Sun", "Mercury", "Mars"] },
    { id: 104, title: "Technical Project Manager", category: "Technology", hollandCodes: { E: 80, C: 80, R: 60 }, skills: ["management", "technical", "communication", "discipline"], primaryPlanets: ["Saturn", "Mars", "Mercury"] },
    { id: 105, title: "Product Manager", category: "Technology", hollandCodes: { E: 85, I: 70, S: 50 }, skills: ["leadership", "communication", "analytical", "creativity"], primaryPlanets: ["Sun", "Mercury", "Jupiter"] },

    // Engineering & DevOps
    { id: 110, title: "Software Engineer", category: "Technology", hollandCodes: { I: 85, R: 70, C: 50 }, skills: ["analytical", "technical", "programming", "problem_solving"], primaryPlanets: ["Mercury", "Rahu", "Ketu"] },
    { id: 111, title: "DevOps Engineer", category: "Technology", hollandCodes: { R: 85, C: 75, I: 60 }, skills: ["technical", "analytical", "discipline", "problem_solving"], primaryPlanets: ["Saturn", "Rahu", "Mars"] },
    { id: 112, title: "Site Reliability Engineer (SRE)", category: "Technology", hollandCodes: { R: 80, C: 80, I: 70 }, skills: ["technical", "analytical", "discipline", "crisis_management"], primaryPlanets: ["Saturn", "Mars", "Mercury"] },
    { id: 113, title: "Solutions Architect", category: "Technology", hollandCodes: { I: 90, E: 70, R: 60 }, skills: ["technical", "analytical", "communication", "design"], primaryPlanets: ["Jupiter", "Mercury", "Rahu"] },
    { id: 114, title: "QA Automation Engineer", category: "Technology", hollandCodes: { C: 85, R: 70, I: 60 }, skills: ["technical", "analytical", "discipline", "detail_oriented"], primaryPlanets: ["Saturn", "Mercury", "Ketu"] },
    { id: 115, title: "Full Stack Developer", category: "Technology", hollandCodes: { I: 80, R: 70, A: 50 }, skills: ["technical", "programming", "creativity", "analytical"], primaryPlanets: ["Mercury", "Rahu", "Venus"] },
    { id: 116, title: "Mobile App Developer", category: "Technology", hollandCodes: { I: 75, R: 70, A: 60 }, skills: ["technical", "programming", "creativity", "design"], primaryPlanets: ["Mercury", "Venus", "Rahu"] },

    // Data & Analytics
    { id: 120, title: "Data Scientist", category: "Technology", hollandCodes: { I: 95, C: 60, R: 50 }, skills: ["analytical", "research", "technical", "programming"], primaryPlanets: ["Mercury", "Ketu", "Jupiter"] },
    { id: 121, title: "Data Engineer", category: "Technology", hollandCodes: { R: 80, C: 80, I: 70 }, skills: ["technical", "analytical", "programming", "discipline"], primaryPlanets: ["Saturn", "Mercury", "Rahu"] },
    { id: 122, title: "Business Intelligence Analyst", category: "Technology", hollandCodes: { I: 80, C: 75, E: 50 }, skills: ["analytical", "communication", "technical", "research"], primaryPlanets: ["Mercury", "Jupiter", "Sun"] },
    { id: 123, title: "Machine Learning Engineer", category: "Technology", hollandCodes: { I: 90, R: 80, C: 50 }, skills: ["technical", "analytical", "programming", "innovation"], primaryPlanets: ["Rahu", "Mercury", "Ketu"] },

    // Cybersecurity
    { id: 130, title: "Cybersecurity Analyst", category: "Technology", hollandCodes: { I: 85, C: 80, R: 60 }, skills: ["analytical", "technical", "research", "crisis_management"], primaryPlanets: ["Mars", "Ketu", "Saturn"] },
    { id: 131, title: "Ethical Hacker", category: "Technology", hollandCodes: { R: 85, I: 80, E: 40 }, skills: ["technical", "innovation", "problem_solving", "unconventional"], primaryPlanets: ["Rahu", "Mars", "Mercury"] },

    // =================================================================
    // TIER 2: BUSINESS & OPERATIONS
    // =================================================================

    // Strategy & Operations
    { id: 201, title: "Business Operations Manager", category: "Business", hollandCodes: { E: 80, C: 75, S: 50 }, skills: ["management", "analytical", "communication", "discipline"], primaryPlanets: ["Mercury", "Saturn", "Sun"] },
    { id: 202, title: "Management Consultant", category: "Business", hollandCodes: { E: 85, I: 75, S: 60 }, skills: ["advisory", "analytical", "communication", "problem_solving"], primaryPlanets: ["Jupiter", "Mercury", "Sun"] },
    { id: 203, title: "Strategy Analyst", category: "Business", hollandCodes: { I: 85, E: 70, C: 50 }, skills: ["analytical", "research", "communication", "advisory"], primaryPlanets: ["Mercury", "Jupiter", "Saturn"] },
    { id: 204, title: "Business Development Manager", category: "Business", hollandCodes: { E: 90, S: 70, C: 40 }, skills: ["communication", "negotiation", "leadership", "networking"], primaryPlanets: ["Mercury", "Venus", "Sun"] },

    // Marketing & Sales
    { id: 210, title: "Marketing Manager", category: "Business", hollandCodes: { E: 85, A: 70, S: 60 }, skills: ["communication", "creativity", "leadership", "analytical"], primaryPlanets: ["Venus", "Mercury", "Moon"] },
    { id: 211, title: "Digital Marketing Specialist", category: "Business", hollandCodes: { E: 75, A: 65, C: 60 }, skills: ["technical", "analytical", "creativity", "communication"], primaryPlanets: ["Mercury", "Rahu", "Venus"] },
    { id: 212, title: "Sales Director", category: "Business", hollandCodes: { E: 95, S: 60, C: 40 }, skills: ["communication", "negotiation", "leadership", "financial"], primaryPlanets: ["Sun", "Mercury", "Mars"] },
    { id: 213, title: "Brand Strategist", category: "Business", hollandCodes: { A: 80, E: 70, I: 50 }, skills: ["creativity", "writing", "analytical", "communication"], primaryPlanets: ["Venus", "Mercury", "Moon"] },

    // Finance
    { id: 220, title: "Financial Analyst", category: "Finance", hollandCodes: { C: 85, I: 80, E: 50 }, skills: ["analytical", "financial", "research", "discipline"], primaryPlanets: ["Mercury", "Jupiter", "Saturn"] },
    { id: 221, title: "Investment Banker", category: "Finance", hollandCodes: { E: 85, C: 80, I: 60 }, skills: ["financial", "analytical", "negotiation", "intense"], primaryPlanets: ["Jupiter", "Mercury", "Rahu"] },
    { id: 222, title: "Accountant", category: "Finance", hollandCodes: { C: 95, I: 50, E: 40 }, skills: ["financial", "discipline", "detail_oriented", "analytical"], primaryPlanets: ["Saturn", "Mercury", "Jupiter"] },
    { id: 223, title: "Venture Capitalist", category: "Finance", hollandCodes: { E: 90, I: 70, R: 50 }, skills: ["financial", "innovation", "leadership", "risk_taking"], primaryPlanets: ["Jupiter", "Rahu", "Sun"] },
    { id: 224, title: "Stock Trader", category: "Finance", hollandCodes: { E: 80, I: 70, C: 50 }, skills: ["analytical", "financial", "risk_taking", "intuition"], primaryPlanets: ["Mercury", "Rahu", "Mars"] },

    // HR & People
    { id: 230, title: "HR Business Partner", category: "Business", hollandCodes: { S: 85, E: 70, C: 60 }, skills: ["communication", "emotional_intelligence", "management", "negotiation"], primaryPlanets: ["Venus", "Jupiter", "Saturn"] },
    { id: 231, title: "Talent Acquisition Specialist", category: "Business", hollandCodes: { E: 80, S: 80, C: 50 }, skills: ["communication", "networking", "sales", "emotional_intelligence"], primaryPlanets: ["Mercury", "Venus", "Moon"] },
    { id: 232, title: "Corporate Trainer", category: "Education", hollandCodes: { S: 85, E: 75, A: 50 }, skills: ["teaching", "communication", "leadership", "creativity"], primaryPlanets: ["Jupiter", "Sun", "Mercury"] },

    // =================================================================
    // TIER 3: CREATIVE, SPECIALIZED & SERVICE
    // =================================================================

    // Design & Creative
    { id: 301, title: "UX/UI Designer", category: "Technology", hollandCodes: { A: 85, I: 70, R: 50 }, skills: ["design", "creativity", "technical", "empathy"], primaryPlanets: ["Venus", "Mercury", "Moon"] },
    { id: 302, title: "Graphic Designer", category: "Creative", hollandCodes: { A: 95, R: 40, E: 30 }, skills: ["creativity", "design", "technical", "visual"], primaryPlanets: ["Venus", "Mercury", "Moon"] },
    { id: 303, title: "Content Writer", category: "Creative", hollandCodes: { A: 85, I: 60, S: 50 }, skills: ["writing", "creativity", "research", "communication"], primaryPlanets: ["Mercury", "Moon", "Venus"] },
    { id: 304, title: "Technical Writer", category: "Technology", hollandCodes: { I: 70, A: 60, C: 60 }, skills: ["writing", "technical", "communication", "detail_oriented"], primaryPlanets: ["Mercury", "Saturn", "Jupiter"] },
    { id: 305, title: "Film Director", category: "Creative", hollandCodes: { A: 90, E: 80, R: 60 }, skills: ["creativity", "leadership", "communication", "vision"], primaryPlanets: ["Venus", "Sun", "Rahu"] },
    { id: 306, title: "Architect", category: "Engineering", hollandCodes: { A: 80, R: 75, I: 70 }, skills: ["design", "technical", "creativity", "mathematics"], primaryPlanets: ["Venus", "Saturn", "Mars"] },

    // Healthcare
    { id: 310, title: "Doctor/Physician", category: "Healthcare", hollandCodes: { I: 90, S: 80, R: 50 }, skills: ["analytical", "emotional_intelligence", "problem_solving", "service"], primaryPlanets: ["Sun", "Jupiter", "Mars"] },
    { id: 311, title: "Psychologist", category: "Healthcare", hollandCodes: { S: 90, I: 80, A: 50 }, skills: ["emotional_intelligence", "intuition", "communication", "analytical"], primaryPlanets: ["Moon", "Mercury", "Ketu"] },
    { id: 312, title: "Surgeon", category: "Healthcare", hollandCodes: { R: 90, I: 85, S: 40 }, skills: ["technical", "physical", "precision", "intense"], primaryPlanets: ["Mars", "Sun", "Ketu"] },
    { id: 313, title: "Nurse", category: "Healthcare", hollandCodes: { S: 95, R: 50, C: 50 }, skills: ["emotional_intelligence", "service", "physical", "communication"], primaryPlanets: ["Moon", "Venus", "Mars"] },

    // Legal & Government
    { id: 320, title: "Lawyer", category: "Legal", hollandCodes: { E: 85, I: 80, S: 50 }, skills: ["analytical", "communication", "negotiation", "research"], primaryPlanets: ["Jupiter", "Mercury", "Mars"] },
    { id: 321, title: "Judge", category: "Legal", hollandCodes: { I: 85, E: 70, C: 70 }, skills: ["analytical", "leadership", "discipline", "integrity"], primaryPlanets: ["Jupiter", "Saturn", "Sun"] },
    { id: 322, title: "Diplomat", category: "Government", hollandCodes: { S: 85, E: 80, I: 60 }, skills: ["communication", "negotiation", "cultural_awareness", "leadership"], primaryPlanets: ["Venus", "Jupiter", "Sun"] },
    { id: 323, title: "Civil Servant", category: "Government", hollandCodes: { C: 90, S: 60, E: 50 }, skills: ["management", "discipline", "service", "writing"], primaryPlanets: ["Sun", "Saturn", "Moon"] },

    // Education
    { id: 330, title: "Professor", category: "Education", hollandCodes: { I: 90, S: 70, A: 50 }, skills: ["teaching", "research", "communication", "writing"], primaryPlanets: ["Jupiter", "Mercury", "Sun"] },
    { id: 331, title: "School Teacher", category: "Education", hollandCodes: { S: 90, A: 60, E: 40 }, skills: ["teaching", "emotional_intelligence", "communication", "patience"], primaryPlanets: ["Jupiter", "Moon", "Mercury"] },

    // Engineering (General)
    { id: 340, title: "Mechanical Engineer", category: "Engineering", hollandCodes: { R: 90, I: 75, C: 50 }, skills: ["technical", "analytical", "problem_solving", "design"], primaryPlanets: ["Mars", "Saturn", "Mercury"] },
    { id: 341, title: "Civil Engineer", category: "Engineering", hollandCodes: { R: 85, C: 70, I: 65 }, skills: ["technical", "management", "analytical", "construction"], primaryPlanets: ["Mars", "Saturn", "Mercury"] },
    { id: 342, title: "Electrical Engineer", category: "Engineering", hollandCodes: { R: 85, I: 80, C: 50 }, skills: ["technical", "analytical", "mathematics", "innovation"], primaryPlanets: ["Mars", "Mercury", "Uranus"] },

    // =================================================================
    // TIER 4: TRADITIONAL & INDIAN CONTEXT (High Relevance)
    // =================================================================

    // Civil Services & Government
    { id: 401, title: "IAS Officer (Civil Services)", category: "Government", hollandCodes: { E: 90, S: 80, C: 60 }, skills: ["leadership", "management", "decision_making", "service"], primaryPlanets: ["Sun", "Jupiter", "Saturn"] },
    { id: 402, title: "IPS Officer (Police Service)", category: "Government", hollandCodes: { R: 90, E: 85, S: 50 }, skills: ["leadership", "discipline", "physical", "crisis_management"], primaryPlanets: ["Mars", "Sun", "Saturn"] },
    { id: 403, title: "IFS Officer (Foreign Service)", category: "Government", hollandCodes: { S: 85, E: 80, I: 70 }, skills: ["communication", "negotiation", "cultural_awareness", "diplomacy"], primaryPlanets: ["Venus", "Jupiter", "Sun"] },
    { id: 404, title: "PSU / Govt Engineer", category: "Government", hollandCodes: { R: 85, C: 80, I: 60 }, skills: ["technical", "management", "discipline", "stability"], primaryPlanets: ["Saturn", "Mars", "Sun"] },
    { id: 405, title: "Bank PO (Probationary Officer)", category: "Finance", hollandCodes: { C: 90, E: 70, S: 50 }, skills: ["financial", "management", "communication", "analytical"], primaryPlanets: ["Mercury", "Jupiter", "Sun"] },

    // Professional Services
    { id: 410, title: "Chartered Accountant (CA)", category: "Finance", hollandCodes: { C: 95, I: 70, E: 50 }, skills: ["financial", "analytical", "discipline", "integrity"], primaryPlanets: ["Mercury", "Saturn", "Jupiter"] },
    { id: 411, title: "Company Secretary (CS)", category: "Business", hollandCodes: { C: 90, E: 60, I: 50 }, skills: ["compliance", "legal", "communication", "discipline"], primaryPlanets: ["Saturn", "Mercury", "Sun"] },
    { id: 412, title: "Ayurvedic Doctor", category: "Healthcare", hollandCodes: { I: 80, S: 80, R: 50 }, skills: ["healing", "intuition", "research", "service"], primaryPlanets: ["Jupiter", "Sun", "Ketu"] },

    // Academic & Research
    { id: 420, title: "University Professor", category: "Education", hollandCodes: { I: 90, S: 75, A: 50 }, skills: ["teaching", "research", "mentoring", "writing"], primaryPlanets: ["Jupiter", "Mercury", "Sun"] },
    { id: 421, title: "Research Scientist", category: "Science", hollandCodes: { I: 95, R: 60, C: 50 }, skills: ["research", "analytical", "innovation", "patience"], primaryPlanets: ["Mercury", "Saturn", "Ketu"] },

    // Business & Trade
    { id: 430, title: "Family Business Owner", category: "Business", hollandCodes: { E: 90, C: 60, R: 50 }, skills: ["management", "leadership", "financial", "networking"], primaryPlanets: ["Jupiter", "Sun", "Mercury"] },
    { id: 431, title: "Real Estate Developer", category: "Business", hollandCodes: { E: 85, R: 70, C: 50 }, skills: ["negotiation", "investment", "management", "vision"], primaryPlanets: ["Mars", "Saturn", "venus"] },
];
