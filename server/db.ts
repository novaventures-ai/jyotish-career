import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser, users,
  birthProfiles, InsertBirthProfile, BirthProfile,
  occupations, Occupation,
  incomeStreams, IncomeStream,
  careerCategories, CareerCategory,
  userCareerRecommendations,
  yogas, Yoga,
  remedies, Remedy,
  chatConversations, chatMessages, ChatConversation, ChatMessage
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: postgres.Sql | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Production connection (pooling)
        _client = postgres(process.env.DATABASE_URL, { prepare: false });
      } else {
        // Development connection
        _client = postgres(process.env.DATABASE_URL);
      }
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// USER QUERIES
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    console.log('[Database] Upserting user...');
    console.log('[Database]   - OpenID:', user.openId);
    console.log('[Database]   - Name:', user.name);
    console.log('[Database]   - Email:', user.email);

    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    const ADMIN_EMAILS = [
      'rahul.govalkar.1807@gmail.com',
      'novaventures.contact@gmail.com'
    ];

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (
      (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim())) ||
      (user.openId === ENV.ownerOpenId)
    ) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    console.log('[Database] Executing upsert with values:', JSON.stringify(values, null, 2));
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
    console.log('[Database] ✅ User upsert complete');
  } catch (error) {
    console.error("[Database] ❌ Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// BIRTH PROFILE QUERIES
// ============================================

export async function createBirthProfile(profile: InsertBirthProfile): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // If this is set as primary, unset other primaries for this user
  if (profile.isPrimary) {
    await db.update(birthProfiles)
      .set({ isPrimary: false })
      .where(eq(birthProfiles.userId, profile.userId));
  }

  const result = await db.insert(birthProfiles).values(profile).returning({ id: birthProfiles.id });
  return result[0].id;
}

export async function getBirthProfilesByUser(userId: number): Promise<BirthProfile[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(birthProfiles)
    .where(eq(birthProfiles.userId, userId))
    .orderBy(desc(birthProfiles.isPrimary), desc(birthProfiles.createdAt));
}

export async function getBirthProfileById(profileId: number, userId: number): Promise<BirthProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(birthProfiles)
    .where(and(
      eq(birthProfiles.id, profileId),
      eq(birthProfiles.userId, userId)
    ))
    .limit(1);

  return result[0];
}

export async function updateBirthProfile(
  profileId: number,
  userId: number,
  data: Partial<InsertBirthProfile>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(birthProfiles)
    .set({ ...data, updatedAt: new Date() })
    .where(and(
      eq(birthProfiles.id, profileId),
      eq(birthProfiles.userId, userId)
    ));
}

export async function setPrimaryProfile(profileId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Unset all primaries for user
  await db.update(birthProfiles)
    .set({ isPrimary: false })
    .where(eq(birthProfiles.userId, userId));

  // Set this one as primary
  await db.update(birthProfiles)
    .set({ isPrimary: true })
    .where(and(
      eq(birthProfiles.id, profileId),
      eq(birthProfiles.userId, userId)
    ));
}

export async function deleteBirthProfile(profileId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(birthProfiles)
    .where(and(
      eq(birthProfiles.id, profileId),
      eq(birthProfiles.userId, userId)
    ));
}

// ============================================
// CAREER & OCCUPATION QUERIES
// ============================================

export async function getCareerCategories(): Promise<CareerCategory[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(careerCategories);
}

export async function getOccupations(categoryId?: number): Promise<Occupation[]> {
  const db = await getDb();
  if (!db) return [];

  if (categoryId) {
    return db.select()
      .from(occupations)
      .where(eq(occupations.categoryId, categoryId));
  }

  return db.select().from(occupations);
}

export async function getOccupationById(id: number): Promise<Occupation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(occupations)
    .where(eq(occupations.id, id))
    .limit(1);

  return result[0];
}

// ============================================
// INCOME STREAM QUERIES
// ============================================

