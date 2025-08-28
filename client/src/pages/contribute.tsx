import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import ContributionForm from "@/components/ContributionForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertContributionSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertContributionSchema.extend({
  languageId: z.string().min(1, "Please select a language"),
  type: z.string().min(1, "Please select a contribution type"),
});

export default function Contribute() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("audio");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: languages } = useQuery({
    queryKey: ["/api/languages"],
    enabled: isAuthenticated,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      languageId: "",
      type: activeTab,
      originalText: "",
      phoneticTranscription: "",
      translation: "",
      usageContext: "",
      culturalSignificance: "",
      grammarPattern: "",
      grammarExplanation: "",
      difficultyLevel: "beginner",
      category: "daily_conversation",
      audioUrl: "",
      imageUrl: "",
    },
  });

  const submitContribution = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your contribution has been submitted for review.",
      });
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to submit contribution. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    submitContribution.mutate(data);
  };

  // Update form type when tab changes
  useEffect(() => {
    form.setValue("type", activeTab);
  }, [activeTab, form]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Contribute Content</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Help preserve languages by contributing audio recordings, translations, cultural context, and educational materials.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card className="contribution-form">
            <CardHeader>
              <CardTitle>Make a Contribution</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Language and Type Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="languageId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Language</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-language">
                                <SelectValue placeholder="Choose a language..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {languages?.map((language: any) => (
                                <SelectItem key={language.id} value={language.id}>
                                  {language.name} - {language.region}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily_conversation">Daily Conversation</SelectItem>
                              <SelectItem value="ceremonial">Ceremonial/Ritual</SelectItem>
                              <SelectItem value="storytelling">Storytelling</SelectItem>
                              <SelectItem value="educational">Educational</SelectItem>
                              <SelectItem value="songs">Songs/Music</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Contribution Type Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="audio" data-testid="tab-audio">Audio</TabsTrigger>
                      <TabsTrigger value="text" data-testid="tab-text">Text</TabsTrigger>
                      <TabsTrigger value="cultural_context" data-testid="tab-cultural">Cultural</TabsTrigger>
                      <TabsTrigger value="grammar" data-testid="tab-grammar">Grammar</TabsTrigger>
                    </TabsList>

                    {/* Audio Recording Tab */}
                    <TabsContent value="audio" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="originalText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Original Text</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter the text in the original language..." 
                                  className="h-24"
                                  data-testid="textarea-original-text"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phoneticTranscription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phonetic Transcription</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter phonetic pronunciation guide..." 
                                  className="h-24"
                                  data-testid="textarea-phonetic"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="audioUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Audio Recording</FormLabel>
                            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                              <div className="flex flex-col items-center space-y-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                  <i className="fas fa-microphone text-2xl text-primary"></i>
                                </div>
                                <div>
                                  <p className="text-foreground font-medium">Record or Upload Audio</p>
                                  <p className="text-sm text-muted-foreground">Click to start recording or drag & drop audio files</p>
                                </div>
                                <div className="flex space-x-3">
                                  <Button 
                                    type="button" 
                                    className="bg-primary text-primary-foreground"
                                    data-testid="button-record"
                                  >
                                    <i className="fas fa-record-vinyl mr-2"></i>Start Recording
                                  </Button>
                                  <Button 
                                    type="button" 
                                    variant="outline"
                                    data-testid="button-upload-audio"
                                  >
                                    <i className="fas fa-upload mr-2"></i>Upload File
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <FormControl>
                              <Input 
                                type="hidden"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* Text & Translation Tab */}
                    <TabsContent value="text" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="translation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>English Translation</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter the English translation..." 
                                  className="h-24"
                                  data-testid="textarea-translation"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="usageContext"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Usage Context</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Explain when and how this phrase is used..." 
                                  className="h-24"
                                  data-testid="textarea-usage-context"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    {/* Cultural Context Tab */}
                    <TabsContent value="cultural_context" className="space-y-6">
                      <FormField
                        control={form.control}
                        name="culturalSignificance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cultural Significance</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the cultural importance, traditions, or stories related to this content..." 
                                className="h-32"
                                data-testid="textarea-cultural-significance"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="difficultyLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty Level</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-difficulty">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                                <SelectItem value="expert">Expert</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* Grammar Tab */}
                    <TabsContent value="grammar" className="space-y-6">
                      <FormField
                        control={form.control}
                        name="grammarPattern"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grammar Pattern</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Subject-Object-Verb, Agglutinative morphology..." 
                                data-testid="input-grammar-pattern"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="grammarExplanation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grammar Explanation</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Explain the grammatical structure and rules..." 
                                className="h-24"
                                data-testid="textarea-grammar-explanation"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>

                  {/* Submit Section */}
                  <div className="flex justify-between items-center pt-6 border-t border-border">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <i className="fas fa-info-circle"></i>
                      <span>Contributions will be reviewed by community moderators</span>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => form.reset()}
                        data-testid="button-clear-form"
                      >
                        Clear Form
                      </Button>
                      <Button 
                        type="submit"
                        disabled={submitContribution.isPending}
                        data-testid="button-submit-contribution"
                      >
                        {submitContribution.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check mr-2"></i>
                            Submit Contribution
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
