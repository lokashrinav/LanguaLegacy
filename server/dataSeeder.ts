import Anthropic from '@anthropic-ai/sdk';
import { storage } from './storage';
import type { InsertLanguage } from '@shared/schema';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Default model string
const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";

export interface LanguageDataRequest {
  count?: number;
  regions?: string[];
  threatLevels?: string[];
}

export class LanguageDataSeeder {
  async generateEndangeredLanguagesData(request: LanguageDataRequest = {}): Promise<InsertLanguage[]> {
    const { count = 50, regions = [], threatLevels = [] } = request;
    
    console.log(`=== STARTING AI REQUEST FOR ${count} LANGUAGES ===`);
    
    const prompt = `Return only a JSON array of ${count} endangered languages. No explanations.

Format:
[{"name":"Ainu","nativeName":"Aynu itak","region":"Asia","country":"Japan","speakers":2,"threatLevel":"critically_endangered","family":"Isolate","description":"Indigenous Hokkaido language"},{"name":"Yagan","nativeName":"Yaghan","region":"South America","country":"Chile","speakers":1,"threatLevel":"critically_endangered","family":"Yaghan","description":"Fuegian archipelago language"}]

Generate exactly ${count} different real endangered languages in this format. Only return the JSON array.`;

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from AI');
      }

      // DEBUG: Log the raw response
      console.log('=== RAW AI RESPONSE ===');
      console.log(content.text);
      console.log('=== END RAW RESPONSE ===');
      
      // Clean the response text more thoroughly
      let cleanText = content.text.trim();
      
      // Remove markdown code blocks
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any text before the first [ or after the last ]
      const firstBracket = cleanText.indexOf('[');
      const lastBracket = cleanText.lastIndexOf(']');
      if (firstBracket >= 0 && lastBracket > firstBracket) {
        cleanText = cleanText.substring(firstBracket, lastBracket + 1);
      }

      console.log('=== CLEANED TEXT ===');
      console.log(cleanText);
      console.log('=== END CLEANED ===');

      let languagesData: InsertLanguage[];
      
