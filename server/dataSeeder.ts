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
    
    const prompt = `Generate comprehensive LINGUISTIC CONTENT data for ${count} real endangered languages. Focus on the ACTUAL LANGUAGE CONTENT - alphabet, words, grammar rules, pronunciation - everything needed to speak and understand the language. Provide accurate information that matches this exact JSON schema:

{
  // BASIC INFO
  "name": "string (official language name)",
  "nativeName": "string (how speakers call their language)",
  "region": "string (continent: Africa, Asia, Europe, North America, South America, Oceania)",
  "country": "string (primary country)",
  "speakers": "number (current speaker count, can be 0 for extinct)",
  "threatLevel": "string (vulnerable|endangered|critically_endangered|extinct)",
  "family": "string (language family)",
  "iso639Code": "string (3-letter ISO code if available, or null)",
  "writingSystem": "string (Latin|Cyrillic|Arabic|Chinese|Japanese|Indian|Other|None)",
  "description": "string (brief overview)",

  // ALPHABET & WRITING SYSTEM
  "alphabet": "string (complete alphabet/character set with order)",
  "letterSounds": "string (each letter/character and its pronunciation)",
  "specialCharacters": "string (diacritics, unique symbols, tone marks)",
  "writingDirection": "string (left-to-right, right-to-left, top-to-bottom)",
  "punctuation": "string (punctuation marks and their usage)",
  "numerals": "string (number system and how to write numbers)",
  "capitalization": "string (capitalization rules if applicable)",

  // PRONUNCIATION & PHONOLOGY
  "consonants": "string (all consonant sounds with IPA and descriptions)",
  "vowels": "string (all vowel sounds with IPA and descriptions)",
  "tones": "string (tonal system if applicable, tone patterns)",
  "stress": "string (stress patterns, accent rules)",
  "syllableStructure": "string (allowed syllable patterns)",
  "phonotactics": "string (sound combination rules)",
  "allophony": "string (sound variations in different contexts)",

  // VOCABULARY - COMPREHENSIVE WORD LISTS
  "basicVocabulary": "string (essential 500+ words: body parts, family, numbers, colors, time)",
  "verbs": "string (comprehensive verb list with meanings and forms)",
  "nouns": "string (extensive noun vocabulary across all domains)",
  "adjectives": "string (descriptive words, qualities, characteristics)",
  "adverbs": "string (manner, time, place, frequency adverbs)",
  "pronouns": "string (personal, possessive, demonstrative, interrogative pronouns)",
  "prepositions": "string (spatial, temporal, relational prepositions)",
  "conjunctions": "string (connecting words, logical relationships)",
  "interjections": "string (exclamations, emotional expressions)",
  "functionalWords": "string (particles, auxiliaries, determiners)",
  
  // SPECIALIZED VOCABULARY
  "kinshipTerms": "string (family relationships, clan terms)",
  "environmentalVocabulary": "string (plants, animals, weather, geography)",
  "culturalTerms": "string (ceremonies, traditions, beliefs)",
  "bodyVocabulary": "string (anatomy, health, medical terms)",
  "foodVocabulary": "string (ingredients, cooking, eating)",
  "toolsObjects": "string (implements, household items, technology)",
  "timeTerms": "string (calendar, seasons, time expressions)",
  "spatialTerms": "string (directions, locations, spatial relationships)",

  // GRAMMAR RULES - COMPLETE SYSTEM
  "wordOrder": "string (basic sentence structure: SVO, SOV, etc.)",
  "nounInflection": "string (case system, number, gender marking)",
  "verbConjugation": "string (tense, aspect, mood, person/number marking)",
  "pronounSystem": "string (pronoun paradigms, usage rules)",
  "adjectiveAgreement": "string (how adjectives modify nouns)",
  "articleSystem": "string (definite/indefinite articles if present)",
  "possessionRules": "string (how to express ownership)",
  "questionFormation": "string (how to form questions)",
  "negationRules": "string (how to make negative statements)",
  "comparisonRules": "string (comparative and superlative forms)",
  "compoundWords": "string (how to combine words)",
  "derivationalMorphology": "string (prefixes, suffixes, word formation)",

  // SENTENCE PATTERNS & SYNTAX
  "basicSentencePatterns": "string (common sentence structures with examples)",
  "complexSentences": "string (subordination, coordination patterns)",
  "conditionalSentences": "string (if-then constructions)",
  "passiveVoice": "string (passive construction if present)",
  "imperativeForm": "string (commands, requests)",
  "questionWords": "string (who, what, where, when, why, how)",
  "relativeClauses": "string (modifying clauses)",
  "temporalExpressions": "string (time and sequence expressions)",

  // PRACTICAL LANGUAGE USE
  "commonPhrases": "string (greetings, farewells, polite expressions)",
  "everydayConversation": "string (practical dialogues, daily interactions)",
  "numbersSystem": "string (counting system, mathematical operations)",
  "directions": "string (giving and receiving directions)",
  "emergencyPhrases": "string (help, medical, urgent situations)",
  "socialPhrases": "string (celebrations, condolences, social interactions)",

  // EXAMPLE TEXTS
  "sampleSentences": "string (50+ example sentences with translations)",
  "dialogueExamples": "string (conversation examples)",
  "traditionalSayings": "string (proverbs, idioms with explanations)",
  "storytellingExamples": "string (narrative structures, story openings)",

  // PRONUNCIATION GUIDE
  "pronunciationRules": "string (how to pronounce written words)",
  "commonSounds": "string (frequent sound patterns)",
  "difficultSounds": "string (challenging pronunciations for learners)",
  "intonationPatterns": "string (sentence melody, question intonation)",

  // DIALECTAL VARIATIONS
  "dialectDifferences": "string (vocabulary/pronunciation differences between regions)",
  "formalInformal": "string (register differences, polite vs casual speech)",

  // LEARNING AIDS
  "learningTips": "string (helpful patterns, memory aids)",
  "commonMistakes": "string (frequent errors learners make)",
  "practiceExercises": "string (suggested practice activities)"
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