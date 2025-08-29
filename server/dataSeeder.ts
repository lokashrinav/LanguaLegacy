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
    
    const prompt = `Generate comprehensive data for ${count} real endangered languages. For each language, provide accurate information that matches this exact JSON schema:

{
  "name": "string (official language name)",
  "nativeName": "string (how speakers call their language)",
  "region": "string (continent: Africa, Asia, Europe, North America, South America, Oceania)",
  "country": "string (primary country)",
  "speakers": "number (current speaker count, can be 0 for extinct)",
  "threatLevel": "string (vulnerable|endangered|critically_endangered|extinct)",
  "family": "string (language family)",
  "iso639Code": "string (3-letter ISO code if available, or null)",
  "writingSystem": "string (Latin|Cyrillic|Arabic|Chinese|Japanese|Indian|Other|None)",
  "description": "string (2-3 sentences about the language)",
  "culturalSignificance": "string (cultural importance and traditions)",
  "geographicDistribution": "string (where it's spoken geographically)",
  "dialectVariations": "string (major dialects if any)",
  "phonology": "string (notable sound system features)",
  "grammar": "string (grammatical structure highlights)",
  "vocabulary": "string (interesting vocabulary characteristics)",
  "historicalContext": "string (language history and changes)",
  "currentStatus": "string (current preservation efforts)",
  "challenges": "string (threats and preservation challenges)",
  "resources": "string (existing documentation or learning materials)",
  "contactLanguages": "string (languages it interacts with)",
  "revitalizationEfforts": "string (ongoing revival programs)"
}

Requirements:
- Focus on genuine endangered languages from UNESCO Atlas and Ethnologue
- Include diverse languages from all continents
- Mix different threat levels (vulnerable to extinct)
- Provide accurate speaker counts and geographic data
- Make cultural significance detailed and specific
- Ensure linguistic details are authentic

Return ONLY a valid JSON array of objects, no additional text.`;

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

      const languagesData = JSON.parse(content.text) as InsertLanguage[];
      
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
            results.skipped++;
            console.log(`Skipped existing language: ${langData.name}`);
            continue;
          }

          // Create the language
          await storage.createLanguage(langData);
          results.created++;
          console.log(`Created language: ${langData.name}`);
          
        } catch (error) {
          const errorMsg = `Failed to create ${langData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          results.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

    } catch (error) {
      const errorMsg = `Data seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      results.errors.push(errorMsg);
      console.error(errorMsg);
    }

    return results;
  }

  async getDataSummary(): Promise<{
    totalLanguages: number;
    byThreatLevel: Record<string, number>;
    byRegion: Record<string, number>;
    recentlyAdded: number;
  }> {
    const languages = await storage.getLanguages();
    
    const byThreatLevel: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    let recentlyAdded = 0;
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const lang of languages) {
      // Count by threat level
      byThreatLevel[lang.threatLevel] = (byThreatLevel[lang.threatLevel] || 0) + 1;
      
      // Count by region
      byRegion[lang.region] = (byRegion[lang.region] || 0) + 1;
      
      // Count recently added
      if (lang.createdAt && new Date(lang.createdAt) > oneDayAgo) {
        recentlyAdded++;
      }
    }
    
    return {
      totalLanguages: languages.length,
      byThreatLevel,
      byRegion,
      recentlyAdded
    };
  }
}

export const languageSeeder = new LanguageDataSeeder();