      try {
        languagesData = JSON.parse(cleanText) as InsertLanguage[];
      } catch (parseError) {
        console.log('=== JSON PARSE FAILED, ATTEMPTING FIXES ===');
        
        // Try fixing common JSON issues
        let fixedText = cleanText
          // Fix unescaped quotes in strings
          .replace(/(?<!\\)"/g, '\\"')
          // Fix the escaped quotes we just created at property boundaries
          .replace(/\\"/g, '"')
          .replace(/("\w+":"|"\w+":)/g, (match) => match.replace(/\\"/g, '"'))
          // Fix trailing commas
          .replace(/,(\s*[}\]])/g, '$1');
          
        try {
          languagesData = JSON.parse(fixedText) as InsertLanguage[];
          console.log('=== JSON FIXED SUCCESSFULLY ===');
        } catch (secondError) {
          console.log('=== STILL FAILED, TRYING SIMPLER PARSING ===');
          throw new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
      }
      
      // Validate the data structure
      if (!Array.isArray(languagesData)) {
        throw new Error('AI response is not an array');
      }

      // Basic validation for each language
      languagesData.forEach((lang, index) => {
        if (!lang.name || !lang.region || !lang.threatLevel) {
          throw new Error(`Invalid language data at index ${index}: missing required fields`);
        }
      });

      return languagesData;
    } catch (error) {
      console.error('Error generating language data:', error);
      throw new Error(`Failed to generate language data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async seedDatabase(request: LanguageDataRequest = {}): Promise<{
    created: number;
    skipped: number;
    errors: string[];
  }> {
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[]
    };

    try {
      console.log('Generating language data with AI...');
      const languagesData = await this.generateEndangeredLanguagesData(request);
      console.log(`Generated ${languagesData.length} languages`);

      // Check existing languages to avoid duplicates
      const existingLanguages = await storage.getLanguages();
      const existingNames = new Set(existingLanguages.map(l => l.name.toLowerCase()));

      for (const langData of languagesData) {
        try {
          // Skip if language already exists
          if (existingNames.has(langData.name.toLowerCase())) {
            console.log(`Skipping duplicate language: ${langData.name}`);
            results.skipped++;
            continue;
          }

          // Create the language
          const createdLanguage = await storage.createLanguage(langData);
          console.log(`Created language: ${langData.name}`);
          
          // Create basic lessons for this language
          await this.createBasicLessons(createdLanguage.id, langData.name);
          console.log(`Created lessons for: ${langData.name}`);
          
          results.created++;
        } catch (error) {
          const errorMsg = `Failed to create ${langData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }

      console.log(`Data seeding completed: ${results.created} created, ${results.skipped} skipped, ${results.errors.length} errors`);
    } catch (error) {
      const errorMsg = `Data seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    return results;
  }

  private async createBasicLessons(languageId: string, languageName: string): Promise<void> {
    const basicLessons = [
      {
        title: "Basic Greetings",
        description: `Learn essential greetings and introductions in ${languageName}`,
        level: "beginner",
        order: 1,
        content: {
          phrases: [
            {
              original: "Hello",
              phonetic: "həˈloʊ",
              translation: "A greeting used when meeting someone",
              context: "Used in most social situations"
            },
            {
              original: "Good morning",
              phonetic: "ɡʊd ˈmɔːrnɪŋ",
              translation: "Morning greeting",
              context: "Used before noon"
            },
            {
              original: "Thank you",
              phonetic: "θæŋk juː",
              translation: "Expression of gratitude",
              context: "Used to show appreciation"
            }
          ],
          duration: 15,
          culturalContext: `These greetings are fundamental to ${languageName} culture and show respect for others.`
        }
      },
      {
        title: "Family and Relationships",
        description: `Discover words for family members and relationships in ${languageName}`,
        level: "beginner",
        order: 2,
        content: {
          phrases: [
            {
              original: "Mother",
              phonetic: "ˈmʌðər",
              translation: "Female parent",
              context: "Family relationship"
            },
            {
              original: "Father",
              phonetic: "ˈfɑːðər",
              translation: "Male parent",
              context: "Family relationship"
            },
            {
              original: "Child",
              phonetic: "tʃaɪld",
              translation: "Young person",
              context: "Family relationship"
            }
          ],
          duration: 20,
          culturalContext: `Family structures and relationships hold special significance in ${languageName} culture.`
        }
      },
      {
        title: "Numbers and Counting",
        description: `Learn the number system in ${languageName}`,
        level: "beginner",
        order: 3,
        content: {
          phrases: [
            {
              original: "One",
              phonetic: "wʌn",
              translation: "The number 1",
              context: "Basic counting"
            },
            {
              original: "Two",
              phonetic: "tuː",
              translation: "The number 2",
              context: "Basic counting"
            },
            {
              original: "Three",
              phonetic: "θriː",
              translation: "The number 3",
              context: "Basic counting"
            }
          ],
          duration: 18,
          culturalContext: `Traditional counting systems often reflect cultural values and mathematical concepts.`
        }
      },
      {
        title: "Colors and Nature",
        description: `Explore colors and natural elements in ${languageName}`,
        level: "intermediate",
        order: 4,
        content: {
          phrases: [
            {
              original: "Red",
              phonetic: "red",
              translation: "The color red",
              context: "Describing objects"
            },
            {
              original: "Blue",
              phonetic: "bluː",
              translation: "The color blue",
              context: "Describing objects"
            },
            {
              original: "Green",
              phonetic: "ɡriːn",
              translation: "The color green",
              context: "Describing objects"
            }
          ],
          duration: 25,
          culturalContext: `Colors often have cultural and spiritual significance in indigenous languages.`
        }
      },
      {
        title: "Daily Activities",
        description: `Learn words for common daily activities in ${languageName}`,
        level: "intermediate",
        order: 5,
        content: {
          phrases: [
            {
              original: "To eat",
              phonetic: "tuː iːt",
              translation: "Consuming food",
              context: "Daily activity"
            },
            {
              original: "To sleep",
              phonetic: "tuː sliːp",
              translation: "Resting at night",
              context: "Daily activity"
            },
            {
              original: "To work",
              phonetic: "tuː wɜːrk",
              translation: "Performing tasks",
              context: "Daily activity"
            }
          ],
          duration: 22,
          culturalContext: `Daily activities reflect the lifestyle and values of the community.`
        }
      }
    ];

    for (const lessonData of basicLessons) {
      try {
        await storage.createLesson({
          languageId,
          title: lessonData.title,
          description: lessonData.description,
          level: lessonData.level,
          order: lessonData.order,
          content: lessonData.content
        });
      } catch (error) {
        console.error(`Failed to create lesson "${lessonData.title}" for ${languageName}:`, error);
      }
    }
  }
}