import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import LessonCard from "@/components/LessonCard";
import QuizQuestion from "@/components/QuizQuestion";
import ProgressCard from "@/components/ProgressCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient } from "@/lib/queryClient";

export default function Learn() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedLanguageId, setSelectedLanguageId] = useState("");
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);

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

  const { data: progress } = useQuery({
    queryKey: ["/api/learning-progress"],
    enabled: isAuthenticated,
  });

  const { data: lessons } = useQuery({
    queryKey: ["/api/lessons", selectedLanguageId],
    queryFn: async () => {
      if (!selectedLanguageId) return [];
      const response = await fetch(`/api/lessons?languageId=${selectedLanguageId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch lessons');
      return response.json();
    },
    enabled: !!selectedLanguageId && isAuthenticated,
  });

  const { data: completions } = useQuery({
    queryKey: ["/api/lesson-completions", selectedLanguageId],
    queryFn: async () => {
      if (!selectedLanguageId) return [];
      const response = await fetch(`/api/lesson-completions?languageId=${selectedLanguageId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch completions');
      return response.json();
    },
    enabled: !!selectedLanguageId && isAuthenticated,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/learning-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learning-progress"] });
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
        description: "Failed to update progress",
        variant: "destructive",
      });
    },
  });

  const completeLessonMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/lesson-completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-completions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/learning-progress"] });
      toast({
        title: "Lesson Complete!",
        description: "Great job! Your progress has been saved.",
      });
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
        description: "Failed to complete lesson",
        variant: "destructive",
      });
    },
  });

  const handleLanguageSelect = (languageId: string) => {
    setSelectedLanguageId(languageId);
    setCurrentLesson(null);
    setShowQuiz(false);
    
    // Initialize progress for this language if it doesn't exist
    const existingProgress = Array.isArray(progress) ? progress.find((p: any) => p.languageId === languageId) : null;
    if (!existingProgress) {
      updateProgressMutation.mutate({
        languageId,
        currentLevel: "beginner",
        lessonsCompleted: 0,
        totalLessons: 10,
        streakDays: 0,
      });
    }
  };

  const handleStartLesson = (lesson: any) => {
    setCurrentLesson(lesson);
    setShowQuiz(false);
  };

  const handleStartQuiz = () => {
    setShowQuiz(true);
  };

  const handleCompleteLesson = (lessonId: string, score: number) => {
    completeLessonMutation.mutate({
      lessonId,
      score,
    });
    
    setCurrentLesson(null);
    setShowQuiz(false);
  };

  const selectedLanguage = Array.isArray(languages) ? languages.find((l: any) => l.id === selectedLanguageId) : null;
  const currentProgress = Array.isArray(progress) ? progress.find((p: any) => p.languageId === selectedLanguageId) : null;

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
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Learn Languages</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Interactive lessons powered by AI with pronunciation guides, cultural context, and gamified progress tracking.
          </p>
        </div>

        {!selectedLanguageId ? (
          // Language Selection
          <Card className="max-w-2xl mx-auto" data-testid="card-language-selection">
            <CardHeader>
              <CardTitle>Choose a Language to Learn</CardTitle>
            </CardHeader>
            <CardContent>
              <Select onValueChange={handleLanguageSelect}>
                <SelectTrigger className="mb-4" data-testid="select-language">
                  <SelectValue placeholder="Select a language..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(languages) ? languages.map((language: any) => (
                    <SelectItem key={language.id} value={language.id}>
                      {language.name} - {language.region}
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
              
              <div className="text-sm text-muted-foreground text-center">
                <i className="fas fa-lightbulb mr-2"></i>
                New to language learning? We recommend starting with a language from your region.
              </div>
            </CardContent>
          </Card>
        ) : !currentLesson ? (
          // Language Overview & Lessons
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Progress Sidebar */}
            <div className="lg:col-span-1">
              <ProgressCard 
                language={selectedLanguage}
                progress={currentProgress}
                onBack={() => setSelectedLanguageId("")}
              />
            </div>
            
            {/* Lessons Grid */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Learning {selectedLanguage?.name}
                </h2>
                <p className="text-muted-foreground">
                  Progress through interactive lessons at your own pace
                </p>
              </div>
              
              {lessons && lessons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lessons.map((lesson: any, index: number) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      index={index}
                      isCompleted={completions?.some((c: any) => c.lessonId === lesson.id && c.completed)}
                      isUnlocked={index === 0 || completions?.some((c: any) => 
                        lessons[index - 1] && c.lessonId === lessons[index - 1].id && c.completed
                      )}
                      onStart={() => handleStartLesson(lesson)}
                    />
                  ))}
                </div>
              ) : (
                <Card className="text-center p-12" data-testid="card-no-lessons">
                  <CardContent>
                    <i className="fas fa-book text-4xl text-muted-foreground mb-4"></i>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No lessons available</h3>
                    <p className="text-muted-foreground mb-4">
                      Lessons for this language are being prepared. Check back soon!
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedLanguageId("")}
                      data-testid="button-choose-another"
                    >
                      Choose Another Language
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : showQuiz ? (
          // Quiz Interface
          <div className="max-w-4xl mx-auto">
            <QuizQuestion
              lesson={currentLesson}
              onComplete={(score) => handleCompleteLesson(currentLesson.id, score)}
              onBack={() => setShowQuiz(false)}
            />
          </div>
        ) : (
          // Lesson Content
          <div className="max-w-4xl mx-auto">
            <Card data-testid="card-lesson-content">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle>{currentLesson.title}</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentLesson(null)}
                    data-testid="button-back-to-lessons"
                  >
                    <i className="fas fa-arrow-left mr-2"></i>
                    Back to Lessons
                  </Button>
                </div>
                <Progress value={50} className="w-full" />
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none mb-8">
                  <p className="text-lg text-muted-foreground mb-6">
                    {currentLesson.description}
                  </p>
                  
                  {/* Lesson Content */}
                  <div className="bg-card rounded-lg p-6 mb-6">
                    <h3 className="text-xl font-semibold mb-4">Lesson Content</h3>
                    {currentLesson.content && typeof currentLesson.content === 'object' ? (
                      <div className="space-y-4">
                        {currentLesson.content.phrases?.map((phrase: any, index: number) => (
                          <div key={index} className="border-l-4 border-primary pl-4">
                            <div className="font-semibold text-lg">{phrase.original}</div>
                            <div className="text-muted-foreground">{phrase.phonetic}</div>
                            <div className="text-sm">{phrase.translation}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>Interactive lesson content will be displayed here.</p>
                    )}
                  </div>

                  {/* Cultural Context */}
                  <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                    <div className="flex items-start space-x-3">
                      <i className="fas fa-lightbulb text-accent mt-1"></i>
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Cultural Context</h4>
                        <p className="text-sm text-muted-foreground">
                          This lesson introduces fundamental concepts that are essential for understanding 
                          the cultural context of the language.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentLesson(null)}
                    data-testid="button-skip"
                  >
                    Skip for Now
                  </Button>
                  <Button 
                    onClick={handleStartQuiz}
                    data-testid="button-start-quiz"
                  >
                    Start Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
