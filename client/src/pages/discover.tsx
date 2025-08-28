import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import LanguageCard from "@/components/LanguageCard";

export default function Discover() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [threatLevel, setThreatLevel] = useState("");

  const { data: languages, isLoading } = useQuery({
    queryKey: ["/api/languages", { search, region, threatLevel, limit: 50 }],
    enabled: true,
  });

  const regions = [
    "Africa", "Asia", "Europe", "North America", "South America", "Oceania"
  ];

  const threatLevels = [
    { value: "vulnerable", label: "Vulnerable" },
    { value: "endangered", label: "Endangered" },
    { value: "critically_endangered", label: "Critically Endangered" },
    { value: "extinct", label: "Extinct" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Discover Languages</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore endangered languages from around the world. Search by region, threat level, or number of speakers.
          </p>
        </div>
        
        {/* Search and Filter Section */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                <Input
                  type="text"
                  placeholder="Search languages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            
            <div>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger data-testid="select-region">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Regions</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={threatLevel} onValueChange={setThreatLevel}>
                <SelectTrigger data-testid="select-threat-level">
                  <SelectValue placeholder="Threat Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  {threatLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {(search || region || threatLevel) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {search && (
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  Search: {search}
                </span>
              )}
              {region && (
                <span className="bg-accent/10 text-accent px-2 py-1 rounded-full text-xs">
                  Region: {region}
                </span>
              )}
              {threatLevel && (
                <span className="bg-secondary/50 px-2 py-1 rounded-full text-xs">
                  Threat: {threatLevels.find(l => l.value === threatLevel)?.label}
                </span>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearch("");
                  setRegion("");
                  setThreatLevel("");
                }}
                data-testid="button-clear-filters"
              >
                Clear all
              </Button>
            </div>
          )}
        </Card>
        
        {/* Results Section */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {isLoading ? 'Loading...' : `${languages?.length || 0} languages found`}
          </p>
        </div>
        
        {/* Language Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse" data-testid={`skeleton-${i}`}>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-muted rounded flex-1"></div>
                    <div className="h-8 bg-muted rounded flex-1"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : languages && languages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {languages.map((language: any) => (
              <LanguageCard key={language.id} language={language} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center" data-testid="card-no-results">
            <CardContent>
              <i className="fas fa-search text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-semibold text-foreground mb-2">No languages found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or explore all languages
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearch("");
                  setRegion("");
                  setThreatLevel("");
                }}
                data-testid="button-show-all"
              >
                Show All Languages
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
