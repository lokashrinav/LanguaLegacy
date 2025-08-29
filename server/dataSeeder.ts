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
    
    const prompt = `Generate comprehensive data for ${count} real endangered languages. For each language, provide accurate information that matches this exact JSON schema with EVERY possible detail:

{
  // BASIC IDENTIFICATION
  "name": "string (official language name)",
  "nativeName": "string (how speakers call their language)",
  "alternativeNames": "string (other names, dialects, historical names)",
  "region": "string (continent: Africa, Asia, Europe, North America, South America, Oceania)",
  "country": "string (primary country)",
  "speakers": "number (current speaker count, can be 0 for extinct)",
  "threatLevel": "string (vulnerable|endangered|critically_endangered|extinct)",
  "family": "string (language family)",
  "iso639Code": "string (3-letter ISO code if available, or null)",
  "writingSystem": "string (Latin|Cyrillic|Arabic|Chinese|Japanese|Indian|Other|None)",
  "description": "string (comprehensive overview)",

  // LINGUISTIC FEATURES - DETAILED
  "phonology": "string (complete sound system: consonants, vowels, tones, stress)",
  "morphology": "string (word formation, inflection, derivation patterns)",
  "syntax": "string (sentence structure, word order, clause types)",
  "grammar": "string (grammatical features, case systems, verb aspects)",
  "vocabulary": "string (lexical characteristics, borrowings, semantic fields)",
  "semantics": "string (meaning systems, metaphors, cultural concepts)",
  "pragmatics": "string (language use in context, politeness, discourse)",
  "dialectVariations": "string (regional/social varieties and differences)",
  "uniqueFeatures": "string (rare grammatical phenomena, unusual characteristics)",
  "comparativeLinguistics": "string (similarities/differences with related languages)",

  // CULTURAL & SOCIAL CONTEXT
  "culturalSignificance": "string (role in identity, ceremonies, traditions)",
  "traditionalKnowledge": "string (encoded ecological, medical, agricultural knowledge)",
  "oralTraditions": "string (myths, legends, storytelling traditions)",
  "religiousSpiritual": "string (sacred uses, prayers, spiritual concepts)",
  "socialStructure": "string (kinship terms, social hierarchy reflected in language)",
  "culturalProducts": "string (literature, songs, poetry, folklore in the language)",
  "ceremonies": "string (ritual uses, ceremonial language, taboos)",

  // HISTORICAL CONTEXT
  "historicalContext": "string (language origins, migrations, historical changes)",
  "colonialImpact": "string (effects of colonization, suppression, policy changes)",
  "firstDocumentation": "string (earliest written records, who documented it)",
  "historicalSpeakerNumbers": "string (population changes over time)",
  "languageShift": "string (factors causing decline, when shift began)",

  // GEOGRAPHIC & DEMOGRAPHIC
  "geographicDistribution": "string (exact locations, settlements, territories)",
  "speakerDemographics": "string (age distribution, urban vs rural, gender patterns)",
  "migrationPatterns": "string (diaspora communities, resettlement)",
  "environmentalContext": "string (ecosystem, climate, geographic features)",

  // SOCIOLINGUISTIC FACTORS
  "languageAttitudes": "string (prestige, stigma, community pride, external perceptions)",
  "multilingualism": "string (other languages speakers know, code-switching patterns)",
  "diglossia": "string (formal vs informal use, domain-specific usage)",
  "intergenerationalTransmission": "string (how language passes to children)",
  "urbanRuralDifferences": "string (usage patterns in different settings)",

  // CURRENT STATUS & DOCUMENTATION
  "currentStatus": "string (active use, domains of use, vitality)",
  "documentationLevel": "string (quality and quantity of linguistic documentation)",
  "audioArchives": "string (existing recordings, oral history projects)",
  "videoDocumentation": "string (visual documentation, sign language if applicable)",
  "dictionaryStatus": "string (available dictionaries, lexicographic work)",
  "grammarDocumentation": "string (grammatical descriptions, linguistic analyses)",
  "corpusLinguistics": "string (text collections, computational resources)",

  // EDUCATION & LITERACY
  "educationalPrograms": "string (school programs, language immersion, curricula)",
  "literacyRates": "string (reading/writing abilities in the language)",
  "teachingMaterials": "string (textbooks, learning resources, pedagogical tools)",
  "universityPrograms": "string (academic study, linguistics departments)",

  // TECHNOLOGY & MEDIA
  "digitalPresence": "string (websites, apps, social media use)",
  "mediaProduction": "string (radio, TV, newspapers, films in the language)",
  "technologicalAdaptation": "string (unicode support, fonts, keyboards)",
  "onlineResources": "string (digital dictionaries, learning platforms)",

  // LEGAL & POLITICAL STATUS
  "officialStatus": "string (government recognition, legal protections)",
  "languageRights": "string (constitutional recognition, minority language rights)",
  "policySupport": "string (government programs, funding, legislation)",
  "internationalRecognition": "string (UNESCO status, international organization support)",

  // RESEARCH & ACADEMIC STUDY
  "keyResearchers": "string (notable linguists, anthropologists studying the language)",
  "researchInstitutions": "string (universities, institutes conducting research)",
  "academicPublications": "string (major studies, dissertations, linguistic papers)",
  "fieldworkHistory": "string (when and how linguistic fieldwork was conducted)",

  // CHALLENGES & THREATS
  "challenges": "string (specific threats: urbanization, education policy, globalization)",
  "languageShiftFactors": "string (economic, social, political pressures)",
  "endangermentFactors": "string (what caused decline, ongoing threats)",
  "competingLanguages": "string (dominant languages replacing it)",

  // PRESERVATION & REVITALIZATION
  "revitalizationEfforts": "string (community programs, revival initiatives)",
  "communitySupport": "string (grassroots efforts, elder involvement)",
  "governmentSupport": "string (official preservation programs, funding)",
  "internationalSupport": "string (NGO involvement, international funding)",
  "successStories": "string (positive developments, increasing usage)",
  "revitalizationChallenges": "string (obstacles to preservation efforts)",

  // COMMUNITY & CONTACT
  "contactLanguages": "string (languages in contact, borrowing patterns)",
  "communityStructure": "string (speaker communities, tribal organization)",
  "culturalPractices": "string (customs maintained through the language)",
  "economicFactors": "string (role in traditional economy, modern economic pressures)",

  // FUTURE PROSPECTS
  "futureOutlook": "string (predictions for language survival, trends)",
  "youthInvolvement": "string (young people's engagement, learning initiatives)",
  "emergingOpportunities": "string (new contexts for use, digital opportunities)"
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