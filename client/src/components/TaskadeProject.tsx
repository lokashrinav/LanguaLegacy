import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Users, FileText, Target } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TaskadeProjectProps {
  languageId: string;
  languageName: string;
  region: string;
  threatLevel: string;
}

interface TaskadeProjectResponse {
  id: string;
  languageId: string;
  taskadeProjectId: string;
  taskadeProjectUrl: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function TaskadeProjectCard({ 
  languageId, 
  languageName,
  region,
  threatLevel 
}: TaskadeProjectProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const { data: project, isLoading } = useQuery<TaskadeProjectResponse | null>({
    queryKey: [`/api/languages/${languageId}/taskade-project`],
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/languages/${languageId}/taskade-project`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/languages/${languageId}/taskade-project`] 
      });
      toast({
        title: "Success",
        description: "Taskade preservation project created successfully!",
      });
      setIsCreating(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create Taskade project",
        variant: "destructive",
      });
      setIsCreating(false);
    },
  });

  const handleCreateProject = () => {
    setIsCreating(true);
    createProjectMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Language Preservation Project
          </CardTitle>
          <CardDescription>
            Create a collaborative Taskade workspace to coordinate preservation efforts for {languageName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium">What you'll get:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Target className="h-3 w-3" />
                  Pre-configured preservation tasks and milestones
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  Collaborative workspace for team coordination
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  Documentation templates and guidelines
                </li>
              </ul>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Language:</strong> {languageName}</p>
              <p><strong>Region:</strong> {region}</p>
              <p><strong>Threat Level:</strong> <span className={
                threatLevel === 'critical' ? 'text-red-600 font-medium' :
                threatLevel === 'severe' ? 'text-orange-600 font-medium' :
                threatLevel === 'vulnerable' ? 'text-yellow-600 font-medium' :
                'text-green-600 font-medium'
              }>{threatLevel}</span></p>
            </div>

            <Button 
              onClick={handleCreateProject}
              disabled={isCreating || createProjectMutation.isPending}
              className="w-full"
              data-testid="button-create-taskade-project"
            >
              {isCreating || createProjectMutation.isPending ? (
                "Creating Workspace..."
              ) : (
                "Create Preservation Workspace"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Active Preservation Project
        </CardTitle>
        <CardDescription>
          Collaborative workspace for coordinating {languageName} preservation efforts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-primary/5 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Your Taskade workspace is ready! Join the collaborative effort to document and preserve {languageName}.
            </p>
            <Button 
              asChild
              className="w-full"
              data-testid="button-open-taskade-project"
            >
              <a 
                href={project.taskadeProjectUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Taskade Workspace
              </a>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Created: {new Date(project.createdAt).toLocaleDateString()}</p>
            <p className="mt-1">Project ID: {project.taskadeProjectId}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}