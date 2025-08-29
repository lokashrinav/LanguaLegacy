import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Bot, Settings, Mic, BookOpen, TrendingUp } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  
  const { data: userStats, isLoading: statsLoading } = useQuery<{
    totalContributions: number;
    audioContributions: number;
    translations: number;
    lessonsCompleted: number;
    currentStreak: number;
    languages: string[];
  }>({
    queryKey: ["/api/user/stats"],
  });

  const { data: recentLanguages, isLoading: languagesLoading } = useQuery<any[]>({
    queryKey: ["/api/languages"],
    enabled: true,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Welcome Section */}
      <section className="py-12 bg-gradient-to-br from-background to-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
            </h1>
            <p className="text-lg text-muted-foreground">
              Continue your journey in preserving the world's languages
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card data-testid="stat-contributions">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {statsLoading ? '...' : userStats?.totalContributions || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Contributions</div>
                </div>
              </CardContent>
            </Card>
            
            <Card data-testid="stat-lessons">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">
                    {statsLoading ? '...' : userStats?.lessonsCompleted || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Lessons Completed</div>
                </div>
              </CardContent>
            </Card>
            
            <Card data-testid="stat-streak">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {statsLoading ? '...' : userStats?.currentStreak || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
              </CardContent>
            </Card>
            
            <Card data-testid="stat-languages">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">
                    {statsLoading ? '...' : userStats?.languages?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Languages Learning</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/learn" className="w-full">
              <Card className="border-2 hover:shadow-lg transition-all cursor-pointer group bg-white" 
                    style={{borderColor: 'hsl(25 25% 80%)'}}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-lg group-hover:scale-110 transition-transform" 
                         style={{backgroundColor: 'hsl(25 30% 90%)'}}>
                      <BookOpen className="h-6 w-6" style={{color: 'hsl(25 25% 50%)'}} />
                    </div>
                    <div>
                      <CardTitle className="text-lg" style={{color: 'hsl(25 20% 25%)'}}>
                        Continue Learning
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Resume your language lessons
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Card className="hover:shadow-lg transition-shadow" data-testid="card-contribute">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-microphone text-accent mr-2"></i>
                  Contribute Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Help preserve languages by adding audio and translations
                </p>
                <Link to="/contribute">
                  <Button variant="secondary" className="w-full" data-testid="button-contribute">
                    Start Contributing
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow" data-testid="card-discover">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-search text-primary mr-2"></i>
                  Discover Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Explore endangered languages from around the world
                </p>
                <Link to="/discover">
                  <Button variant="outline" className="w-full" data-testid="button-discover">
                    Explore Languages
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Languages */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">Featured Languages</h2>
            <Link to="/discover">
              <Button variant="outline" data-testid="button-view-all">
                View All
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {languagesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse" data-testid={`skeleton-${i}`}>
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              recentLanguages?.slice(0, 3).map((language: any) => (
                <Card key={language.id} className="hover:shadow-lg transition-shadow" data-testid={`language-${language.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{language.name}</h3>
                        <p className="text-sm text-muted-foreground">{language.region}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        language.threatLevel === 'critically_endangered' 
                          ? 'bg-destructive text-destructive-foreground'
                          : language.threatLevel === 'endangered'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {language.threatLevel?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Speakers:</span>
                        <span className="font-medium">{language.speakers?.toLocaleString() || 'Unknown'}</span>
                      </div>
                      {language.family && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Family:</span>
                          <span className="font-medium">{language.family}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Link to="/learn" className="flex-1">
                        <Button size="sm" className="w-full" data-testid={`button-learn-${language.id}`}>
                          Learn
                        </Button>
                      </Link>
                      <Link to="/contribute" className="flex-1">
                        <Button variant="secondary" size="sm" className="w-full" data-testid={`button-contribute-${language.id}`}>
                          Contribute
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