export async function getIncomeStreams(category?: string): Promise<IncomeStream[]> {
  const db = await getDb();
  if (!db) return [];

  if (category) {
    return db.select()
      .from(incomeStreams)
      .where(eq(incomeStreams.category, category as "active" | "passive" | "hybrid"));
  }

  return db.select().from(incomeStreams);
}

export async function getIncomeStreamById(id: number): Promise<IncomeStream | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(incomeStreams)
    .where(eq(incomeStreams.id, id))
    .limit(1);

  return result[0];
}

// ============================================
// YOGA QUERIES
// ============================================

export async function getYogas(category?: string): Promise<Yoga[]> {
  const db = await getDb();
  if (!db) return [];

  if (category) {
    return db.select()
      .from(yogas)
      .where(eq(yogas.category, category as "wealth" | "career" | "raja" | "spiritual" | "other"));
  }

  return db.select().from(yogas);
}

// ============================================
// REMEDY QUERIES
// ============================================

export async function getRemedies(targetType?: string, targetValue?: string): Promise<Remedy[]> {
  const db = await getDb();
  if (!db) return [];

  if (targetType && targetValue) {
    return db.select()
      .from(remedies)
      .where(and(
        eq(remedies.targetType, targetType as "planet" | "house" | "yoga"),
        eq(remedies.targetValue, targetValue)
      ));
  }

  return db.select().from(remedies);
}

// ============================================
// USER RECOMMENDATIONS QUERIES
// ============================================

export async function saveUserRecommendation(
  userId: number,
  profileId: number,
  occupationId: number | null,
  incomeStreamId: number | null,
  matchScore: number,
  matchReasons: string[]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(userCareerRecommendations).values({
    userId,
    profileId,
    occupationId,
    incomeStreamId,
    score: Math.round(matchScore),
    matchReasons: matchReasons,
  });
}

export async function getUserSavedRecommendations(userId: number, profileId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(userCareerRecommendations)
    .where(and(
      eq(userCareerRecommendations.userId, userId),
      eq(userCareerRecommendations.profileId, profileId),
      eq(userCareerRecommendations.isSaved, true)
    ))
    .orderBy(desc(userCareerRecommendations.score));
}

export async function toggleSaveRecommendation(
  recommendationId: number,
  userId: number,
  saved: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(userCareerRecommendations)
    .set({ isSaved: saved, updatedAt: new Date() })
    .where(and(
      eq(userCareerRecommendations.id, recommendationId),
      eq(userCareerRecommendations.userId, userId)
    ));
}

// ============================================
// CHAT QUERIES
// ============================================

export async function createConversation(userId: number, title: string, profileId?: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatConversations).values({
    userId,
    title,
    profileId: profileId || null
  }).returning({ id: chatConversations.id });
  return result[0].id;
}

export async function getConversationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(chatConversations)
    .where(eq(chatConversations.userId, userId))
    .orderBy(desc(chatConversations.updatedAt));
}

export async function getConversationById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select()
    .from(chatConversations)
    .where(and(eq(chatConversations.id, id), eq(chatConversations.userId, userId)))
    .limit(1);
  return result[0];
}

export async function updateConversation(id: number, userId: number, data: { title?: string, updatedAt?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chatConversations)
    .set({ ...data, updatedAt: data.updatedAt || new Date() })
    .where(and(eq(chatConversations.id, id), eq(chatConversations.userId, userId)));
}

export async function deleteConversation(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(chatConversations)
    .where(and(eq(chatConversations.id, id), eq(chatConversations.userId, userId)));
}

export async function addMessage(conversationId: number, role: 'user' | 'assistant', content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chatMessages).values({
    conversationId,
    role,
    content
  });
  // Update conversation timestamp
  await db.update(chatConversations)
    .set({ updatedAt: new Date() })
    .where(eq(chatConversations.id, conversationId));
}

export async function getMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt);
}
