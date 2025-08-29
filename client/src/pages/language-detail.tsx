import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { Link } from "wouter";
import { ArrowLeft, BookOpen, Mic, Users, Globe } from "lucide-react";

export default function LanguageDetail() {
  const { id } = useParams();
  
  const { data: language, isLoading, error } = useQuery<any>({
    queryKey: ["/api/languages", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-muted rounded w-3/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !language) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Language Not Found</h1>
            <p className="text-muted-foreground mb-6">The language you're looking for doesn't exist.</p>
            <Link to="/discover">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Discover
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critically_endangered':
        return 'bg-destructive text-destructive-foreground';
      case 'endangered':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'vulnerable':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'extinct':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatThreatLevel = (level: string) => {
    return level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <Link to="/discover">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Discover
          </Button>
        </Link>

        {/* Language Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2" data-testid="language-name">
                {language.name}
              </h1>
              {language.nativeName && language.nativeName !== language.name && (
                <p className="text-xl text-muted-foreground italic mb-2" data-testid="native-name">
                  {language.nativeName}
                </p>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span data-testid="location">
                  {language.region}{language.country && `, ${language.country}`}
                </span>
              </div>
            </div>
            <Badge 
              className={`${getThreatLevelColor(language.threatLevel)} text-sm font-medium`}
              data-testid="threat-level"
            >
              {formatThreatLevel(language.threatLevel)}
            </Badge>
          </div>

          {language.description && (
            <p className="text-lg text-muted-foreground leading-relaxed" data-testid="description">
              {language.description}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link to="/learn" className="w-full">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Start Learning</h3>
                    <p className="text-sm text-muted-foreground">Begin your journey with this language</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/contribute" className="w-full">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-accent/10">
                    <Mic className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Contribute</h3>
                    <p className="text-sm text-muted-foreground">Help preserve this language</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Language Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Language Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Speakers:</span>
                <span className="font-medium" data-testid="speakers-count">
                  {language.speakers ? language.speakers.toLocaleString() : 'Unknown'}
                </span>
              </div>
              {language.family && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language Family:</span>
                  <span className="font-medium" data-testid="language-family">
                    {language.family}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium" data-testid="status">
                  {formatThreatLevel(language.threatLevel)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Region:</span>
                <span className="font-medium" data-testid="region">
                  {language.region}
                </span>
              </div>
              {language.country && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Country:</span>
                  <span className="font-medium" data-testid="country">
                    {language.country}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Learning Resources */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Ready to start your journey with {language.name}? Here's how you can begin:
              </p>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Learn Basic Phrases</p>
                    <p className="text-sm text-muted-foreground">Start with common greetings and expressions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Practice Pronunciation</p>
                    <p className="text-sm text-muted-foreground">Listen to native speakers and practice</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Contribute Back</p>
                    <p className="text-sm text-muted-foreground">Help preserve the language for others</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}