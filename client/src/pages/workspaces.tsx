import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { ExternalLink, Users, FileText, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface TaskadeProject {
  id: string;
  languageId: string;
  taskadeProjectId: string;
  taskadeProjectUrl: string;
  createdBy: string;
  createdAt: string;
}

interface LanguageWithWorkspace {
  id: string;
  name: string;
  nativeName: string;
  region: string;
  threatLevel: string;
  taskadeProject: TaskadeProject | null;
}

export default function Workspaces() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
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

  const { data: languages, isLoading } = useQuery<LanguageWithWorkspace[]>({
    queryKey: ["/api/languages/with-workspaces"],
    enabled: isAuthenticated,
  });

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'extinct': return 'bg-gray-500';
      case 'critically_endangered': return 'bg-red-500';
      case 'severely_endangered': return 'bg-orange-500';
      case 'definitely_endangered': return 'bg-yellow-500';
      case 'vulnerable': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getThreatLevelLabel = (level: string) => {
    return level.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  const languagesWithWorkspaces = languages?.filter(lang => lang.taskadeProject) || [];
  const languagesWithoutWorkspaces = languages?.filter(lang => !lang.taskadeProject) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Preservation Workspaces
          </h1>
          <p className="text-lg text-muted-foreground">
            Collaborative Taskade workspaces for coordinating language preservation efforts. 
            Join teams working to document and preserve endangered languages.
          </p>
        </div>

        {/* Active Workspaces */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Active Workspaces ({languagesWithWorkspaces.length})
          </h2>
          
          {languagesWithWorkspaces.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No active workspaces yet. Visit a language page to create one!
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {languagesWithWorkspaces.map((language) => (
                <Card key={language.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-xl">
                        {language.name}
                      </CardTitle>
                      <Badge className={`${getThreatLevelColor(language.threatLevel)} text-white`}>
                        {getThreatLevelLabel(language.threatLevel)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {language.nativeName && (
                        <span className="block text-sm mb-1">{language.nativeName}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {language.region}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>Documentation tasks and resources</span>
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={() => window.open(language.taskadeProject?.taskadeProjectUrl, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Workspace
                      </Button>
                      
                      <p className="text-xs text-muted-foreground text-center">
                        Created {new Date(language.taskadeProject?.createdAt || '').toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Languages Without Workspaces */}
        {languagesWithoutWorkspaces.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-muted-foreground" />
              Languages Needing Workspaces ({languagesWithoutWorkspaces.length})
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {languagesWithoutWorkspaces.map((language) => (
                <Card key={language.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">{language.name}</h3>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getThreatLevelColor(language.threatLevel)} bg-opacity-10`}
                      >
                        {getThreatLevelLabel(language.threatLevel)}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => window.location.href = `/languages/${language.id}`}
                      >
                        Create Workspace
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}