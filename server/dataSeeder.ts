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
    
    const prompt = `Generate ${count} real endangered languages with linguistic data. Use authentic languages from UNESCO Atlas. Return valid JSON only.

Schema:
{
  "name": "string",
  "nativeName": "string", 
  "region": "string (Africa/Asia/Europe/North America/South America/Oceania)",
  "country": "string",
  "speakers": "number",
  "threatLevel": "string (vulnerable/endangered/critically_endangered/extinct)",
  "family": "string",
  "iso639Code": "string or null",
  "writingSystem": "string (Latin/Cyrillic/Arabic/Chinese/Japanese/Indian/Other/None)",
  "description": "string (brief overview)",
  "alphabet": "string (writing system and characters)",
  "basicVocabulary": "string (essential words with translations)",
  "grammarOverview": "string (key grammatical features)",
  "commonPhrases": "string (daily expressions and phrases)",
  "culturalContext": "string (cultural significance and context)"
}

Requirements:
- Use real endangered languages from UNESCO Atlas
- Include languages from different continents  
- Mix threat levels for diversity
- Keep content substantial but valid JSON
- No markdown formatting

Return only valid JSON array:`;

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

      // Clean the response text - remove markdown code blocks if present
      let cleanText = content.text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Try to fix common JSON issues
      cleanText = cleanText.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
      cleanText = cleanText.replace(/\\/g, '\\\\'); // Escape backslashes
      cleanText = cleanText.replace(/"/g, '\\"'); // Escape quotes
      cleanText = cleanText.replace(/\\"/g, '"'); // Fix over-escaping
      cleanText = cleanText.replace(/\\"([^"]*?)\\"/g, '"$1"'); // Fix property names

      let languagesData: InsertLanguage[];
      try {
        languagesData = JSON.parse(cleanText) as InsertLanguage[];
      } catch (parseError) {
        // If parsing fails, try to extract JSON manually
        const arrayMatch = cleanText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          languagesData = JSON.parse(arrayMatch[0]) as InsertLanguage[];
        } else {
          throw parseError;
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
          await storage.createLanguage(langData);
          console.log(`Created language: ${langData.name}`);
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
}