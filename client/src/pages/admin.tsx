import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Globe, BookOpen, Users, Archive, Map, Settings, Database, Sparkles } from "lucide-react";
import DatabaseSeeding from "@/components/DatabaseSeeding";

const languageFormSchema = z.object({
  // Basic Information
  name: z.string().min(1, "Language name is required"),
  nativeName: z.string().optional(),
  isoCode: z.string().optional(),
  region: z.string().min(1, "Region is required"),
  country: z.string().optional(),
  speakers: z.coerce.number().min(0).optional(),
  threatLevel: z.enum(["vulnerable", "endangered", "critically_endangered", "extinct"]),
  family: z.string().optional(),
  description: z.string().optional(),
  
  // Linguistic Features
  writingSystems: z.string().optional(), // Will split by commas
  phoneticFeatures: z.string().optional(),
  grammarNotes: z.string().optional(),
  dialects: z.string().optional(),
  
  // Geographic & Demographics
  coordinates: z.string().optional(), // Will parse as lat,lng
  historicalRegions: z.string().optional(),
  speakerDemographics: z.string().optional(),
  
  // Cultural Context
  culturalSignificance: z.string().optional(),
  historicalContext: z.string().optional(),
  ritualUses: z.string().optional(),
  oralTraditions: z.string().optional(),
  
  // Documentation & Resources
  documentationStatus: z.enum(["well_documented", "partially_documented", "underdocumented"]).optional(),
  revitalizationEfforts: z.string().optional(),
  educationalPrograms: z.string().optional(),
  audioArchiveUrl: z.string().optional(),
  videoArchiveUrl: z.string().optional(),
  dictionaryUrl: z.string().optional(),
  
  // Community & Research
  researchReferences: z.string().optional(),
  communityWebsite: z.string().optional(),
  communityContacts: z.string().optional(),
});

type LanguageFormData = z.infer<typeof languageFormSchema>;

const threatLevelColors = {
  vulnerable: "bg-yellow-100 text-yellow-800 border-yellow-300",
  endangered: "bg-orange-100 text-orange-800 border-orange-300",
  critically_endangered: "bg-red-100 text-red-800 border-red-300",
  extinct: "bg-gray-100 text-gray-800 border-gray-300",
};

