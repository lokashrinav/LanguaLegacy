import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Language {
  id: string;
  name: string;
  region: string;
}

interface LearningProgress {
  id: string;
  languageId: string;
  currentLevel: string;
  lessonsCompleted: number;
  totalLessons: number;
  streakDays: number;
  lastActivityAt: string;
}

interface ProgressCardProps {
  language?: Language;
  progress?: LearningProgress;
  onBack: () => void;
}

export default function ProgressCard({ language, progress, onBack }: ProgressCardProps) {
  const getProgressPercentage = () => {
    if (!progress) return 0;
    return Math.round((progress.lessonsCompleted / progress.totalLessons) * 100);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const mockLessons = [
    { id: 1, title: "Basic Greetings", completed: true },
    { id: 2, title: "Family Words", completed: true },
    { id: 3, title: "Numbers", completed: false, current: true },
    { id: 4, title: "Colors", completed: false },
    { id: 5, title: "Animals", completed: false },
  ];

  return (
    <Card className="sticky top-24" data-testid="progress-card">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBack}
            data-testid="button-back-to-languages"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Change Language
          </Button>
        </div>
        <div className="text-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fas fa-user text-2xl text-primary-foreground"></i>
          </div>
          <CardTitle className="text-lg" data-testid="learning-language-name" style={{color: 'var(--text-black)'}}>
            Learning {language?.name || 'Language'}
          </CardTitle>
          {progress && (
            <Badge className={getLevelColor(progress.currentLevel)} data-testid="learning-level">
              {progress.currentLevel} Level
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {progress && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium" style={{color: 'var(--text-black)'}}>Progress</span>
              <span className="text-sm text-muted-foreground" data-testid="progress-text">
                {progress.lessonsCompleted}/{progress.totalLessons} lessons
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="w-full" data-testid="progress-bar" />
            <div className="text-center mt-2">
              <span className="text-sm text-muted-foreground">{getProgressPercentage()}% Complete</span>
            </div>
          </div>
        )}
        
        <div className="space-y-3 mb-6">
          <h4 className="font-medium" style={{color: 'var(--text-black)'}}>Recent Lessons</h4>
          {mockLessons.map((lesson) => (
            <div 
              key={lesson.id}
              className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${
                lesson.completed 
                  ? 'bg-primary/10 border-primary' 
                  : lesson.current 
                  ? 'bg-accent/10 border-accent'
                  : 'bg-muted/50 border-muted'
              }`}
              data-testid={`lesson-progress-${lesson.id}`}
            >
              <div className="flex items-center space-x-3">
                <i className={`fas ${
                  lesson.completed 
                    ? 'fa-circle-check text-primary' 
                    : lesson.current 
                    ? 'fa-play-circle text-accent'
                    : 'fa-lock text-muted-foreground'
                }`}></i>
                <span className={`text-sm font-medium ${
                  lesson.completed || lesson.current ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {lesson.title}
                </span>
              </div>
              {lesson.completed && (
                <i className="fas fa-star text-accent" data-testid={`lesson-star-${lesson.id}`}></i>
              )}
              {lesson.current && (
                <Badge variant="secondary" className="text-xs" data-testid="current-lesson-badge">
                  Current
                </Badge>
              )}
            </div>
          ))}
        </div>
        
        {progress && (
          <div className="pt-6 border-t border-border">
            <div className="text-center">
              <div className="text-lg font-bold text-primary" data-testid="streak-days">
                {progress.streakDays}
              </div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
              {progress.streakDays > 0 && (
                <div className="flex justify-center mt-2">
                  <i className="fas fa-fire text-orange-500"></i>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
