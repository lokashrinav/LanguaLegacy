import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import {
  insertLanguageSchema,
  insertContributionSchema,
  insertLearningProgressSchema,
  insertLessonSchema,
  insertUserLessonCompletionSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Language routes
  app.get('/api/languages', async (req, res) => {
    try {
      const { search, region, threatLevel, limit = '50', offset = '0' } = req.query;
      
      const languages = await storage.getLanguages({
        search: search as string,
        region: region as string,
        threatLevel: threatLevel as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json(languages);
    } catch (error) {
      console.error("Error fetching languages:", error);
      res.status(500).json({ message: "Failed to fetch languages" });
    }
  });

  app.get('/api/languages/:id', async (req, res) => {
    try {
      const language = await storage.getLanguageById(req.params.id);
      if (!language) {
        return res.status(404).json({ message: "Language not found" });
      }
      res.json(language);
    } catch (error) {
      console.error("Error fetching language:", error);
      res.status(500).json({ message: "Failed to fetch language" });
    }
  });

  app.post('/api/languages', isAuthenticated, async (req, res) => {
    try {
      const languageData = insertLanguageSchema.parse(req.body);
      const language = await storage.createLanguage(languageData);
      res.json(language);
    } catch (error) {
      console.error("Error creating language:", error);
      res.status(500).json({ message: "Failed to create language" });
    }
  });

  app.delete('/api/languages/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteLanguage(req.params.id);
      res.json({ message: "Language deleted successfully" });
    } catch (error) {
      console.error("Error deleting language:", error);
      res.status(500).json({ message: "Failed to delete language" });
    }
  });

  // AI Interview routes
  app.post('/api/ai/interview', isAuthenticated, async (req, res) => {
    try {
      const { conductLanguageInterview } = await import('./anthropic');
      
      const result = await conductLanguageInterview(
        req.body.message,
        req.body.context
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error in AI interview:", error);
      res.status(500).json({ 
        message: "I'm having trouble processing that right now. Could you try rephrasing your question?",
        error: "AI service temporarily unavailable"
      });
    }
  });

  app.post('/api/ai/detect-language', isAuthenticated, async (req, res) => {
    try {
      const { detectLanguageInDatabase } = await import('./anthropic');
      
      const result = await detectLanguageInDatabase(
        req.body.languageName,
        req.body.existingLanguages
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error detecting language:", error);
      res.status(500).json({ message: "Failed to detect language" });
    }
  });

  // Database seeding routes
  app.post('/api/admin/seed-languages', isAuthenticated, async (req, res) => {
    try {
      const { languageSeeder } = await import('./dataSeeder');
      
      const { count = 50, regions = [], threatLevels = [] } = req.body;
      
      const results = await languageSeeder.seedDatabase({
        count,
        regions,
        threatLevels
      });
      
      res.json({
        message: "Database seeding completed",
        results
      });
    } catch (error) {
      console.error("Error seeding database:", error);
      res.status(500).json({ 
        message: "Failed to seed database",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get('/api/admin/database-summary', isAuthenticated, async (req, res) => {
    try {
      const { languageSeeder } = await import('./dataSeeder');
      
      const summary = await languageSeeder.getDataSummary();
      
      res.json(summary);
    } catch (error) {
      console.error("Error getting database summary:", error);
      res.status(500).json({ message: "Failed to get database summary" });
    }
  });

  // Contribution routes
  app.get('/api/contributions', async (req, res) => {
    try {
      const { userId, languageId, type, approved, limit = '50', offset = '0' } = req.query;
      
      const contributions = await storage.getContributions({
        userId: userId as string,
        languageId: languageId as string,
        type: type as string,
        approved: approved === 'true' ? true : approved === 'false' ? false : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json(contributions);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  app.get('/api/contributions/:id', async (req, res) => {
    try {
      const contribution = await storage.getContributionById(req.params.id);
      if (!contribution) {
        return res.status(404).json({ message: "Contribution not found" });
      }
      res.json(contribution);
    } catch (error) {
      console.error("Error fetching contribution:", error);
      res.status(500).json({ message: "Failed to fetch contribution" });
    }
  });

  app.post('/api/contributions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const contributionData = insertContributionSchema.parse({
        ...req.body,
        userId,
      });
      
      const contribution = await storage.createContribution(contributionData);
      res.json(contribution);
    } catch (error) {
      console.error("Error creating contribution:", error);
      res.status(500).json({ message: "Failed to create contribution" });
    }
  });

  app.put('/api/contributions/:id/approve', isAuthenticated, async (req, res) => {
    try {
      const { approved } = req.body;
      const contribution = await storage.updateContribution(req.params.id, { approved });
      res.json(contribution);
    } catch (error) {
      console.error("Error updating contribution:", error);
      res.status(500).json({ message: "Failed to update contribution" });
    }
  });

  // Learning progress routes
  app.get('/api/learning-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { languageId } = req.query;
      
      const progress = await storage.getUserLearningProgress(userId, languageId as string);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching learning progress:", error);
      res.status(500).json({ message: "Failed to fetch learning progress" });
    }
  });

  app.post('/api/learning-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const progressData = insertLearningProgressSchema.parse({
        ...req.body,
        userId,
      });
      
      const progress = await storage.createOrUpdateLearningProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating learning progress:", error);
      res.status(500).json({ message: "Failed to update learning progress" });
    }
  });

  app.post('/api/learning-progress/streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { languageId } = req.body;
      
      await storage.updateLearningStreak(userId, languageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating streak:", error);
      res.status(500).json({ message: "Failed to update streak" });
    }
  });

  // Lesson routes
  app.get('/api/lessons', async (req, res) => {
    try {
      const { languageId, level } = req.query;
      if (!languageId) {
        return res.status(400).json({ message: "languageId is required" });
      }
      
      const lessons = await storage.getLessons(languageId as string, level as string);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.get('/api/lessons/:id', async (req, res) => {
    try {
      const lesson = await storage.getLessonById(req.params.id);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });

  app.post('/api/lessons', isAuthenticated, async (req, res) => {
    try {
      const lessonData = insertLessonSchema.parse(req.body);
      const lesson = await storage.createLesson(lessonData);
      res.json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  // User lesson completion routes
  app.get('/api/lesson-completions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { languageId } = req.query;
      
      const completions = await storage.getUserLessonCompletions(userId, languageId as string);
      res.json(completions);
    } catch (error) {
      console.error("Error fetching lesson completions:", error);
      res.status(500).json({ message: "Failed to fetch lesson completions" });
    }
  });

  app.post('/api/lesson-completions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const completionData = insertUserLessonCompletionSchema.parse({
        ...req.body,
        userId,
      });
      
      const completion = await storage.markLessonComplete(completionData);
      
      // Update streak after completing lesson
      const lesson = await storage.getLessonById(completionData.lessonId);
      if (lesson) {
        await storage.updateLearningStreak(userId, lesson.languageId);
      }
      
      res.json(completion);
    } catch (error) {
      console.error("Error marking lesson complete:", error);
      res.status(500).json({ message: "Failed to mark lesson complete" });
    }
  });

  // User stats routes
  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get('/api/user/contributions/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserContributionStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching contribution stats:", error);
      res.status(500).json({ message: "Failed to fetch contribution stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
