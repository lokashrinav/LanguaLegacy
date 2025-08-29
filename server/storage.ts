import {
  users,
  languages,
  contributions,
  learningProgress,
  lessons,
  userLessonCompletion,
  studyGroups,
  groupMembers,
  groupTasks,
  taskProgress,
  learningGoals,
  taskadeProjects,
  aiInterviewUsage,
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
  type StudyGroup,
  type InsertStudyGroup,
  type GroupMember,
  type InsertGroupMember,
  type GroupTask,
  type InsertGroupTask,
  type TaskProgress,
  type InsertTaskProgress,
  type LearningGoal,
  type InsertLearningGoal,
  type TaskadeProject,
  type InsertTaskadeProject,
  type AiInterviewUsage,
  type InsertAiInterviewUsage,
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
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
  deleteLanguage(id: string): Promise<void>;

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

  // Study Group operations
  getStudyGroups(params?: {
    userId?: string;
    languageId?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<StudyGroup[]>;
  getStudyGroupById(id: string): Promise<StudyGroup | undefined>;
  createStudyGroup(group: InsertStudyGroup): Promise<StudyGroup>;
  updateStudyGroup(id: string, updates: Partial<StudyGroup>): Promise<StudyGroup>;
  deleteStudyGroup(id: string): Promise<void>;

  // Group Member operations
  getGroupMembers(groupId: string): Promise<GroupMember[]>;
  getUserGroups(userId: string): Promise<StudyGroup[]>;
  joinGroup(member: InsertGroupMember): Promise<GroupMember>;
  leaveGroup(groupId: string, userId: string): Promise<void>;
  updateMemberRole(groupId: string, userId: string, role: string): Promise<void>;

  // Group Task operations
  getGroupTasks(groupId: string, status?: string): Promise<GroupTask[]>;
  getTaskById(id: string): Promise<GroupTask | undefined>;
  createGroupTask(task: InsertGroupTask): Promise<GroupTask>;
  updateGroupTask(id: string, updates: Partial<GroupTask>): Promise<GroupTask>;
  deleteGroupTask(id: string): Promise<void>;

  // Task Progress operations
  getTaskProgress(taskId: string): Promise<TaskProgress[]>;
  getUserTaskProgress(userId: string, taskId: string): Promise<TaskProgress | undefined>;
  updateTaskProgress(progress: InsertTaskProgress): Promise<TaskProgress>;

  // Learning Goal operations
  getGroupGoals(groupId: string): Promise<LearningGoal[]>;
  createLearningGoal(goal: InsertLearningGoal): Promise<LearningGoal>;
  updateLearningGoal(id: string, updates: Partial<LearningGoal>): Promise<LearningGoal>;
  deleteLearningGoal(id: string): Promise<void>;
  
  // Taskade Project operations
  getTaskadeProject(languageId: string): Promise<TaskadeProject | undefined>;
  createTaskadeProject(project: InsertTaskadeProject): Promise<TaskadeProject>;
  
  // AI Interview Usage operations
  getAiInterviewUsage(userId: string): Promise<AiInterviewUsage | undefined>;
  incrementAiInterviewUsage(userId: string): Promise<AiInterviewUsage>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
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

    let query = db.select().from(languages);

    if (conditions.length > 0) {
      query = db.select().from(languages).where(and(...conditions));
    }

    const orderedQuery = query.orderBy(asc(languages.name));

    if (params?.limit && params?.offset) {
      return await orderedQuery.limit(params.limit).offset(params.offset);
    } else if (params?.limit) {
      return await orderedQuery.limit(params.limit);
    } else if (params?.offset) {
      return await orderedQuery.offset(params.offset);
    }

    return await orderedQuery;
  }

  async getLanguageById(id: string): Promise<Language | undefined> {
    const [language] = await db.select().from(languages).where(eq(languages.id, id));
    return language;
  }

  async createLanguage(language: InsertLanguage): Promise<Language> {
    const [created] = await db.insert(languages).values(language).returning();
    return created;
  }

  async deleteLanguage(id: string): Promise<void> {
    await db.delete(languages).where(eq(languages.id, id));
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

    let baseQuery = db.select().from(contributions);

    if (conditions.length > 0) {
      baseQuery = db.select().from(contributions).where(and(...conditions));
    }

    const orderedQuery = baseQuery.orderBy(desc(contributions.createdAt));

    if (params?.limit && params?.offset) {
      return await orderedQuery.limit(params.limit).offset(params.offset);
    } else if (params?.limit) {
      return await orderedQuery.limit(params.limit);
    } else if (params?.offset) {
      return await orderedQuery.offset(params.offset);
    }

    return await orderedQuery;
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
    if (languageId) {
      return await db
        .select()
        .from(learningProgress)
        .where(and(
          eq(learningProgress.userId, userId),
          eq(learningProgress.languageId, languageId)
        ));
    }

    return await db
      .select()
      .from(learningProgress)
      .where(eq(learningProgress.userId, userId));
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

  async incrementLessonsCompleted(userId: string, languageId: string): Promise<void> {
    const [progress] = await db
      .select()
      .from(learningProgress)
      .where(and(
        eq(learningProgress.userId, userId),
        eq(learningProgress.languageId, languageId)
      ));

    if (progress) {
      await db
        .update(learningProgress)
        .set({
          lessonsCompleted: (progress.lessonsCompleted || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(learningProgress.id, progress.id));
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

      let newStreak = progress.streakDays || 0;
      if (daysSinceLastActivity === 0) {
        // Same day - keep the streak (at least 1)
        newStreak = Math.max(1, newStreak);
      } else if (daysSinceLastActivity === 1) {
        // Next day - increment streak
        newStreak += 1;
      } else if (daysSinceLastActivity > 1) {
        // Streak broken - reset to 1
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
    if (level) {
      return await db
        .select()
        .from(lessons)
        .where(and(
          eq(lessons.languageId, languageId),
          eq(lessons.level, level)
        ))
        .orderBy(asc(lessons.order));
    }

    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.languageId, languageId))
      .orderBy(asc(lessons.order));
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
    if (languageId) {
      const results = await db
        .select()
        .from(userLessonCompletion)
        .innerJoin(lessons, eq(userLessonCompletion.lessonId, lessons.id))
        .where(and(
          eq(userLessonCompletion.userId, userId),
          eq(lessons.languageId, languageId)
        ));
      return results.map(r => r.user_lesson_completion);
    }

    const results = await db
      .select()
      .from(userLessonCompletion)
      .innerJoin(lessons, eq(userLessonCompletion.lessonId, lessons.id))
      .where(eq(userLessonCompletion.userId, userId));
    return results.map(r => r.user_lesson_completion);
  }

  async getRecentLessonCompletions(userId: string, limit: number = 5): Promise<any[]> {
    const results = await db
      .select({
        completion: userLessonCompletion,
        lesson: lessons,
        language: languages
      })
      .from(userLessonCompletion)
      .innerJoin(lessons, eq(userLessonCompletion.lessonId, lessons.id))
      .innerJoin(languages, eq(lessons.languageId, languages.id))
      .where(eq(userLessonCompletion.userId, userId))
      .orderBy(desc(userLessonCompletion.completedAt))
      .limit(limit);
    
    return results.map(r => ({
      id: r.completion.id,
      type: 'lesson',
      lessonTitle: r.lesson.title,
      languageName: r.language.name,
      level: r.lesson.level,
      completedAt: r.completion.completedAt,
      score: r.completion.score
    }));
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

    const currentStreak = Math.max(...progressData.map(p => p.streakDays || 0), 0);
    const languages = Array.from(new Set(progressData.map(p => p.languageId)));

    return {
      totalContributions: contributionStats.total,
      audioContributions: contributionStats.audioContributions,
      translations: contributionStats.translations,
      lessonsCompleted: completions.filter(c => c.completed).length,
      currentStreak,
      languages,
    };
  }

  // Study Group operations
  async getStudyGroups(params?: {
    userId?: string;
    languageId?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<StudyGroup[]> {
    const conditions = [];
    
    if (params?.languageId) {
      conditions.push(eq(studyGroups.languageId, params.languageId));
    }
    if (params?.isPublic !== undefined) {
      conditions.push(eq(studyGroups.isPublic, params.isPublic));
    }

    let query = db.select().from(studyGroups);
    
    if (params?.userId) {
      // Get groups the user is a member of
      const userGroupIds = await db
        .select({ groupId: groupMembers.groupId })
        .from(groupMembers)
        .where(eq(groupMembers.userId, params.userId));
      
      if (userGroupIds.length > 0) {
        const groupIds = userGroupIds.map(g => g.groupId);
        conditions.push(eq(studyGroups.id, groupIds[0])); // Simplified for now
      }
    }

    if (conditions.length > 0) {
      query = db.select().from(studyGroups).where(and(...conditions));
    }

    const orderedQuery = query.orderBy(desc(studyGroups.createdAt));

    if (params?.limit && params?.offset) {
      return await orderedQuery.limit(params.limit).offset(params.offset);
    } else if (params?.limit) {
      return await orderedQuery.limit(params.limit);
    } else if (params?.offset) {
      return await orderedQuery.offset(params.offset);
    }

    return await orderedQuery;
  }

  async getStudyGroupById(id: string): Promise<StudyGroup | undefined> {
    const [group] = await db.select().from(studyGroups).where(eq(studyGroups.id, id));
    return group;
  }

  async createStudyGroup(group: InsertStudyGroup): Promise<StudyGroup> {
    const [created] = await db.insert(studyGroups).values(group).returning();
    
    // Add creator as first member with 'creator' role
    await db.insert(groupMembers).values({
      groupId: created.id,
      userId: created.creatorId,
      role: 'creator'
    });
    
    return created;
  }

  async updateStudyGroup(id: string, updates: Partial<StudyGroup>): Promise<StudyGroup> {
    const [updated] = await db
      .update(studyGroups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(studyGroups.id, id))
      .returning();
    return updated;
  }

  async deleteStudyGroup(id: string): Promise<void> {
    await db.delete(studyGroups).where(eq(studyGroups.id, id));
  }

  // Group Member operations
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId))
      .orderBy(asc(groupMembers.joinedAt));
  }

  async getUserGroups(userId: string): Promise<StudyGroup[]> {
    const memberGroups = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));
    
    if (memberGroups.length === 0) return [];
    
    const groupIds = memberGroups.map(m => m.groupId);
    return await db
      .select()
      .from(studyGroups)
      .where(eq(studyGroups.id, groupIds[0])); // Simplified query
  }

  async joinGroup(member: InsertGroupMember): Promise<GroupMember> {
    const [joined] = await db.insert(groupMembers).values(member).returning();
    return joined;
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    await db
      .delete(groupMembers)
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      ));
  }

  async updateMemberRole(groupId: string, userId: string, role: string): Promise<void> {
    await db
      .update(groupMembers)
      .set({ role })
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      ));
  }

  // Group Task operations
  async getGroupTasks(groupId: string, status?: string): Promise<GroupTask[]> {
    if (status) {
      return await db
        .select()
        .from(groupTasks)
        .where(and(
          eq(groupTasks.groupId, groupId),
          eq(groupTasks.status, status)
        ))
        .orderBy(asc(groupTasks.dueDate));
    }
    
    return await db
      .select()
      .from(groupTasks)
      .where(eq(groupTasks.groupId, groupId))
      .orderBy(asc(groupTasks.dueDate));
  }

  async getTaskById(id: string): Promise<GroupTask | undefined> {
    const [task] = await db.select().from(groupTasks).where(eq(groupTasks.id, id));
    return task;
  }

  async createGroupTask(task: InsertGroupTask): Promise<GroupTask> {
    const [created] = await db.insert(groupTasks).values(task).returning();
    return created;
  }

  async updateGroupTask(id: string, updates: Partial<GroupTask>): Promise<GroupTask> {
    const [updated] = await db
      .update(groupTasks)
      .set(updates)
      .where(eq(groupTasks.id, id))
      .returning();
    return updated;
  }

  async deleteGroupTask(id: string): Promise<void> {
    await db.delete(groupTasks).where(eq(groupTasks.id, id));
  }

  // Task Progress operations
  async getTaskProgress(taskId: string): Promise<TaskProgress[]> {
    return await db
      .select()
      .from(taskProgress)
      .where(eq(taskProgress.taskId, taskId));
  }

  async getUserTaskProgress(userId: string, taskId: string): Promise<TaskProgress | undefined> {
    const [progress] = await db
      .select()
      .from(taskProgress)
      .where(and(
        eq(taskProgress.userId, userId),
        eq(taskProgress.taskId, taskId)
      ));
    return progress;
  }

  async updateTaskProgress(progress: InsertTaskProgress): Promise<TaskProgress> {
    const existing = await this.getUserTaskProgress(progress.userId, progress.taskId);
    
    if (existing) {
      const [updated] = await db
        .update(taskProgress)
        .set({ ...progress, updatedAt: new Date() })
        .where(eq(taskProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(taskProgress).values(progress).returning();
      return created;
    }
  }

  // Learning Goal operations
  async getGroupGoals(groupId: string): Promise<LearningGoal[]> {
    return await db
      .select()
      .from(learningGoals)
      .where(eq(learningGoals.groupId, groupId))
      .orderBy(desc(learningGoals.createdAt));
  }

  async createLearningGoal(goal: InsertLearningGoal): Promise<LearningGoal> {
    const [created] = await db.insert(learningGoals).values(goal).returning();
    return created;
  }

  async updateLearningGoal(id: string, updates: Partial<LearningGoal>): Promise<LearningGoal> {
    const [updated] = await db
      .update(learningGoals)
      .set(updates)
      .where(eq(learningGoals.id, id))
      .returning();
    return updated;
  }

  async deleteLearningGoal(id: string): Promise<void> {
    await db.delete(learningGoals).where(eq(learningGoals.id, id));
  }

  // Taskade Project operations
  async getTaskadeProject(languageId: string): Promise<TaskadeProject | undefined> {
    const [project] = await db
      .select()
      .from(taskadeProjects)
      .where(eq(taskadeProjects.languageId, languageId));
    return project;
  }

  async createTaskadeProject(project: InsertTaskadeProject): Promise<TaskadeProject> {
    const [created] = await db.insert(taskadeProjects).values(project).returning();
    return created;
  }

  // AI Interview Usage operations
  async getAiInterviewUsage(userId: string): Promise<AiInterviewUsage | undefined> {
    const [usage] = await db
      .select()
      .from(aiInterviewUsage)
      .where(eq(aiInterviewUsage.userId, userId));
    return usage;
  }

  async incrementAiInterviewUsage(userId: string): Promise<AiInterviewUsage> {
    const existing = await this.getAiInterviewUsage(userId);
    
    if (existing) {
      const [updated] = await db
        .update(aiInterviewUsage)
        .set({ 
          usageCount: existing.usageCount + 1,
          lastUsedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(aiInterviewUsage.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(aiInterviewUsage)
        .values({
          userId,
          usageCount: 1,
          lastUsedAt: new Date()
        })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
