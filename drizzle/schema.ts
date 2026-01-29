
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    openId: varchar("openId", { length: 255 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 255 }),
    loginMethod: varchar("loginMethod", { length: 50 }),
    role: varchar("role", { length: 20 }).default("user").notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const birthProfiles = pgTable("birthProfiles", {
    id: serial("id").primaryKey(),
    userId: integer("userId").references(() => users.id).notNull(),
    profileName: text("profileName").notNull(),
    birthDate: text("birthDate").notNull(), // YYYY-MM-DD
    birthTime: text("birthTime").notNull(), // HH:MM:SS
    birthPlace: text("birthPlace").notNull(),
    latitude: text("latitude").notNull(),
    longitude: text("longitude").notNull(),
    timezone: text("timezone").notNull(), // e.g., "Asia/Kolkata" or offset string
    timezoneOffset: text("timezoneOffset").notNull(),
    ayanamsa: varchar("ayanamsa", { length: 50 }).default("lahiri"),
    chartData: jsonb("chartData"),
    dashaData: jsonb("dashaData"),
    isPrimary: boolean("isPrimary").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const careerCategories = pgTable("careerCategories", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
});

export const occupations = pgTable("occupations", {
    id: serial("id").primaryKey(),
    categoryId: integer("categoryId").references(() => careerCategories.id),
    title: text("title").notNull(),
    description: text("description"),
    skills: jsonb("skills").$type<string[]>(),
    interests: jsonb("interests").$type<Record<string, number>>(),
    primaryPlanets: jsonb("primaryPlanets").$type<string[]>(),
});

export const incomeStreams = pgTable("incomeStreams", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    category: varchar("category", { length: 50 }).notNull(), // active, passive, hybrid
});

export const yogas = pgTable("yogas", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    category: varchar("category", { length: 50 }), // wealth, career, raja, etc
});

export const remedies = pgTable("remedies", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    targetType: varchar("targetType", { length: 50 }), // planet, house, etc
    targetValue: varchar("targetValue", { length: 50 }),
});

export const userCareerRecommendations = pgTable("userCareerRecommendations", {
    id: serial("id").primaryKey(),
    userId: integer("userId").references(() => users.id).notNull(),
    profileId: integer("profileId").references(() => birthProfiles.id).notNull(),
    occupationId: integer("occupationId").references(() => occupations.id),
    incomeStreamId: integer("incomeStreamId").references(() => incomeStreams.id),
    score: integer("score"),
    matchReasons: jsonb("matchReasons"),
    isSaved: boolean("isSaved").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const chatConversations = pgTable("chatConversations", {
    id: serial("id").primaryKey(),
    userId: integer("userId").references(() => users.id).notNull(),
    profileId: integer("profileId").references(() => birthProfiles.id), // Optional: if null, use primary
    title: text("title").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const chatMessages = pgTable("chatMessages", {
    id: serial("id").primaryKey(),
    conversationId: integer("conversationId").references(() => chatConversations.id, { onDelete: 'cascade' }).notNull(),
    role: varchar("role", { length: 20 }).notNull(), // 'user' | 'assistant' | 'system'
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Relations
export const chatConversationsRelations = relations(chatConversations, ({ many, one }) => ({
    messages: many(chatMessages),
    user: one(users, {
        fields: [chatConversations.userId],
        references: [users.id],
    }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
    conversation: one(chatConversations, {
        fields: [chatMessages.conversationId],
        references: [chatConversations.id],
    }),
}));

// Types
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export type InsertBirthProfile = typeof birthProfiles.$inferInsert;
export type BirthProfile = typeof birthProfiles.$inferSelect;

export type Occupation = typeof occupations.$inferSelect;
export type CareerCategory = typeof careerCategories.$inferSelect;
export type IncomeStream = typeof incomeStreams.$inferSelect;
export type Yoga = typeof yogas.$inferSelect;
export type Remedy = typeof remedies.$inferSelect;

export type ChatConversation = typeof chatConversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;

