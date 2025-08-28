import {
  users,
  languages,
  contributions,
  learningProgress,
  lessons,
  userLessonCompletion,
  type User,
  type UpsertUser,
  type Language,
  type InsertLanguage,
  type Contribution,
  type InsertContribution,
  type LearningProgress,
  type InsertLearningProgress,
  type Lesson,
  type InsertLesson,
  type UserLessonCompletion,
  type InsertUserLessonCompletion,
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Language operations
  getLanguages(params?: {
    search?: string;
    region?: string;
    threatLevel?: string;
    limit?: number;
    offset?: number;
  }): Promise<Language[]>;
  getLanguageById(id: string): Promise<Language | undefined>;
  createLanguage(language: InsertLanguage): Promise<Language>;

  // Contribution operations
  getContributions(params?: {
    userId?: string;
    languageId?: string;
    type?: string;
    approved?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Contribution[]>;
  getContributionById(id: string): Promise<Contribution | undefined>;
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  updateContribution(id: string, updates: Partial<Contribution>): Promise<Contribution>;
  getUserContributionStats(userId: string): Promise<{
    total: number;
    audioContributions: number;
    translations: number;
    approved: number;
  }>;

  // Learning progress operations
  getUserLearningProgress(userId: string, languageId?: string): Promise<LearningProgress[]>;
  createOrUpdateLearningProgress(progress: InsertLearningProgress): Promise<LearningProgress>;
  updateLearningStreak(userId: string, languageId: string): Promise<void>;

  // Lesson operations
  getLessons(languageId: string, level?: string): Promise<Lesson[]>;
  getLessonById(id: string): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;

  // User lesson completion operations
  getUserLessonCompletions(userId: string, languageId?: string): Promise<UserLessonCompletion[]>;
  markLessonComplete(completion: InsertUserLessonCompletion): Promise<UserLessonCompletion>;
  getUserStats(userId: string): Promise<{
    totalContributions: number;
    audioContributions: number;
    translations: number;
    lessonsCompleted: number;
    currentStreak: number;
    languages: string[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Language operations
  async getLanguages(params?: {
    search?: string;
    region?: string;
    threatLevel?: string;
    limit?: number;
    offset?: number;
  }): Promise<Language[]> {
    let query = db.select().from(languages);

    const conditions = [];
    if (params?.search) {
      conditions.push(ilike(languages.name, `%${params.search}%`));
    }
    if (params?.region) {
      conditions.push(eq(languages.region, params.region));
    }
    if (params?.threatLevel) {
      conditions.push(eq(languages.threatLevel, params.threatLevel));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(asc(languages.name));

    if (params?.limit) {
      query = query.limit(params.limit);
    }
    if (params?.offset) {
      query = query.offset(params.offset);
    }

    return await query;
  }

  async getLanguageById(id: string): Promise<Language | undefined> {
    const [language] = await db.select().from(languages).where(eq(languages.id, id));
    return language;
  }

  async createLanguage(language: InsertLanguage): Promise<Language> {
    const [created] = await db.insert(languages).values(language).returning();
    return created;
  }

  // Contribution operations
  async getContributions(params?: {
    userId?: string;
    languageId?: string;
    type?: string;
    approved?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Contribution[]> {
    let query = db.select().from(contributions);

    const conditions = [];
    if (params?.userId) {
      conditions.push(eq(contributions.userId, params.userId));
    }
    if (params?.languageId) {
      conditions.push(eq(contributions.languageId, params.languageId));
    }
    if (params?.type) {
      conditions.push(eq(contributions.type, params.type));
    }
    if (params?.approved !== undefined) {
      conditions.push(eq(contributions.approved, params.approved));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(contributions.createdAt));

    if (params?.limit) {
      query = query.limit(params.limit);
    }
    if (params?.offset) {
      query = query.offset(params.offset);
    }

    return await query;
  }

  async getContributionById(id: string): Promise<Contribution | undefined> {
    const [contribution] = await db.select().from(contributions).where(eq(contributions.id, id));
    return contribution;
  }

  async createContribution(contribution: InsertContribution): Promise<Contribution> {
    const [created] = await db.insert(contributions).values(contribution).returning();
    return created;
  }

  async updateContribution(id: string, updates: Partial<Contribution>): Promise<Contribution> {
    const [updated] = await db
      .update(contributions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contributions.id, id))
      .returning();
    return updated;
  }

  async getUserContributionStats(userId: string): Promise<{
    total: number;
    audioContributions: number;
    translations: number;
    approved: number;
  }> {
    const userContributions = await this.getContributions({ userId });
    
    return {
      total: userContributions.length,
      audioContributions: userContributions.filter(c => c.type === 'audio').length,
      translations: userContributions.filter(c => c.translation).length,
      approved: userContributions.filter(c => c.approved).length,
    };
  }

  // Learning progress operations
  async getUserLearningProgress(userId: string, languageId?: string): Promise<LearningProgress[]> {
    let query = db.select().from(learningProgress).where(eq(learningProgress.userId, userId));

    if (languageId) {
      query = query.where(and(
        eq(learningProgress.userId, userId),
        eq(learningProgress.languageId, languageId)
      ));
    }

    return await query;
  }

  async createOrUpdateLearningProgress(progress: InsertLearningProgress): Promise<LearningProgress> {
    const [existing] = await db
      .select()
      .from(learningProgress)
      .where(and(
        eq(learningProgress.userId, progress.userId),
        eq(learningProgress.languageId, progress.languageId)
      ));

    if (existing) {
      const [updated] = await db
        .update(learningProgress)
        .set({ ...progress, updatedAt: new Date() })
        .where(eq(learningProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(learningProgress).values(progress).returning();
      return created;
    }
  }

  async updateLearningStreak(userId: string, languageId: string): Promise<void> {
    const [progress] = await db
      .select()
      .from(learningProgress)
      .where(and(
        eq(learningProgress.userId, userId),
        eq(learningProgress.languageId, languageId)
      ));

    if (progress) {
      const now = new Date();
      const lastActivity = new Date(progress.lastActivityAt!);
      const daysSinceLastActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      let newStreak = progress.streakDays;
      if (daysSinceLastActivity === 1) {
        newStreak += 1;
      } else if (daysSinceLastActivity > 1) {
        newStreak = 1;
      }

      await db
        .update(learningProgress)
        .set({
          streakDays: newStreak,
          lastActivityAt: now,
          updatedAt: now,
        })
        .where(eq(learningProgress.id, progress.id));
    }
  }

  // Lesson operations
  async getLessons(languageId: string, level?: string): Promise<Lesson[]> {
    let query = db.select().from(lessons).where(eq(lessons.languageId, languageId));

    if (level) {
      query = query.where(and(
        eq(lessons.languageId, languageId),
        eq(lessons.level, level)
      ));
    }

    return await query.orderBy(asc(lessons.order));
  }

  async getLessonById(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [created] = await db.insert(lessons).values(lesson).returning();
    return created;
  }

  // User lesson completion operations
  async getUserLessonCompletions(userId: string, languageId?: string): Promise<UserLessonCompletion[]> {
    let query = db
      .select()
      .from(userLessonCompletion)
      .innerJoin(lessons, eq(userLessonCompletion.lessonId, lessons.id))
      .where(eq(userLessonCompletion.userId, userId));

    if (languageId) {
      query = query.where(and(
        eq(userLessonCompletion.userId, userId),
        eq(lessons.languageId, languageId)
      ));
    }

    const results = await query;
    return results.map(r => r.user_lesson_completion);
  }

  async markLessonComplete(completion: InsertUserLessonCompletion): Promise<UserLessonCompletion> {
    const [created] = await db
      .insert(userLessonCompletion)
      .values({
        ...completion,
        completed: true,
        completedAt: new Date(),
      })
      .returning();
    return created;
  }

  async getUserStats(userId: string): Promise<{
    totalContributions: number;
    audioContributions: number;
    translations: number;
    lessonsCompleted: number;
    currentStreak: number;
    languages: string[];
  }> {
    const [contributionStats, completions, progressData] = await Promise.all([
      this.getUserContributionStats(userId),
      this.getUserLessonCompletions(userId),
      this.getUserLearningProgress(userId),
    ]);

    const currentStreak = Math.max(...progressData.map(p => p.streakDays), 0);
    const languages = [...new Set(progressData.map(p => p.languageId))];

    return {
      totalContributions: contributionStats.total,
      audioContributions: contributionStats.audioContributions,
      translations: contributionStats.translations,
      lessonsCompleted: completions.filter(c => c.completed).length,
      currentStreak,
      languages,
    };
  }
}

export const storage = new DatabaseStorage();
