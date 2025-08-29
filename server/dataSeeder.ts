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

  // COMPLETE DICTIONARY - EVERY WORD
  "completeDictionary": "string (ENTIRE vocabulary of the language - thousands of words with definitions, pronunciation, etymology)",
  "verbsDictionary": "string (ALL verbs with every conjugated form, meanings, usage examples)",
  "nounsDictionary": "string (ALL nouns with plural forms, case forms, compound forms)",
  "adjectivesDictionary": "string (ALL adjectives with comparative/superlative forms)",
  "adverbsDictionary": "string (ALL adverbs with usage contexts)",
  "pronounsDictionary": "string (ALL pronouns with complete paradigms)",
  "functionWordsDictionary": "string (ALL particles, prepositions, conjunctions, determiners)",
  
  // EXHAUSTIVE SPECIALIZED VOCABULARIES
  "kinshipTermsComplete": "string (EVERY family relationship term, clan terms, kinship system)",
  "environmentalVocabularyComplete": "string (ALL plant names, animal names, weather terms, geographic features)",
  "culturalTermsComplete": "string (ALL ceremony names, tradition terms, belief concepts)",
  "bodyVocabularyComplete": "string (EVERY body part, health term, medical vocabulary)",
  "foodVocabularyComplete": "string (ALL food names, cooking terms, eating vocabulary)",
  "toolsObjectsComplete": "string (EVERY tool name, household item, technology term)",
  "timeTermsComplete": "string (ALL time expressions, calendar terms, temporal concepts)",
  "spatialTermsComplete": "string (ALL direction terms, location words, spatial concepts)",
  "emotionVocabulary": "string (ALL emotion words, feeling expressions, mental states)",
  "actionVocabulary": "string (ALL action verbs, movement terms, activity words)",
  "soundVocabulary": "string (ALL sound words, noise terms, acoustic descriptions)",
  "colorVocabulary": "string (ALL color terms, shade descriptions, visual concepts)",
  "textureVocabulary": "string (ALL texture words, tactile descriptions)",
  "tasteSmellVocabulary": "string (ALL taste/smell words, sensory descriptions)",

  // COMPLETE GRAMMATICAL SYSTEM - EVERY RULE
  "completeGrammar": "string (ENTIRE grammatical system with all rules, exceptions, variations)",
  "morphologyComplete": "string (ALL word formation rules, inflection patterns, morpheme combinations)",
  "syntaxComplete": "string (ALL sentence structures, phrase types, clause constructions)",
  "verbConjugationComplete": "string (EVERY verb form, tense, aspect, mood with complete paradigms)",
  "nounDeclensionComplete": "string (EVERY case form, number form, gender form for all nouns)",
  "pronounParadigmsComplete": "string (COMPLETE pronoun system with all forms and uses)",
  "adjectiveInflectionComplete": "string (ALL adjective forms, agreement patterns, positions)",
  "adverbFormationComplete": "string (ALL adverb types, formation rules, usage patterns)",
  "wordOrderVariations": "string (ALL possible word orders and their meanings)",
  "questionFormationComplete": "string (EVERY question type, formation rule, intonation pattern)",
  "negationSystemComplete": "string (ALL negation methods, scope, double negatives)",
  "comparisonSystemComplete": "string (ALL comparative structures, superlative forms)",
  "modalitySystem": "string (ALL modal expressions, possibility, necessity, permission)",
  "aspectualSystem": "string (ALL aspectual distinctions, temporal relationships)",
  "evidentialitySystem": "string (ALL evidentiality markers if present)",
  "honorificSystem": "string (ALL politeness levels, respect markers)",
  "switchReferenceSystem": "string (ALL switch-reference patterns if present)",
  "serialVerbConstructions": "string (ALL serial verb patterns if present)",
  "causativeConstructions": "string (ALL causative forms and meanings)",
  "passiveConstructions": "string (ALL passive types and formations)",

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

  // COMPLETE SENTENCE CORPUS - THOUSANDS OF EXAMPLES
  "allSentencePatterns": "string (EVERY possible sentence type with hundreds of examples each)",
  "simplesentences": "string (1000+ basic sentences covering all vocabulary)",
  "complexSentences": "string (500+ complex sentences with subordinate clauses)",
  "questionSentences": "string (ALL question types with hundreds of examples)",
  "commandSentences": "string (ALL imperative forms with examples)",
  "conditionalSentences": "string (ALL conditional constructions with examples)",
  "negativesentences": "string (ALL negation patterns with examples)",
  "comparativeSentences": "string (ALL comparison structures with examples)",
  "temporalSentences": "string (ALL time expressions in sentence form)",
  "conversationalDialogues": "string (COMPLETE conversations covering all life situations)",
  "narrativeTexts": "string (COMPLETE stories, myths, legends in the language)",
  "descriptiveTexts": "string (DETAILED descriptions of objects, places, people)",
  "proceduralTexts": "string (COMPLETE instructions, recipes, how-to guides)",
  "argumentativeTexts": "string (COMPLETE debates, discussions, persuasive texts)",
  "poeticTexts": "string (ALL traditional poems, songs, chants)",
  "ceremonialTexts": "string (COMPLETE ritual texts, prayers, formal speeches)",
  "everydayPhrases": "string (THOUSANDS of daily expressions, social interactions)",
  "idiomaticExpressions": "string (ALL idioms, proverbs, fixed expressions with explanations)",
  "technicalTerminology": "string (SPECIALIZED vocabulary for trades, crafts, skills)",

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
- Provide EXHAUSTIVE linguistic content - thousands of words, hundreds of grammar rules, complete sentence corpora
- Include EVERY possible word, phrase, sentence pattern, grammatical construction
- Make this a COMPLETE linguistic reference that could teach someone the entire language
- Provide authentic, comprehensive data that preserves the FULL language system

CRITICAL: Generate MASSIVE amounts of linguistic content - this should be complete language documentation with thousands of entries per field.

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