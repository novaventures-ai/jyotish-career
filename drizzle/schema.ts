import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";

// ============================================
// USER TABLE (Core auth - from template)
// ============================================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// BIRTH PROFILES - User's birth data
// ============================================
export const birthProfiles = mysqlTable("birth_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileName: varchar("profileName", { length: 100 }).default("My Profile"),
  
  // Birth details
  birthDate: varchar("birthDate", { length: 10 }).notNull(), // YYYY-MM-DD
  birthTime: varchar("birthTime", { length: 8 }).notNull(),  // HH:MM:SS
  birthPlace: varchar("birthPlace", { length: 255 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  timezone: varchar("timezone", { length: 50 }).notNull(),
  timezoneOffset: decimal("timezoneOffset", { precision: 4, scale: 2 }).notNull(),
  
  // Ayanamsa preference
  ayanamsa: mysqlEnum("ayanamsa", ["lahiri", "raman", "krishnamurti"]).default("lahiri"),
  
  // Calculated chart data (cached)
  chartData: json("chartData"), // Full chart JSON
  dashaData: json("dashaData"), // Dasha periods JSON
  
  isPrimary: boolean("isPrimary").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BirthProfile = typeof birthProfiles.$inferSelect;
export type InsertBirthProfile = typeof birthProfiles.$inferInsert;

// ============================================
// CAREER CATEGORIES
// ============================================
export const careerCategories = mysqlTable("career_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  iconName: varchar("iconName", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CareerCategory = typeof careerCategories.$inferSelect;

// ============================================
// OCCUPATIONS - Career database
// ============================================
export const occupations = mysqlTable("occupations", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  
  // Career attributes
  skills: json("skills"),           // Array of required skills
  interests: json("interests"),     // Holland codes (RIASEC)
  workValues: json("workValues"),   // Work value scores
  
  // Market data
  salaryRange: varchar("salaryRange", { length: 100 }),
  jobOutlook: varchar("jobOutlook", { length: 100 }),
  educationLevel: varchar("educationLevel", { length: 100 }),
  
  // Astrological mappings
  primaryPlanets: json("primaryPlanets"),     // Planets that favor this career
  primaryHouses: json("primaryHouses"),       // Houses that indicate this career
  favorableYogas: json("favorableYogas"),     // Yogas that support this career
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Occupation = typeof occupations.$inferSelect;
export type InsertOccupation = typeof occupations.$inferInsert;

// ============================================
// INCOME STREAMS - Modern earning sources
// ============================================
export const incomeStreams = mysqlTable("income_streams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  category: mysqlEnum("category", ["active", "passive", "hybrid"]).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  description: text("description"),
  
  // Income details
  incomePotential: varchar("incomePotential", { length: 100 }),
  timeInvestment: varchar("timeInvestment", { length: 100 }),
  upfrontInvestment: mysqlEnum("upfrontInvestment", ["none", "low", "medium", "high"]),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]),
  
  // Requirements
  skillRequirements: json("skillRequirements"),
  platforms: json("platforms"),  // Relevant platforms
  
  // Astrological indicators
  favorablePlanets: json("favorablePlanets"),
  favorableHouses: json("favorableHouses"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IncomeStream = typeof incomeStreams.$inferSelect;
export type InsertIncomeStream = typeof incomeStreams.$inferInsert;

// ============================================
// ASTRO-CAREER MAPPINGS - Rules engine
// ============================================
export const astroCareerMappings = mysqlTable("astro_career_mappings", {
  id: int("id").autoincrement().primaryKey(),
  
  // Astrological indicator
  indicatorType: mysqlEnum("indicatorType", [
    "planet_in_house", 
    "planet_in_sign", 
    "house_lord", 
    "yoga",
    "dasha_lord",
    "nakshatra"
  ]).notNull(),
  indicatorValue: varchar("indicatorValue", { length: 100 }).notNull(),
  
  // Career attribute mapping
  attributeType: mysqlEnum("attributeType", [
    "holland_code",
    "skill",
    "work_value", 
    "industry",
    "work_style"
  ]).notNull(),
  attributeValue: varchar("attributeValue", { length: 100 }).notNull(),
  
  // Mapping strength
  weight: decimal("weight", { precision: 3, scale: 2 }).default("1.00"),
  
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AstroCareerMapping = typeof astroCareerMappings.$inferSelect;

// ============================================
// YOGAS - Planetary combinations
// ============================================
export const yogas = mysqlTable("yogas", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: mysqlEnum("category", ["wealth", "career", "raja", "spiritual", "other"]).notNull(),
  description: text("description"),
  
  // Detection rules (JSON format)
  detectionRules: json("detectionRules"),
  
  // Effects
  positiveEffects: text("positiveEffects"),
  negativeEffects: text("negativeEffects"),
  
  // Career implications
  careerImplications: text("careerImplications"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Yoga = typeof yogas.$inferSelect;

// ============================================
// USER CAREER RECOMMENDATIONS (cached)
// ============================================
export const userCareerRecommendations = mysqlTable("user_career_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileId: int("profileId").notNull(),
  
  // Recommendation data
  occupationId: int("occupationId"),
  incomeStreamId: int("incomeStreamId"),
  
  matchScore: decimal("matchScore", { precision: 5, scale: 2 }),
  matchReasons: json("matchReasons"),  // Array of reasons
  
  // User interaction
  isSaved: boolean("isSaved").default(false),
  isHidden: boolean("isHidden").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserCareerRecommendation = typeof userCareerRecommendations.$inferSelect;

// ============================================
// REMEDIES
// ============================================
export const remedies = mysqlTable("remedies", {
  id: int("id").autoincrement().primaryKey(),
  
  // Target
  targetType: mysqlEnum("targetType", ["planet", "house", "yoga"]).notNull(),
  targetValue: varchar("targetValue", { length: 50 }).notNull(),
  
  // Remedy details
  remedyType: mysqlEnum("remedyType", [
    "mantra",
    "gemstone", 
    "charity",
    "fasting",
    "deity_worship",
    "lifestyle"
  ]).notNull(),
  
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  
  // Effectiveness
  difficulty: mysqlEnum("difficulty", ["easy", "moderate", "advanced"]),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Remedy = typeof remedies.$inferSelect;
