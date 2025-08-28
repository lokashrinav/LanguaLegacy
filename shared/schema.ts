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
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
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
