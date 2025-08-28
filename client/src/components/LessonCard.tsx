import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Lesson {
  id: string;
  title: string;
  description?: string;
  level: string;
  order: number;
  content?: any;
}

interface LessonCardProps {
  lesson: Lesson;
  index: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  onStart: () => void;
}

export default function LessonCard({ lesson, index, isCompleted, isUnlocked, onStart }: LessonCardProps) {
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

  return (
    <Card 
      className={`lesson-card ${!isUnlocked ? 'opacity-60' : ''} ${
        isCompleted ? 'border-green-200 bg-green-50' : ''
      }`}
      data-testid={`lesson-card-${lesson.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-muted-foreground">
              Lesson {index + 1}
            </span>
            {isCompleted && (
              <i className="fas fa-check-circle text-green-500" data-testid="lesson-completed-icon"></i>
            )}
            {!isUnlocked && (
              <i className="fas fa-lock text-muted-foreground" data-testid="lesson-locked-icon"></i>
            )}
          </div>
          <Badge className={getLevelColor(lesson.level)} data-testid="lesson-level">
            {lesson.level}
          </Badge>
        </div>
        <CardTitle className="text-lg" data-testid="lesson-title">
          {lesson.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {lesson.description && (
          <p className="text-sm text-muted-foreground mb-4" data-testid="lesson-description">
            {lesson.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            {lesson.content?.duration && (
              <span data-testid="lesson-duration">
                <i className="fas fa-clock mr-1"></i>
                {lesson.content.duration} min
              </span>
            )}
            {lesson.content?.phrases && (
              <span data-testid="lesson-phrases-count">
                <i className="fas fa-comment mr-1"></i>
                {lesson.content.phrases.length} phrases
              </span>
            )}
          </div>
          
          <Button 
            size="sm"
            disabled={!isUnlocked}
            onClick={onStart}
            data-testid={`button-start-lesson-${lesson.id}`}
            className={isCompleted ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {isCompleted ? (
              <>
                <i className="fas fa-redo mr-2"></i>
                Review
              </>
            ) : !isUnlocked ? (
              <>
                <i className="fas fa-lock mr-2"></i>
                Locked
              </>
            ) : (
              <>
                <i className="fas fa-play mr-2"></i>
                Start
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
