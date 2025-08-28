import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface Language {
  id: string;
  name: string;
  nativeName?: string;
  region: string;
  country?: string;
  speakers?: number;
  threatLevel: string;
  family?: string;
  description?: string;
}

interface LanguageCardProps {
  language: Language;
}

export default function LanguageCard({ language }: LanguageCardProps) {
  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critically_endangered':
        return 'bg-destructive text-destructive-foreground';
      case 'endangered':
        return 'bg-orange-100 text-orange-800';
      case 'vulnerable':
        return 'bg-yellow-100 text-yellow-800';
      case 'extinct':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatThreatLevel = (level: string) => {
    return level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatSpeakers = (speakers?: number) => {
    if (!speakers) return 'Unknown';
    if (speakers >= 1000000) return `${(speakers / 1000000).toFixed(1)}M`;
    if (speakers >= 1000) return `${(speakers / 1000).toFixed(1)}K`;
    return speakers.toLocaleString();
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      data-testid={`language-card-${language.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground" data-testid="language-name">
              {language.name}
            </h3>
            {language.nativeName && language.nativeName !== language.name && (
              <p className="text-sm text-muted-foreground italic" data-testid="language-native-name">
                {language.nativeName}
              </p>
            )}
            <p className="text-sm text-muted-foreground" data-testid="language-region">
              {language.region}{language.country && `, ${language.country}`}
            </p>
          </div>
          <Badge 
            className={`${getThreatLevelColor(language.threatLevel)} text-xs font-medium`}
            data-testid="language-threat-level"
          >
            {formatThreatLevel(language.threatLevel)}
          </Badge>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Speakers:</span>
            <span className="font-medium" data-testid="language-speakers">
              {formatSpeakers(language.speakers)}
            </span>
          </div>
          {language.family && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Family:</span>
              <span className="font-medium" data-testid="language-family">
                {language.family}
              </span>
            </div>
          )}
        </div>

        {language.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2" data-testid="language-description">
            {language.description}
          </p>
        )}
        
        <div className="flex space-x-2">
          <Link to="/learn" className="flex-1">
            <Button 
              size="sm" 
              className="w-full"
              data-testid={`button-learn-${language.id}`}
            >
              Learn
            </Button>
          </Link>
          <Link to="/contribute" className="flex-1">
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full"
              data-testid={`button-contribute-${language.id}`}
            >
              Contribute
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
