import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ContributionFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  languages?: any[];
}

export default function ContributionForm({ onSubmit, isSubmitting, languages = [] }: ContributionFormProps) {
  const [formData, setFormData] = useState({
    languageId: "",
    type: "audio",
    originalText: "",
    phoneticTranscription: "",
    translation: "",
    usageContext: "",
    culturalSignificance: "",
    grammarPattern: "",
    grammarExplanation: "",
    difficultyLevel: "beginner",
    category: "daily_conversation",
    audioUrl: "",
    imageUrl: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClear = () => {
    setFormData({
      languageId: "",
      type: "audio",
      originalText: "",
      phoneticTranscription: "",
      translation: "",
      usageContext: "",
      culturalSignificance: "",
      grammarPattern: "",
      grammarExplanation: "",
      difficultyLevel: "beginner",
      category: "daily_conversation",
      audioUrl: "",
      imageUrl: "",
    });
  };

  return (
    <Card className="contribution-form" data-testid="contribution-form">
      <CardHeader>
        <CardTitle>Make a Contribution</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Language and Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="language">Select Language</Label>
              <Select 
                value={formData.languageId} 
                onValueChange={(value) => handleInputChange("languageId", value)}
              >
                <SelectTrigger data-testid="select-language">
                  <SelectValue placeholder="Choose a language..." />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language.id} value={language.id}>
                      {language.name} - {language.region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="category">Content Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily_conversation">Daily Conversation</SelectItem>
                  <SelectItem value="ceremonial">Ceremonial/Ritual</SelectItem>
                  <SelectItem value="storytelling">Storytelling</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="songs">Songs/Music</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <i className="fas fa-language mr-2 text-primary"></i>
              Text & Translation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="originalText">Original Text</Label>
                <Textarea
                  id="originalText"
                  value={formData.originalText}
                  onChange={(e) => handleInputChange("originalText", e.target.value)}
                  placeholder="Enter the text in the original language..."
                  className="h-24"
                  data-testid="textarea-original-text"
                />
              </div>
              
              <div>
                <Label htmlFor="phoneticTranscription">Phonetic Transcription</Label>
                <Textarea
                  id="phoneticTranscription"
                  value={formData.phoneticTranscription}
                  onChange={(e) => handleInputChange("phoneticTranscription", e.target.value)}
                  placeholder="Enter phonetic pronunciation guide..."
                  className="h-24"
                  data-testid="textarea-phonetic"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="translation">English Translation</Label>
                <Textarea
                  id="translation"
                  value={formData.translation}
                  onChange={(e) => handleInputChange("translation", e.target.value)}
                  placeholder="Enter the English translation..."
                  className="h-24"
                  data-testid="textarea-translation"
                />
              </div>
              
              <div>
                <Label htmlFor="usageContext">Usage Context</Label>
                <Textarea
                  id="usageContext"
                  value={formData.usageContext}
                  onChange={(e) => handleInputChange("usageContext", e.target.value)}
                  placeholder="Explain when and how this phrase is used..."
                  className="h-24"
                  data-testid="textarea-usage-context"
                />
              </div>
            </div>
          </div>

          {/* Audio Recording Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <i className="fas fa-microphone mr-2 text-primary"></i>
              Audio Recording
            </h3>
            
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-microphone text-2xl text-primary"></i>
                </div>
                <div>
                  <p className="text-foreground font-medium">Record or Upload Audio</p>
                  <p className="text-sm text-muted-foreground">Click to start recording or drag & drop audio files</p>
                </div>
                <div className="flex space-x-3">
                  <Button 
                    type="button" 
                    className="bg-primary text-primary-foreground"
                    data-testid="button-record"
                  >
                    <i className="fas fa-record-vinyl mr-2"></i>Start Recording
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    data-testid="button-upload-audio"
                  >
                    <i className="fas fa-upload mr-2"></i>Upload File
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Cultural Context */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <i className="fas fa-globe mr-2 text-primary"></i>
              Cultural Context
            </h3>
            
            <div>
              <Label htmlFor="culturalSignificance">Cultural Significance</Label>
              <Textarea
                id="culturalSignificance"
                value={formData.culturalSignificance}
                onChange={(e) => handleInputChange("culturalSignificance", e.target.value)}
                placeholder="Describe the cultural importance, traditions, or stories related to this content..."
                className="h-32"
                data-testid="textarea-cultural-significance"
              />
            </div>
            
            <div>
              <Label htmlFor="difficultyLevel">Difficulty Level</Label>
              <Select 
                value={formData.difficultyLevel} 
                onValueChange={(value) => handleInputChange("difficultyLevel", value)}
              >
                <SelectTrigger data-testid="select-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grammar Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <i className="fas fa-book mr-2 text-primary"></i>
              Grammar & Structure
            </h3>
            
            <div>
              <Label htmlFor="grammarPattern">Grammar Pattern</Label>
              <Input
                id="grammarPattern"
                value={formData.grammarPattern}
                onChange={(e) => handleInputChange("grammarPattern", e.target.value)}
                placeholder="e.g., Subject-Object-Verb, Agglutinative morphology..."
                data-testid="input-grammar-pattern"
              />
            </div>
            
            <div>
              <Label htmlFor="grammarExplanation">Grammar Explanation</Label>
              <Textarea
                id="grammarExplanation"
                value={formData.grammarExplanation}
                onChange={(e) => handleInputChange("grammarExplanation", e.target.value)}
                placeholder="Explain the grammatical structure and rules..."
                className="h-24"
                data-testid="textarea-grammar-explanation"
              />
            </div>
          </div>

          {/* Submit Section */}
          <div className="flex justify-between items-center pt-6 border-t border-border">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <i className="fas fa-info-circle"></i>
              <span>Contributions will be reviewed by community moderators</span>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleClear}
                data-testid="button-clear-form"
              >
                Clear Form
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting || !formData.languageId}
                data-testid="button-submit-contribution"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Submit Contribution
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
