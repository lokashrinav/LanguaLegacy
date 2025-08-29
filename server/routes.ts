import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { createLanguagePreservationProject } from "./taskade";
import {
  insertLanguageSchema,
  insertContributionSchema,
  insertLearningProgressSchema,
  insertLessonSchema,
  insertUserLessonCompletionSchema,
  insertStudyGroupSchema,
  insertGroupMemberSchema,
  insertGroupTaskSchema,
  insertTaskProgressSchema,
  insertLearningGoalSchema,
  insertTaskadeProjectSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Admin authorization middleware
  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.user || req.user.email !== 'lokashrinav@gmail.com') {
      return res.status(403).json({ message: "Unauthorized: Admin access only" });
    }
    next();
  };

  // Language routes
  app.get('/api/languages', async (req, res) => {
    try {
      const { search, region, threatLevel, limit = '50', offset = '0' } = req.query;
      
      const languages = await storage.getLanguages({
        search: search as string,
        region: region === 'all' ? '' : region as string,
        threatLevel: threatLevel === 'all' ? '' : threatLevel as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json(languages);
    } catch (error) {
      console.error("Error fetching languages:", error);
      res.status(500).json({ message: "Failed to fetch languages" });
    }
  });

  // Get all languages with their workspace data
  app.get('/api/languages/with-workspaces', async (req, res) => {
    try {
      const languages = await storage.getLanguages();
      
      // Fetch taskade projects for all languages
      const languagesWithWorkspaces = await Promise.all(
        languages.map(async (language) => {
          const taskadeProject = await storage.getTaskadeProject(language.id);
          return {
            ...language,
            taskadeProject: taskadeProject || null
          };
        })
      );
      
      res.json(languagesWithWorkspaces);
    } catch (error) {
      console.error("Error fetching languages with workspaces:", error);
      res.status(500).json({ message: "Failed to fetch languages with workspaces" });
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

  app.post('/api/languages', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const languageData = insertLanguageSchema.parse(req.body);
      const language = await storage.createLanguage(languageData);
      
      // Automatically create AI-generated course for this language
      try {
        const { LanguageDataSeeder } = await import('./dataSeeder');
        const seeder = new LanguageDataSeeder();
        await seeder.createAIGeneratedCourse(language.id, language);
        console.log(`Auto-created AI course for manually added language: ${language.name}`);
      } catch (courseError) {
        console.error(`Failed to create course for ${language.name}:`, courseError);
        // Don't fail the language creation if course generation fails
      }
      
      res.json(language);
    } catch (error) {
      console.error("Error creating language:", error);
      res.status(500).json({ message: "Failed to create language" });
    }
  });

  app.delete('/api/languages/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteLanguage(req.params.id);
      res.json({ message: "Language deleted successfully" });
    } catch (error) {
      console.error("Error deleting language:", error);
      res.status(500).json({ message: "Failed to delete language" });
    }
  });

  // AI Interview routes
  app.post('/api/ai/interview', isAuthenticated, async (req: any, res) => {
    try {
      const { conductLanguageInterview } = await import('./anthropic');
      
      const result = await conductLanguageInterview(
        req.body.message,
        req.body.context
      );
      
      // Auto-save interview data to database for hackathon demo
      if (req.body.context?.languageContext?.id && req.body.message) {
        try {
          const userId = req.user.id;
          const languageId = req.body.context.languageContext.id;
          
          // Parse the user's message to extract linguistic information
          const userMessage = req.body.message.toLowerCase();
          
          // Create different types of contributions based on content
          if (userMessage.includes('case') || userMessage.includes('nominative') || userMessage.includes('genitive')) {
            // Grammar contribution
            await storage.createContribution({
              userId,
              languageId,
              type: 'grammar',
              originalText: req.body.message,
              grammarPattern: extractGrammarPattern(req.body.message),
              grammarExplanation: req.body.message,
              approved: true, // Auto-approve for hackathon
              category: 'educational',
              difficultyLevel: 'intermediate'
            });
          } else if (userMessage.includes('writing') || userMessage.includes('orthograph') || userMessage.includes('alphabet')) {
            // Writing system contribution
            await storage.createContribution({
              userId,
              languageId,
              type: 'text',
              originalText: extractExamples(req.body.message),
              translation: 'Writing system documentation',
              usageContext: req.body.message,
              approved: true,
              category: 'educational',
              difficultyLevel: 'beginner'
            });
          } else if (userMessage.includes('consonant') || userMessage.includes('vowel') || userMessage.includes('phonetic')) {
            // Phonetic contribution
            await storage.createContribution({
              userId,
              languageId,
              type: 'audio',
              originalText: extractExamples(req.body.message),
              phoneticTranscription: extractPhonetics(req.body.message),
              translation: 'Phonetic documentation',
              approved: true,
              category: 'educational',
              difficultyLevel: 'intermediate'
            });
          } else if (userMessage.includes('culture') || userMessage.includes('tradition') || userMessage.includes('dialect')) {
            // Cultural contribution
            await storage.createContribution({
              userId,
              languageId,
              type: 'cultural_context',
              originalText: req.body.message,
              culturalSignificance: req.body.message,
              approved: true,
              category: 'ceremonial',
              difficultyLevel: 'intermediate'
            });
          }
          
          console.log(`Auto-saved interview contribution for language ${languageId}`);
        } catch (saveError) {
          console.error('Error auto-saving interview data:', saveError);
          // Don't fail the request if saving fails
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error in AI interview:", error);
      res.status(500).json({ 
        message: "I'm having trouble processing that right now. Could you try rephrasing your question?",
        error: "AI service temporarily unavailable"
      });
    }
  });
  
  // Helper functions for extracting linguistic data
  function extractGrammarPattern(text: string): string {
    // Extract grammatical patterns mentioned in the text
    const patterns = text.match(/\b(SOV|SVO|VSO|VOS|OSV|OVS|agglutinative|fusional|isolating|nominative|accusative|ergative|genitive|ablative|allative)\b/gi);
    return patterns ? patterns.join(', ') : 'morphological pattern';
  }
  
  function extractExamples(text: string): string {
    // Extract text between quotes or after "example:" or similar patterns
    const quoted = text.match(/"([^"]+)"|'([^']+)'|«([^»]+)»/g);
    if (quoted) return quoted.join(', ').replace(/["'«»]/g, '');
    
    const afterExample = text.match(/(?:example|e\.g\.|for instance|such as)[:\s]+([^.,;]+)/gi);
    if (afterExample) return afterExample[0];
    
    return '';
  }
  
  function extractPhonetics(text: string): string {
    // Extract IPA symbols or phonetic descriptions
    const ipaSymbols = text.match(/\[([^\]]+)\]|\b[ptkcfθsʃhbdgvðzʒmnŋlrjwaeiouæʌɪʊəɑɔ]+\b/g);
    return ipaSymbols ? ipaSymbols.join(' ') : '';
  }

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
  app.post('/api/admin/seed-languages', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { LanguageDataSeeder } = await import('./dataSeeder');
      
      const { count = 10, regions = [], threatLevels = [] } = req.body;
      
      const seeder = new LanguageDataSeeder();
      const results = await seeder.seedDatabase({
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

  // Admin: Generate missing courses endpoint - generates ONE language at a time
  app.post('/api/admin/generate-missing-courses', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { LanguageDataSeeder } = await import('./dataSeeder');
      
      const languages = await storage.getLanguages();
      const seeder = new LanguageDataSeeder();
      
      // Find the first language that needs a course
      let targetLanguage = null;
      let totalNeedingCourses = 0;
      
      for (const language of languages) {
        const existingLessons = await storage.getLessons(language.id);
        if (!existingLessons || existingLessons.length === 0) {
          totalNeedingCourses++;
          if (!targetLanguage) {
            targetLanguage = language;
          }
        }
      }

      // If no languages need courses
      if (!targetLanguage) {
        return res.json({ 
          generated: 0,
          skipped: languages.length,
          remaining: 0,
          total: languages.length,
          message: "All languages already have courses!",
          needsCourses: 0
        });
      }

      // Generate course for ONE language
      let success = false;
      let error = null;
      
      try {
        console.log(`Generating AI course for ${targetLanguage.name}...`);
        await seeder.createAIGeneratedCourse(targetLanguage.id, targetLanguage);
        success = true;
      } catch (err) {
        console.error(`Failed to generate course for ${targetLanguage.name}:`, err);
        error = err;
      }

      const remaining = totalNeedingCourses - (success ? 1 : 0);

      res.json({ 
        generated: success ? 1 : 0,
        errors: success ? 0 : 1,
        remaining,
        total: languages.length,
        languageName: targetLanguage.name,
        message: success 
          ? `Successfully generated course for ${targetLanguage.name}. ${remaining} languages still need courses.`
          : `Failed to generate course for ${targetLanguage.name}. ${remaining} languages still need courses.`,
        needsCourses: remaining,
        error: error ? error.message : null
      });
    } catch (error) {
      console.error("Error generating missing courses:", error);
      res.status(500).json({ message: "Failed to generate missing courses" });
    }
  });

  app.get('/api/admin/database-summary', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const languages = await storage.getLanguages();
      
      const summary = {
        totalLanguages: languages.length,
        byThreatLevel: languages.reduce((acc, lang) => {
          acc[lang.threatLevel] = (acc[lang.threatLevel] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byRegion: languages.reduce((acc, lang) => {
          acc[lang.region] = (acc[lang.region] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
      
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

  app.get('/api/recent-completions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 5;
      
      const completions = await storage.getRecentLessonCompletions(userId, limit);
      res.json(completions);
    } catch (error) {
      console.error("Error fetching recent completions:", error);
      res.status(500).json({ message: "Failed to fetch recent completions" });
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
      
      // Update progress and streak after completing lesson
      const lesson = await storage.getLessonById(completionData.lessonId);
      if (lesson) {
        await storage.updateLearningStreak(userId, lesson.languageId);
        await storage.incrementLessonsCompleted(userId, lesson.languageId);
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

  // Study Group routes
  app.get('/api/study-groups', async (req, res) => {
    try {
      const { userId, languageId, isPublic, limit = '20', offset = '0' } = req.query;
      
      const groups = await storage.getStudyGroups({
        userId: userId as string,
        languageId: languageId as string,
        isPublic: isPublic === 'true',
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json(groups);
    } catch (error) {
      console.error("Error fetching study groups:", error);
      res.status(500).json({ message: "Failed to fetch study groups" });
    }
  });

  app.get('/api/study-groups/:id', async (req, res) => {
    try {
      const group = await storage.getStudyGroupById(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Study group not found" });
      }
      res.json(group);
    } catch (error) {
      console.error("Error fetching study group:", error);
      res.status(500).json({ message: "Failed to fetch study group" });
    }
  });

  app.post('/api/study-groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const groupData = insertStudyGroupSchema.parse({
        ...req.body,
        creatorId: userId,
      });
      
      const group = await storage.createStudyGroup(groupData);
      res.json(group);
    } catch (error) {
      console.error("Error creating study group:", error);
      res.status(500).json({ message: "Failed to create study group" });
    }
  });

  app.put('/api/study-groups/:id', isAuthenticated, async (req, res) => {
    try {
      const group = await storage.updateStudyGroup(req.params.id, req.body);
      res.json(group);
    } catch (error) {
      console.error("Error updating study group:", error);
      res.status(500).json({ message: "Failed to update study group" });
    }
  });

  app.delete('/api/study-groups/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteStudyGroup(req.params.id);
      res.json({ message: "Study group deleted successfully" });
    } catch (error) {
      console.error("Error deleting study group:", error);
      res.status(500).json({ message: "Failed to delete study group" });
    }
  });

  // Group Member routes
  app.get('/api/study-groups/:groupId/members', async (req, res) => {
    try {
      const members = await storage.getGroupMembers(req.params.groupId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching group members:", error);
      res.status(500).json({ message: "Failed to fetch group members" });
    }
  });

  app.get('/api/user/study-groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const groups = await storage.getUserGroups(userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ message: "Failed to fetch user groups" });
    }
  });

  app.post('/api/study-groups/:groupId/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const memberData = insertGroupMemberSchema.parse({
        groupId: req.params.groupId,
        userId,
        role: 'member',
      });
      
      const member = await storage.joinGroup(memberData);
      res.json(member);
    } catch (error) {
      console.error("Error joining group:", error);
      res.status(500).json({ message: "Failed to join group" });
    }
  });

  app.post('/api/study-groups/:groupId/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.leaveGroup(req.params.groupId, userId);
      res.json({ message: "Left group successfully" });
    } catch (error) {
      console.error("Error leaving group:", error);
      res.status(500).json({ message: "Failed to leave group" });
    }
  });

  // Group Task routes
  app.get('/api/study-groups/:groupId/tasks', async (req, res) => {
    try {
      const { status } = req.query;
      const tasks = await storage.getGroupTasks(req.params.groupId, status as string);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching group tasks:", error);
      res.status(500).json({ message: "Failed to fetch group tasks" });
    }
  });

  app.post('/api/study-groups/:groupId/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const taskData = insertGroupTaskSchema.parse({
        ...req.body,
        groupId: req.params.groupId,
        createdBy: userId,
      });
      
      const task = await storage.createGroupTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating group task:", error);
      res.status(500).json({ message: "Failed to create group task" });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const task = await storage.updateGroupTask(req.params.id, req.body);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteGroupTask(req.params.id);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Task Progress routes
  app.get('/api/tasks/:taskId/progress', async (req, res) => {
    try {
      const progress = await storage.getTaskProgress(req.params.taskId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching task progress:", error);
      res.status(500).json({ message: "Failed to fetch task progress" });
    }
  });

  app.post('/api/tasks/:taskId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const progressData = insertTaskProgressSchema.parse({
        ...req.body,
        taskId: req.params.taskId,
        userId,
      });
      
      const progress = await storage.updateTaskProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating task progress:", error);
      res.status(500).json({ message: "Failed to update task progress" });
    }
  });

  // Learning Goal routes
  app.get('/api/study-groups/:groupId/goals', async (req, res) => {
    try {
      const goals = await storage.getGroupGoals(req.params.groupId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching group goals:", error);
      res.status(500).json({ message: "Failed to fetch group goals" });
    }
  });

  app.post('/api/study-groups/:groupId/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goalData = insertLearningGoalSchema.parse({
        ...req.body,
        groupId: req.params.groupId,
        createdBy: userId,
      });
      
      const goal = await storage.createLearningGoal(goalData);
      res.json(goal);
    } catch (error) {
      console.error("Error creating learning goal:", error);
      res.status(500).json({ message: "Failed to create learning goal" });
    }
  });

  app.put('/api/goals/:id', isAuthenticated, async (req, res) => {
    try {
      const goal = await storage.updateLearningGoal(req.params.id, req.body);
      res.json(goal);
    } catch (error) {
      console.error("Error updating learning goal:", error);
      res.status(500).json({ message: "Failed to update learning goal" });
    }
  });

  app.delete('/api/goals/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteLearningGoal(req.params.id);
      res.json({ message: "Learning goal deleted successfully" });
    } catch (error) {
      console.error("Error deleting learning goal:", error);
      res.status(500).json({ message: "Failed to delete learning goal" });
    }
  });

  // Taskade Project routes
  app.get('/api/languages/:languageId/taskade-project', async (req, res) => {
    try {
      const project = await storage.getTaskadeProject(req.params.languageId);
      res.json(project || null);
    } catch (error) {
      console.error("Error fetching Taskade project:", error);
      res.status(500).json({ message: "Failed to fetch Taskade project" });
    }
  });

  app.post('/api/languages/:languageId/taskade-project', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const languageId = req.params.languageId;
      
      // Check if project already exists
      const existingProject = await storage.getTaskadeProject(languageId);
      if (existingProject) {
        return res.status(400).json({ message: "Taskade project already exists for this language" });
      }
      
      // Get language details
      const language = await storage.getLanguageById(languageId);
      if (!language) {
        return res.status(404).json({ message: "Language not found" });
      }
      
      // Create Taskade project
      const { projectId, projectUrl } = await createLanguagePreservationProject(
        language.name,
        languageId,
        language.region,
        language.threatLevel
      );
      
      // Save to database
      const projectData = insertTaskadeProjectSchema.parse({
        languageId,
        taskadeProjectId: projectId,
        taskadeProjectUrl: projectUrl,
        createdBy: userId,
      });
      
      const project = await storage.createTaskadeProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Error creating Taskade project:", error);
      res.status(500).json({ message: "Failed to create Taskade project" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
