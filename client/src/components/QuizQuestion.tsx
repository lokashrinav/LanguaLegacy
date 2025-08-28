import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Lesson {
  id: string;
  title: string;
  content?: any;
}

interface QuizQuestionProps {
  lesson: Lesson;
  onComplete: (score: number) => void;
  onBack: () => void;
}

// Mock quiz data - in a real app this would come from the lesson content or API
const generateQuizQuestions = (lesson: Lesson) => {
  return [
    {
      id: 1,
      question: `What does this phrase mean in English?`,
      phrase: "ᎣᏏᏲ",
      phonetic: "o-si-yo",
      options: [
        "Hello",
        "Thank you", 
        "Goodbye",
        "Please"
      ],
      correctAnswer: 0,
      explanation: "ᎣᏏᏲ (o-si-yo) is a traditional Cherokee greeting meaning 'hello'."
    },
    {
      id: 2,
      question: "How would you pronounce this word?",
      phrase: "ᏩᏙ",
      options: [
        "wa-do",
        "wo-do", 
        "wa-to",
        "wo-to"
      ],
      correctAnswer: 0,
      explanation: "ᏩᏙ is pronounced 'wa-do' and means 'thank you' in Cherokee."
    },
    {
      id: 3,
      question: "What is the cultural significance of traditional greetings?",
      options: [
        "They show respect and acknowledgment of the other person",
        "They are only used in formal situations",
        "They replace modern greetings entirely",
        "They are only for elders"
      ],
      correctAnswer: 0,
      explanation: "Traditional greetings in indigenous languages often carry deep cultural meaning and show respect for the person and the language itself."
    }
  ];
};

export default function QuizQuestion({ lesson, onComplete, onBack }: QuizQuestionProps) {
  const [questions] = useState(() => generateQuizQuestions(lesson));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (optionIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(optionIndex);
    setIsAnswered(true);
    
    if (optionIndex === currentQuestion.correctAnswer) {
      setCorrectAnswers(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      // Quiz completed
      const score = Math.round((correctAnswers / questions.length) * 100);
      onComplete(score);
    }
  };

  const getOptionClass = (optionIndex: number) => {
    if (!isAnswered) {
      return "quiz-option p-4 border-2 border-border rounded-lg text-left hover:border-accent";
    }
    
    if (optionIndex === currentQuestion.correctAnswer) {
      return "quiz-option correct p-4 border-2 border-green-500 bg-green-500 text-white rounded-lg text-left";
    }
    
    if (optionIndex === selectedAnswer && optionIndex !== currentQuestion.correctAnswer) {
      return "quiz-option incorrect p-4 border-2 border-destructive bg-destructive text-destructive-foreground rounded-lg text-left";
    }
    
    return "quiz-option p-4 border-2 border-border rounded-lg text-left opacity-50";
  };

  return (
    <Card data-testid="quiz-question-card">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Quiz: {lesson.title}</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBack}
            data-testid="button-back-to-lesson"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{correctAnswers} correct</span>
          </div>
          <Progress value={progress} className="w-full" data-testid="quiz-progress" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-8">
          <h3 className="text-lg font-medium text-foreground mb-4" data-testid="question-text">
            {currentQuestion.question}
          </h3>
          
          {currentQuestion.phrase && (
            <div className="bg-accent/10 rounded-lg p-4 mb-6 text-center border border-accent/20">
              <div className="text-2xl font-semibold mb-2" data-testid="question-phrase">
                {currentQuestion.phrase}
              </div>
              {currentQuestion.phonetic && (
                <div className="text-sm text-muted-foreground" data-testid="question-phonetic">
                  [{currentQuestion.phonetic}]
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={getOptionClass(index)}
                disabled={isAnswered}
                data-testid={`option-${index}`}
              >
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </div>
              </button>
            ))}
          </div>
          
          {isAnswered && (
            <div className="mt-6 p-4 bg-background rounded-lg border border-border">
              <div className="flex items-start space-x-3">
                <i className={`fas ${
                  selectedAnswer === currentQuestion.correctAnswer 
                    ? 'fa-check-circle text-green-500' 
                    : 'fa-times-circle text-destructive'
                } mt-1`}></i>
                <div>
                  <h4 className="font-medium text-foreground mb-1">
                    {selectedAnswer === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
                  </h4>
                  <p className="text-sm text-muted-foreground" data-testid="question-explanation">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={onBack}
            data-testid="button-skip-quiz"
          >
            Skip Quiz
          </Button>
          <Button 
            onClick={handleNext}
            disabled={!isAnswered}
            data-testid="button-next-question"
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Quiz'}
            <i className="fas fa-arrow-right ml-2"></i>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