const threatLevelLabels = {
  vulnerable: "Vulnerable",
  endangered: "Endangered",
  critically_endangered: "Critically Endangered",
  extinct: "Extinct",
};

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [seedingCount, setSeedingCount] = useState(50);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedThreatLevels, setSelectedThreatLevels] = useState<string[]>([]);

  const form = useForm<LanguageFormData>({
    resolver: zodResolver(languageFormSchema),
    defaultValues: {
      name: "",
      nativeName: "",
      isoCode: "",
      region: "",
      country: "",
      speakers: 0,
      threatLevel: "endangered",
      family: "",
      description: "",
      writingSystems: "",
      phoneticFeatures: "",
      grammarNotes: "",
      dialects: "",
      coordinates: "",
      historicalRegions: "",
      speakerDemographics: "",
      culturalSignificance: "",
      historicalContext: "",
      ritualUses: "",
      oralTraditions: "",
      documentationStatus: "partially_documented",
      revitalizationEfforts: "",
      educationalPrograms: "",
      audioArchiveUrl: "",
      videoArchiveUrl: "",
      dictionaryUrl: "",
      researchReferences: "",
      communityWebsite: "",
      communityContacts: "",
    },
  });

  // Fetch existing languages
  const { data: languages = [], isLoading } = useQuery({
    queryKey: ["/api/languages"],
  });

  // Fetch database summary
  const { data: dbSummary, isLoading: summaryLoading } = useQuery<{
    totalLanguages: number;
    byThreatLevel: Record<string, number>;
    byRegion: Record<string, number>;
    recentlyAdded: number;
  }>({
    queryKey: ["/api/admin/database-summary"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Create language mutation
  const createLanguageMutation = useMutation({
    mutationFn: async (data: LanguageFormData) => {
      // Process form data into proper format for backend
      const processedData = {
        ...data,
        writingSystems: data.writingSystems ? data.writingSystems.split(',').map(s => s.trim()).filter(Boolean) : [],
        phoneticInventory: data.phoneticFeatures ? { description: data.phoneticFeatures } : null,
        dialects: data.dialects ? { variants: data.dialects.split(',').map(s => s.trim()).filter(Boolean) } : null,
        grammarFeatures: data.grammarNotes ? { notes: data.grammarNotes } : null,
        coordinates: data.coordinates ? (() => {
          const [lat, lng] = data.coordinates.split(',').map(s => parseFloat(s.trim()));
          return lat && lng ? { lat, lng } : null;
        })() : null,
        historicalRegions: data.historicalRegions ? data.historicalRegions.split(',').map(s => s.trim()).filter(Boolean) : [],
        speakerAgeGroups: data.speakerDemographics ? { description: data.speakerDemographics } : null,
        ritualUses: data.ritualUses ? data.ritualUses.split(',').map(s => s.trim()).filter(Boolean) : [],
        oralTraditions: data.oralTraditions ? data.oralTraditions.split(',').map(s => s.trim()).filter(Boolean) : [],
        educationalPrograms: data.educationalPrograms ? data.educationalPrograms.split(',').map(s => s.trim()).filter(Boolean) : [],
        researchReferences: data.researchReferences ? data.researchReferences.split(',').map(s => s.trim()).filter(Boolean) : [],
        communityContacts: data.communityContacts ? { description: data.communityContacts } : null,
      };
      
      const res = await apiRequest("POST", "/api/languages", processedData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
      toast({
        title: "Language Added!",
        description: "The language has been successfully added to the platform.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Database seeding mutation
  const seedDatabaseMutation = useMutation({
    mutationFn: async (params: { count: number; regions: string[]; threatLevels: string[] }) => {
      const res = await apiRequest("POST", "/api/admin/seed-languages", params);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/database-summary"] });
      toast({
        title: "Database Seeding Complete!",
        description: `Created ${data.results.created} languages, skipped ${data.results.skipped} duplicates.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Seeding Failed",
        description: "Failed to seed database. Please try again.",
        variant: "destructive",
      });
      console.error("Error seeding database:", error);
    },
  });

  // Delete language mutation
  const deleteLanguageMutation = useMutation({
    mutationFn: async (languageId: string) => {
      const res = await apiRequest("DELETE", `/api/languages/${languageId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
      toast({
        title: "Language Deleted",
        description: "The language has been removed from the platform.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Seed sample languages
  const seedSampleLanguages = () => {
    const sampleLanguages = [
      {
        name: "Ainu",
        nativeName: "アイヌ・イタㇰ",
        region: "East Asia",
        country: "Japan",
        speakers: 10,
        threatLevel: "critically_endangered",
        family: "Ainu",
        description: "Indigenous language of the Ainu people of northern Japan.",
        writingSystems: "Latin, Katakana",
        phoneticFeatures: "Rich consonant clusters, vowel harmony",
        culturalSignificance: "Central to Ainu spiritual practices and oral traditions",
        documentationStatus: "partially_documented",
      },
      {
        name: "Hawaiian",
        nativeName: "ʻŌlelo Hawaiʻi",
        region: "Oceania",
        country: "United States",
        speakers: 24000,
        threatLevel: "vulnerable",
        family: "Austronesian",
        description: "Native language of the Hawaiian Islands.",
        writingSystems: "Latin",
        phoneticFeatures: "13 letters, rich vowel system",
        culturalSignificance: "Essential for traditional chants, navigation, and cultural identity",
        documentationStatus: "well_documented",
      },
      {
        name: "Cherokee",
        nativeName: "ᏣᎳᎩ ᎦᏬᏂᎯᏍᏗ",
        region: "North America",
        country: "United States",
        speakers: 2000,
        threatLevel: "endangered",
        family: "Iroquoian",
        description: "Native American language of the Cherokee people.",
        writingSystems: "Cherokee syllabary, Latin",
        phoneticFeatures: "Syllabic writing system, complex verb morphology",
        culturalSignificance: "Preserves traditional stories, medicine, and governance",
        documentationStatus: "well_documented",
      },
    ];

    sampleLanguages.forEach((lang) => {
      createLanguageMutation.mutate(lang as LanguageFormData);
    });
  };

  const onSubmit = (data: LanguageFormData) => {
    createLanguageMutation.mutate(data);
  };

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: 'hsl(35 40% 96%)' }}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(25 20% 25%)' }}>
            Language Administration
          </h1>
          <p className="text-lg" style={{ color: 'hsl(25 15% 45%)' }}>
            Comprehensive language documentation and preservation database
          </p>
        </div>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              AI Database Seeding
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Language Form */}
          <div className="lg:col-span-2">
            <Card className="border-2" style={{ borderColor: 'hsl(25 25% 80%)', backgroundColor: 'white' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(25 20% 25%)' }}>
                  <Plus className="h-5 w-5" />
                  Add New Language
                </CardTitle>
                <CardDescription>
                  Each language contains extensive linguistic, cultural, and historical information
                  {languages.length === 0 && (
                    <>
                      . No languages found. You can{" "}
                      <Button
                        variant="link"
                        className="h-auto p-0 text-sm"
                        onClick={seedSampleLanguages}
                        disabled={createLanguageMutation.isPending}
                      >
                        add sample languages
                      </Button>
                      {" "}to get started.
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="basic" className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Basic
                        </TabsTrigger>
                        <TabsTrigger value="linguistic" className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          Linguistic
                        </TabsTrigger>
                        <TabsTrigger value="geographic" className="flex items-center gap-1">
                          <Map className="h-3 w-3" />
                          Geographic
                        </TabsTrigger>
                        <TabsTrigger value="cultural" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Cultural
                        </TabsTrigger>
                        <TabsTrigger value="documentation" className="flex items-center gap-1">
                          <Archive className="h-3 w-3" />
                          Docs
                        </TabsTrigger>
                        <TabsTrigger value="research" className="flex items-center gap-1">
                          <Settings className="h-3 w-3" />
                          Research
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="space-y-4 mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Language Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Hawaiian" {...field} data-testid="input-language-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="nativeName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Native Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. ʻŌlelo Hawaiʻi" {...field} data-testid="input-native-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="isoCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ISO Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. haw" {...field} data-testid="input-iso-code" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="family"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Language Family</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Austronesian" {...field} data-testid="input-family" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="speakers"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Number of Speakers</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="0" {...field} data-testid="input-speakers" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="threatLevel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Threat Level *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-threat-level">
                                      <SelectValue placeholder="Select threat level" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="vulnerable">Vulnerable</SelectItem>
                                    <SelectItem value="endangered">Endangered</SelectItem>
                                    <SelectItem value="critically_endangered">Critically Endangered</SelectItem>
                                    <SelectItem value="extinct">Extinct</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Brief description of the language and its cultural significance..."
                                  {...field}
                                  data-testid="textarea-description"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <TabsContent value="linguistic" className="space-y-4 mt-6">
                        <FormField
                          control={form.control}
                          name="writingSystems"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Writing Systems</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Latin, Cyrillic, Cherokee syllabary (comma-separated)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phoneticFeatures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phonetic Features</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe key phonetic characteristics, consonants, vowels, tones..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="grammarNotes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grammar Features</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Word order, case system, verb morphology, unique grammatical features..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dialects"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dialects & Variations</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Northern dialect, Southern dialect, Island variant (comma-separated)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <TabsContent value="geographic" className="space-y-4 mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="region"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Region *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Oceania" {...field} data-testid="input-region" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. United States" {...field} data-testid="input-country" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="coordinates"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Primary Coordinates</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. 19.8968, -155.5828 (latitude, longitude)" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="speakerDemographics"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Speaker Demographics</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Mostly elderly speakers, some younger learners" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="historicalRegions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Historical Regions</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Hawaiian Islands, Polynesian Triangle (comma-separated)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <TabsContent value="cultural" className="space-y-4 mt-6">
                        <FormField
                          control={form.control}
                          name="culturalSignificance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cultural Significance</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe the role of this language in cultural identity, traditions, and community..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="historicalContext"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Historical Context</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Historical background, colonization impacts, language policies affecting it..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="ritualUses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ritual & Ceremonial Uses</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Religious ceremonies, Traditional songs, Healing practices (comma-separated)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="oralTraditions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Oral Traditions</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Creation myths, Historical narratives, Folk tales (comma-separated)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <TabsContent value="documentation" className="space-y-4 mt-6">
                        <FormField
                          control={form.control}
                          name="documentationStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Documentation Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select documentation level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="well_documented">Well Documented</SelectItem>
                                  <SelectItem value="partially_documented">Partially Documented</SelectItem>
                                  <SelectItem value="underdocumented">Underdocumented</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="revitalizationEfforts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Revitalization Efforts</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Current efforts to preserve and revitalize the language..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="educationalPrograms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Educational Programs</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Immersion schools, University courses, Community classes (comma-separated)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="audioArchiveUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Audio Archive URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="videoArchiveUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Video Archive URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="dictionaryUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Dictionary URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="research" className="space-y-4 mt-6">
                        <FormField
                          control={form.control}
                          name="researchReferences"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Research References</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Academic papers, books, studies about this language (one per line or comma-separated)"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="communityContacts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Community Contacts</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Elders, cultural leaders, community organizations working with this language..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="communityWebsite"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Community Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>

                    <Button
                      type="submit"
                      disabled={createLanguageMutation.isPending}
                      className="w-full"
                      style={{ backgroundColor: 'hsl(25 25% 50%)', color: 'white' }}
                      data-testid="button-submit-language"
                    >
                      {createLanguageMutation.isPending ? "Adding Language..." : "Add Language to Database"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Current Languages */}
          <Card className="border-2" style={{ borderColor: 'hsl(25 25% 80%)', backgroundColor: 'white' }}>
            <CardHeader>
              <CardTitle style={{ color: 'hsl(25 20% 25%)' }}>
                Current Languages ({languages.length})
              </CardTitle>
              <CardDescription>
                Languages in the database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading languages...</div>
              ) : languages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No languages added yet.{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0"
                    onClick={seedSampleLanguages}
                    disabled={createLanguageMutation.isPending}
                    data-testid="button-seed-languages"
                  >
                    Add sample languages
                  </Button>
                  {" "}to get started.
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {languages.map((language: any) => (
                    <div
                      key={language.id}
                      className="p-4 border rounded-lg space-y-2"
                      style={{ borderColor: 'hsl(25 25% 85%)' }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold" style={{ color: 'hsl(25 20% 25%)' }}>
                            {language.name}
                            {language.nativeName && (
                              <span className="text-sm font-normal ml-2" style={{ color: 'hsl(25 15% 45%)' }}>
                                ({language.nativeName})
                              </span>
                            )}
                          </h3>
                          <p className="text-sm" style={{ color: 'hsl(25 15% 45%)' }}>
                            {language.region}{language.country && `, ${language.country}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={threatLevelColors[language.threatLevel as keyof typeof threatLevelColors]}>
                            {threatLevelLabels[language.threatLevel as keyof typeof threatLevelLabels]}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteLanguageMutation.mutate(language.id)}
                            disabled={deleteLanguageMutation.isPending}
                            data-testid={`button-delete-${language.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {language.speakers > 0 && (
                        <p className="text-sm" style={{ color: 'hsl(25 15% 45%)' }}>
                          {language.speakers.toLocaleString()} speakers
                        </p>
                      )}
                      {language.description && (
                        <p className="text-sm" style={{ color: 'hsl(25 15% 45%)' }}>
                          {language.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
            </div>
          </TabsContent>

          <TabsContent value="database">
            <DatabaseSeeding />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}