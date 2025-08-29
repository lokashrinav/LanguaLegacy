import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

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

  const { data: userStats, isLoading: statsLoading } = useQuery<{
    totalContributions: number;
    audioContributions: number;
    translations: number;
    lessonsCompleted: number;
    currentStreak: number;
    languages: string[];
  }>({
    queryKey: ["/api/user/stats"],
    enabled: isAuthenticated,
  });

  const { data: contributionStats, isLoading: contributionStatsLoading } = useQuery<{
    total: number;
    audioContributions: number;
    translations: number;
    approved: number;
  }>({
    queryKey: ["/api/user/contributions/stats"],
    enabled: isAuthenticated,
  });

  const { data: recentContributions, isLoading: contributionsLoading } = useQuery<any[]>({
    queryKey: ["/api/contributions", user?.id, { limit: 5 }],
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: learningProgress, isLoading: progressLoading } = useQuery<any[]>({
    queryKey: ["/api/learning-progress"],
    enabled: isAuthenticated,
  });

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
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Your Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Track your learning progress and contributions to language preservation.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Overview */}
          <div className="lg:col-span-1">
            <Card className="mb-6" data-testid="card-impact-stats">
              <CardHeader>
                <CardTitle>Your Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <i className="fas fa-microphone text-primary text-sm"></i>
                      </div>
                      <span className="text-sm text-foreground">Audio Contributions</span>
                    </div>
                    <span className="font-semibold text-primary" data-testid="stat-audio-contributions">
                      {contributionStatsLoading ? '...' : contributionStats?.audioContributions || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                        <i className="fas fa-language text-accent text-sm"></i>
                      </div>
                      <span className="text-sm text-foreground">Translations</span>
                    </div>
                    <span className="font-semibold text-accent" data-testid="stat-translations">
                      {contributionStatsLoading ? '...' : contributionStats?.translations || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-secondary/50 rounded-full flex items-center justify-center">
                        <i className="fas fa-graduation-cap text-foreground text-sm"></i>
                      </div>
                      <span className="text-sm text-foreground">Lessons Completed</span>
                    </div>
                    <span className="font-semibold text-foreground" data-testid="stat-lessons-completed">
                      {statsLoading ? '...' : userStats?.lessonsCompleted || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <i className="fas fa-fire text-primary text-sm"></i>
                      </div>
                      <span className="text-sm text-foreground">Current Streak</span>
                    </div>
                    <span className="font-semibold text-primary" data-testid="stat-current-streak">
                      {statsLoading ? '...' : userStats?.currentStreak || 0} days
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card data-testid="card-achievement-badges">
              <CardHeader>
                <CardTitle>Achievement Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      (userStats?.totalContributions || 0) > 0 ? 'bg-accent' : 'bg-muted'
                    }`}>
                      <i className={`fas fa-microphone ${
                        (userStats?.totalContributions || 0) > 0 ? 'text-accent-foreground' : 'text-muted-foreground'
                      }`}></i>
                    </div>
                    <div className="text-xs text-muted-foreground">First Recording</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      (userStats?.currentStreak || 0) >= 7 ? 'bg-primary' : 'bg-muted'
                    }`}>
                      <i className={`fas fa-fire ${
                        (userStats?.currentStreak || 0) >= 7 ? 'text-primary-foreground' : 'text-muted-foreground'
                      }`}></i>
                    </div>
                    <div className="text-xs text-muted-foreground">Week Streak</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                      <i className="fas fa-star text-muted-foreground"></i>
                    </div>
                    <div className="text-xs text-muted-foreground">Coming Soon</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card data-testid="card-recent-activity">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="default" data-testid="filter-all">All</Button>
                    <Button size="sm" variant="ghost" data-testid="filter-learning">Learning</Button>
                    <Button size="sm" variant="ghost" data-testid="filter-contributing">Contributing</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {contributionsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-start space-x-4 p-4 bg-background rounded-lg animate-pulse">
                        <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentContributions && recentContributions.length > 0 ? (
                  <div className="space-y-4">
                    {recentContributions.map((contribution: any) => (
                      <div key={contribution.id} className="flex items-start space-x-4 p-4 bg-background rounded-lg" data-testid={`activity-${contribution.id}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          contribution.type === 'audio' ? 'bg-primary/10' :
                          contribution.type === 'text' ? 'bg-accent/10' :
                          'bg-secondary/50'
                        }`}>
                          <i className={`fas ${
                            contribution.type === 'audio' ? 'fa-microphone text-primary' :
                            contribution.type === 'text' ? 'fa-language text-accent' :
                            'fa-globe text-foreground'
                          }`}></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-foreground">
                              {contribution.type === 'audio' ? 'Added audio recording' :
                               contribution.type === 'text' ? 'Added translation' :
                               'Added cultural context'}
                            </h4>
                            <span className="text-sm text-muted-foreground">
                              {new Date(contribution.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {contribution.originalText ? 
                              `"${contribution.originalText.slice(0, 100)}${contribution.originalText.length > 100 ? '...' : ''}"` :
                              contribution.translation ?
                              `Translation: "${contribution.translation.slice(0, 100)}${contribution.translation.length > 100 ? '...' : ''}"` :
                              'Cultural context contribution'
                            }
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {contribution.category?.replace('_', ' ') || 'General'}
                            </Badge>
                            {contribution.approved && (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Approved
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12" data-testid="no-activity">
                    <i className="fas fa-clock text-4xl text-muted-foreground mb-4"></i>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No recent activity</h3>
                    <p className="text-muted-foreground mb-4">
                      Start learning or contributing to see your activity here
                    </p>
                    <div className="flex justify-center space-x-4">
                      <Link to="/learn">
                        <Button data-testid="button-start-learning">Start Learning</Button>
                      </Link>
                      <Link to="/contribute">
                        <Button variant="secondary" data-testid="button-contribute">Contribute</Button>
                      </Link>
                    </div>
                  </div>
                )}
                
                {recentContributions && recentContributions.length > 0 && (
                  <div className="text-center mt-6">
                    <Button variant="ghost" data-testid="button-view-all-activity">
                      View All Activity
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Learning Progress Section */}
        {learningProgress && learningProgress.length > 0 && (
          <div className="mt-8">
            <Card data-testid="card-learning-progress">
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {learningProgress.map((progress: any) => (
                    <div key={progress.id} className="p-4 bg-background rounded-lg border border-border" data-testid={`progress-${progress.languageId}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground">Language Progress</h4>
                        <Badge variant="secondary">{progress.currentLevel}</Badge>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Lessons</span>
                          <span className="font-medium">{progress.lessonsCompleted}/{progress.totalLessons}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="progress-bar"
                            style={{ width: `${(progress.lessonsCompleted / progress.totalLessons) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Streak: {progress.streakDays} days</span>
                        <Link to="/learn">
                          <Button size="sm" data-testid={`button-continue-${progress.languageId}`}>
                            Continue
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
