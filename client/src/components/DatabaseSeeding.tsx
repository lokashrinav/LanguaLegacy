import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Database, Sparkles, Globe, Loader2, BarChart3 } from "lucide-react";

export default function DatabaseSeeding() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [seedingCount, setSeedingCount] = useState(50);

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

  const handleSeedDatabase = () => {
    seedDatabaseMutation.mutate({
      count: seedingCount,
      regions: [],
      threatLevels: [],
    });
  };

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

  return (
    <div className="space-y-6">
      {/* Database Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Database Overview
          </CardTitle>
          <CardDescription>
            Current state of the endangered languages database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading database summary...</span>
            </div>
          ) : dbSummary ? (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {dbSummary.totalLanguages}
                  </div>
                  <div className="text-sm text-gray-600">Total Languages</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {dbSummary.recentlyAdded}
                  </div>
                  <div className="text-sm text-gray-600">Added Today</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.keys(dbSummary.byRegion).length}
                  </div>
                  <div className="text-sm text-gray-600">Regions</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {dbSummary.byThreatLevel.critically_endangered || 0}
                  </div>
                  <div className="text-sm text-gray-600">Critical</div>
                </div>
              </div>

              {/* Threat Level Distribution */}
              <div>
                <h3 className="text-lg font-semibold mb-3">By Threat Level</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(dbSummary.byThreatLevel).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <Badge className={threatLevelColors[level as keyof typeof threatLevelColors]}>
                        {threatLevelLabels[level as keyof typeof threatLevelLabels]}
                      </Badge>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regional Distribution */}
              <div>
                <h3 className="text-lg font-semibold mb-3">By Region</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(dbSummary.byRegion).map(([region, count]) => (
                    <div key={region} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{region}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No database summary available
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI-Powered Seeding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI-Powered Database Seeding
          </CardTitle>
          <CardDescription>
            Automatically populate the database with comprehensive endangered language data using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seeding Controls */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">Number of Languages to Generate</Label>
                
                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map((preset) => (
                    <Button
                      key={preset}
                      variant={seedingCount === preset ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSeedingCount(preset)}
                      data-testid={`button-preset-${preset}`}
                    >
                      {preset}
                    </Button>
                  ))}
                </div>

                {/* Slider */}
                <div className="space-y-3">
                  <Slider
                    value={[seedingCount]}
                    onValueChange={(value) => setSeedingCount(value[0])}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                    data-testid="slider-seeding-count"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>1</span>
                    <span className="font-medium text-lg text-gray-900">
                      {seedingCount} languages
                    </span>
                    <span>100</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Each language includes complete dictionaries, grammar rules, and thousands of example sentences
                </p>
              </div>

              <Button
                onClick={async () => {
                  try {
                    const response = await apiRequest('POST', '/api/admin/test-storage', {});
                    toast({
                      title: "Storage Test Successful!",
                      description: `Created test language: ${response.created?.name}`,
                    });
                  } catch (error) {
                    toast({
                      title: "Storage Test Failed",
                      description: error instanceof Error ? error.message : "Unknown error",
                      variant: "destructive",
                    });
                  }
                }}
                variant="outline"
                className="w-full mb-3"
                data-testid="button-test-storage"
              >
                🔧 Test Database Storage
              </Button>

              <Button
                onClick={handleSeedDatabase}
                disabled={seedDatabaseMutation.isPending}
                className="w-full"
                data-testid="button-seed-database"
              >
                {seedDatabaseMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating Languages...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Seed Database with AI
                  </>
                )}
              </Button>
            </div>

            {/* Info Panel */}
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">What this does:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Uses AI to generate authentic endangered language data</li>
                  <li>• Creates comprehensive profiles with cultural context</li>
                  <li>• Includes linguistic features and documentation status</li>
                  <li>• Avoids duplicates with existing database entries</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Data Sources:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• UNESCO Atlas of Endangered Languages</li>
                  <li>• Ethnologue language database</li>
                  <li>• Academic linguistic research</li>
                  <li>• Cultural preservation documentation</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          {seedDatabaseMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generating language data...</span>
                <span>This may take a minute</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}