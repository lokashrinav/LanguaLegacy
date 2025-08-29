import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique(),
  email: varchar("email").unique(),
  password: varchar("password"), // hashed password for traditional auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  authProvider: varchar("auth_provider").default("local"), // local, google
  googleId: varchar("google_id"), // for Google OAuth
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Languages table
export const languages = pgTable("languages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  nativeName: varchar("native_name"),
  isoCode: varchar("iso_code"),
  region: varchar("region").notNull(),
  country: varchar("country"),
  speakers: integer("speakers").default(0),
  threatLevel: varchar("threat_level").notNull(), // vulnerable, endangered, critically_endangered, extinct
  family: varchar("family"),
  description: text("description"),
  
  // Extended linguistic information
  writingSystems: text("writing_systems").array(), // Latin, Cyrillic, Arabic, etc.
  phoneticInventory: jsonb("phonetic_inventory"), // IPA consonants, vowels, tones
  dialects: jsonb("dialects"), // Array of dialect objects with regions
  grammarFeatures: jsonb("grammar_features"), // Word order, case system, etc.
  
  // Geographic and demographic data
  coordinates: jsonb("coordinates"), // Lat/lng of primary regions
  historicalRegions: text("historical_regions").array(),
  speakerAgeGroups: jsonb("speaker_age_groups"), // Demographics by age
  fluencyLevels: jsonb("fluency_levels"), // Native, fluent, learning, etc.
  
  // Cultural and historical context
  culturalSignificance: text("cultural_significance"),
  historicalContext: text("historical_context"),
  ritualUses: text("ritual_uses").array(), // Ceremonial, religious, etc.
  oralTraditions: text("oral_traditions").array(),
  
  // Documentation and preservation status
  documentationStatus: varchar("documentation_status"), // well_documented, partially_documented, underdocumented
  lastSpeakerKnown: boolean("last_speaker_known").default(false),
  revitalizationEfforts: text("revitalization_efforts"),
  educationalPrograms: text("educational_programs").array(),
  
  // Academic and research information
  linguisticClassification: jsonb("linguistic_classification"), // Detailed family tree
  researchReferences: text("research_references").array(),
  academicContacts: jsonb("academic_contacts"), // Researchers, institutions
  
  // Digital resources
  audioArchiveUrl: varchar("audio_archive_url"),
  videoArchiveUrl: varchar("video_archive_url"),
  dictionaryUrl: varchar("dictionary_url"),
  grammarUrl: varchar("grammar_url"),
  
  // Community information
  communityContacts: jsonb("community_contacts"), // Elders, cultural leaders
  communityWebsite: varchar("community_website"),
  socialMediaPresence: jsonb("social_media_presence"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contributions table
export const contributions = pgTable("contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  languageId: varchar("language_id").notNull().references(() => languages.id),
  type: varchar("type").notNull(), // audio, text, cultural_context, grammar, visual
  originalText: text("original_text"),
  phoneticTranscription: text("phonetic_transcription"),
  translation: text("translation"),
  usageContext: text("usage_context"),
  culturalSignificance: text("cultural_significance"),
  grammarPattern: text("grammar_pattern"),
  grammarExplanation: text("grammar_explanation"),
  difficultyLevel: varchar("difficulty_level"), // beginner, intermediate, advanced, expert
  category: varchar("category"), // daily_conversation, ceremonial, storytelling, educational, songs
  audioUrl: varchar("audio_url"),
  imageUrl: varchar("image_url"),
  approved: boolean("approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Learning progress table
export const learningProgress = pgTable("learning_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  languageId: varchar("language_id").notNull().references(() => languages.id),
  currentLevel: varchar("current_level").default("beginner"), // beginner, intermediate, advanced
  lessonsCompleted: integer("lessons_completed").default(0),
  totalLessons: integer("total_lessons").default(10),
  streakDays: integer("streak_days").default(0),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lessons table
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  languageId: varchar("language_id").notNull().references(() => languages.id),
  title: varchar("title").notNull(),
  description: text("description"),
  level: varchar("level").notNull(), // beginner, intermediate, advanced
  order: integer("order").notNull(),
  content: jsonb("content").notNull(), // JSON structure with lesson content
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User lesson completion table
export const userLessonCompletion = pgTable("user_lesson_completion", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id),
  completed: boolean("completed").default(false),
  score: integer("score"), // percentage score
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  contributions: many(contributions),
  learningProgress: many(learningProgress),
  lessonCompletions: many(userLessonCompletion),
}));

export const languagesRelations = relations(languages, ({ many }) => ({
  contributions: many(contributions),
  learningProgress: many(learningProgress),
  lessons: many(lessons),
}));

export const contributionsRelations = relations(contributions, ({ one }) => ({
  user: one(users, {
    fields: [contributions.userId],
    references: [users.id],
  }),
  language: one(languages, {
    fields: [contributions.languageId],
    references: [languages.id],
  }),
}));

export const learningProgressRelations = relations(learningProgress, ({ one }) => ({
  user: one(users, {
    fields: [learningProgress.userId],
    references: [users.id],
  }),
  language: one(languages, {
    fields: [learningProgress.languageId],
    references: [languages.id],
  }),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  language: one(languages, {
    fields: [lessons.languageId],
    references: [languages.id],
  }),
  completions: many(userLessonCompletion),
}));

export const userLessonCompletionRelations = relations(userLessonCompletion, ({ one }) => ({
  user: one(users, {
    fields: [userLessonCompletion.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [userLessonCompletion.lessonId],
    references: [lessons.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserLocalSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
}).omit({
  authProvider: true,
  googleId: true,
});

export const insertLanguageSchema = createInsertSchema(languages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContributionSchema = createInsertSchema(contributions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approved: true,
});

export const insertLearningProgressSchema = createInsertSchema(learningProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserLessonCompletionSchema = createInsertSchema(userLessonCompletion).omit({
  id: true,
  createdAt: true,
});

// Taskade Integration table
export const taskadeProjects = pgTable("taskade_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  languageId: varchar("language_id").notNull().references(() => languages.id, { onDelete: "cascade" }),
  taskadeProjectId: varchar("taskade_project_id").notNull(),
  taskadeProjectUrl: varchar("taskade_project_url").notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Study Groups for collaborative learning
export const studyGroups = pgTable("study_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  languageId: varchar("language_id").notNull().references(() => languages.id, { onDelete: "cascade" }),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  maxMembers: integer("max_members").default(10),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Group Members
export const groupMembers = pgTable("group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => studyGroups.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).notNull().default("member"), // creator, moderator, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Group Tasks for collaborative study sessions
export const groupTasks = pgTable("group_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => studyGroups.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  taskType: varchar("task_type", { length: 50 }).notNull(), // lesson, practice, contribution, review
  targetLessonId: varchar("target_lesson_id").references(() => lessons.id, { onDelete: "set null" }),
  dueDate: timestamp("due_date"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, in_progress, completed
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Task Progress for individual members
export const taskProgress = pgTable("task_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => groupTasks.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull().default("not_started"), // not_started, in_progress, completed
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Learning Goals for groups
export const learningGoals = pgTable("learning_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => studyGroups.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetDate: timestamp("target_date"),
  metric: varchar("metric", { length: 100 }), // lessons_completed, hours_studied, contributions_made
  targetValue: integer("target_value"),
  currentValue: integer("current_value").default(0),
  status: varchar("status", { length: 50 }).notNull().default("active"), // active, achieved, abandoned
  createdAt: timestamp("created_at").defaultNow(),
  achievedAt: timestamp("achieved_at"),
});

// Insert schemas for collaborative features
export const insertStudyGroupSchema = createInsertSchema(studyGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertGroupTaskSchema = createInsertSchema(groupTasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTaskProgressSchema = createInsertSchema(taskProgress).omit({
  id: true,
  updatedAt: true,
  completedAt: true,
});

export const insertLearningGoalSchema = createInsertSchema(learningGoals).omit({
  id: true,
  createdAt: true,
  achievedAt: true,
  currentValue: true,
});

export const insertTaskadeProjectSchema = createInsertSchema(taskadeProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Language = typeof languages.$inferSelect;
export type InsertLanguage = z.infer<typeof insertLanguageSchema>;
export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = z.infer<typeof insertContributionSchema>;
export type LearningProgress = typeof learningProgress.$inferSelect;
export type InsertLearningProgress = z.infer<typeof insertLearningProgressSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type UserLessonCompletion = typeof userLessonCompletion.$inferSelect;
export type InsertUserLessonCompletion = z.infer<typeof insertUserLessonCompletionSchema>;
export type StudyGroup = typeof studyGroups.$inferSelect;
export type InsertStudyGroup = z.infer<typeof insertStudyGroupSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupTask = typeof groupTasks.$inferSelect;
export type InsertGroupTask = z.infer<typeof insertGroupTaskSchema>;
export type TaskProgress = typeof taskProgress.$inferSelect;
export type InsertTaskProgress = z.infer<typeof insertTaskProgressSchema>;
export type LearningGoal = typeof learningGoals.$inferSelect;
export type InsertLearningGoal = z.infer<typeof insertLearningGoalSchema>;
export type TaskadeProject = typeof taskadeProjects.$inferSelect;
export type InsertTaskadeProject = z.infer<typeof insertTaskadeProjectSchema>;
