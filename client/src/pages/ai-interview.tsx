import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Mic, 
  MicOff, 
  Send, 
  Palette, 
  Download, 
  Upload,
  Bot,
  User,
  Languages,
  Search,
  Play,
  Pause
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  type: 'text' | 'audio' | 'drawing';
  audioUrl?: string;
  drawingData?: string;
  timestamp: Date;
}

interface LanguageContext {
  id?: string;
  name: string;
  nativeName?: string;
  existingData: any;
  missingFields: string[];
  priority: 'high' | 'medium' | 'low';
}

export default function AIInterviewPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [languageContext, setLanguageContext] = useState<LanguageContext | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'language_detection' | 'contextual_interview' | 'completion'>('language_detection');
  const [limitReached, setLimitReached] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch existing languages for context
  const { data: languages = [] } = useQuery({
    queryKey: ["/api/languages"],
  });
  
  // Fetch AI interview usage
  const { data: usageData, refetch: refetchUsage } = useQuery({
    queryKey: ["/api/ai/interview/usage"],
    onSuccess: (data: any) => {
      if (!data.isAdmin && data.remaining === 0) {
        setLimitReached(true);
      }
    }
  });

  // AI conversation mutation
  const conversationMutation = useMutation({
    mutationFn: async ({ message, context }: { message: string; context?: any }) => {
      const res = await apiRequest("POST", "/api/ai/interview", {
        message,
        context: {
          languageContext,
          existingLanguages: languages,
          currentPhase,
          conversationHistory: messages.slice(-5), // Last 5 messages for context
          ...context
        }
      });
      return await res.json();
    },
    onSuccess: (response) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: response.message,
        type: 'text',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update context if provided
      if (response.languageContext) {
        setLanguageContext(response.languageContext);
      }
      
      // Update phase if provided
      if (response.phase) {
        setCurrentPhase(response.phase);
      }
      
      setIsTyping(false);
      refetchUsage(); // Update usage count after successful interview
    },
    onError: (error: any) => {
      setIsTyping(false);
      
      if (error.message?.includes('reached your AI interview limit')) {
        setLimitReached(true);
        toast({
          title: "Interview Limit Reached",
          description: "You've used all 3 of your AI interviews. Admin users have unlimited access.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Interview Error",
          description: error.message || "The AI interviewer encountered an issue. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Language detection mutation
  const detectLanguageMutation = useMutation({
    mutationFn: async (languageName: string) => {
      const res = await apiRequest("POST", "/api/ai/detect-language", {
        languageName,
        existingLanguages: languages
      });
      return await res.json();
    },
    onSuccess: (response) => {
      setLanguageContext(response.context);
      if (response.context.existingData) {
        setCurrentPhase('contextual_interview');
      }
    },
  });

  // Initialize conversation
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: '0',
        role: 'ai',
        content: `Hello! I'm your AI linguistic interviewer. I specialize in documenting endangered languages through intelligent conversation.

I can help you:
🗣️ Record and analyze speech samples
✍️ Document writing systems and symbols  
📝 Gather comprehensive linguistic data
🎯 Ask targeted questions based on what we already know

What language would you like to document today? I'll check our database and ask the right questions to fill in missing information.`,
        type: 'text',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    // Check if limit reached for non-admin users
    if (limitReached && usageData && !usageData.isAdmin) {
      toast({
        title: "Interview Limit Reached",
        description: "You've used all 3 of your AI interviews. Admin users have unlimited access.",
        variant: "destructive"
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      type: 'text',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // If this is language detection phase
    if (currentPhase === 'language_detection') {
      detectLanguageMutation.mutate(inputText);
    }

    // Send to AI conversation
    conversationMutation.mutate({ message: inputText });
    setInputText("");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audioMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: '[Audio Recording]',
          type: 'audio',
          audioUrl,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, audioMessage]);
        
        // Send audio for AI analysis
        setIsTyping(true);
        conversationMutation.mutate({ 
          message: 'User provided audio recording',
          context: { audioData: audioUrl, type: 'audio' }
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleDrawing = () => {
    setIsDrawing(!isDrawing);
  };

  const saveDrawing = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL();
      
      const drawingMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: '[Symbol/Character Drawing]',
        type: 'drawing',
        drawingData: dataUrl,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, drawingMessage]);
      setIsDrawing(false);
      
      // Send drawing for AI analysis
      setIsTyping(true);
      conversationMutation.mutate({ 
        message: 'User provided character/symbol drawing',
        context: { drawingData: dataUrl, type: 'drawing' }
      });
    }
  };

  const PhaseIndicator = () => (
    <div className="flex items-center gap-2 mb-4">
      <Badge variant="outline" className="flex items-center gap-1">
        {currentPhase === 'language_detection' && <Search className="h-3 w-3" />}
        {currentPhase === 'contextual_interview' && <Languages className="h-3 w-3" />}
        {currentPhase === 'completion' && <Download className="h-3 w-3" />}
        {currentPhase === 'language_detection' && 'Language Detection'}
        {currentPhase === 'contextual_interview' && 'Detailed Interview'}
        {currentPhase === 'completion' && 'Documentation Complete'}
      </Badge>
      {languageContext && (
        <Badge style={{ backgroundColor: 'hsl(25 25% 50%)', color: 'white' }}>
          {languageContext.name}
          {languageContext.existingData ? ' (In Database)' : ' (New)'}
        </Badge>
      )}
    </div>
  );

  const UsageIndicator = () => {
    if (!usageData) return null;
    
    return (
      <Card className="mb-4 border-l-4" style={{ borderLeftColor: usageData.isAdmin ? 'hsl(120 60% 50%)' : (limitReached ? 'hsl(0 60% 50%)' : 'hsl(45 60% 50%)') }}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-semibold mb-1">AI Interview Usage</div>
              <div className="text-muted-foreground">
                {usageData.isAdmin ? (
                  <span className="text-green-600">Admin User - Unlimited Interviews</span>
                ) : (
                  <>
                    {limitReached ? (
                      <span className="text-red-600">
                        Limit reached: {usageData.usageCount} / {usageData.limit} interviews used
                      </span>
                    ) : (
                      <span>
                        {usageData.remaining} interview{usageData.remaining !== 1 ? 's' : ''} remaining ({usageData.usageCount} / {usageData.limit} used)
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            <Badge variant={usageData.isAdmin ? "default" : (limitReached ? "destructive" : "secondary")}>
              {usageData.isAdmin ? "ADMIN" : `${usageData.remaining} left`}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  const LanguageContextPanel = () => {
    if (!languageContext) return null;
    
    return (
      <Card className="mb-4 border-l-4" style={{ borderLeftColor: 'hsl(25 25% 50%)' }}>
        <CardContent className="pt-4">
          <div className="text-sm space-y-2">
            <div className="font-semibold">{languageContext.name}</div>
            {languageContext.nativeName && (
              <div className="text-muted-foreground">Native: {languageContext.nativeName}</div>
            )}
            <div className="flex gap-2">
              <Badge variant={languageContext.existingData ? "default" : "secondary"}>
                {languageContext.existingData ? "Existing Language" : "New Language"}
              </Badge>
              <Badge variant={languageContext.priority === 'high' ? "destructive" : "outline"}>
                {languageContext.missingFields.length} gaps to fill
              </Badge>
            </div>
            {languageContext.missingFields.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Missing: {languageContext.missingFields.slice(0, 3).join(', ')}
                {languageContext.missingFields.length > 3 && '...'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="p-4">
      <div className="max-w-4xl mx-auto transition-all duration-300">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(25 20% 25%)' }}>
            AI Linguistic Interviewer
          </h1>
          <p className="text-lg" style={{ color: 'hsl(25 15% 45%)' }}>
            Intelligent conversation-driven language documentation
          </p>
        </div>

        <UsageIndicator />
        <PhaseIndicator />
        <LanguageContextPanel />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="border-2" style={{ borderColor: 'hsl(25 25% 80%)', backgroundColor: 'white' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(25 20% 25%)' }}>
                  <Bot className="h-5 w-5" />
                  Interview Conversation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 mb-4 p-4 border rounded-lg">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === 'user' 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-orange-100 text-orange-600'
                          }`}>
                            {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                          </div>
                          <div className={`p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            {message.type === 'audio' && (
                              <div className="flex items-center gap-2">
                                <Play className="h-4 w-4" />
                                <span>Audio Recording</span>
                                {message.audioUrl && (
                                  <audio controls className="max-w-xs">
                                    <source src={message.audioUrl} type="audio/wav" />
                                  </audio>
                                )}
                              </div>
                            )}
                            {message.type === 'drawing' && (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <Palette className="h-4 w-4" />
                                  <span>Symbol/Character Drawing</span>
                                </div>
                                {message.drawingData && (
                                  <img 
                                    src={message.drawingData} 
                                    alt="User drawing" 
                                    className="max-w-xs border rounded"
                                  />
                                )}
                              </div>
                            )}
                            {message.type === 'text' && (
                              <div className="whitespace-pre-wrap">{message.content}</div>
                            )}
                            <div className={`text-xs mt-1 ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input Area */}
                <div className="space-y-4">
                  {isDrawing && (
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Draw symbols or characters:</span>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveDrawing}>
                            <Upload className="h-4 w-4 mr-1" />
                            Send Drawing
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setIsDrawing(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={200}
                        className="border rounded cursor-crosshair"
                        style={{ touchAction: 'none' }}
                        onMouseDown={(e) => {
                          const canvas = canvasRef.current;
                          const ctx = canvas?.getContext('2d');
                          if (ctx) {
                            ctx.beginPath();
                            ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                          }
                        }}
                        onMouseMove={(e) => {
                          if (e.buttons === 1) {
                            const canvas = canvasRef.current;
                            const ctx = canvas?.getContext('2d');
                            if (ctx) {
                              ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                              ctx.stroke();
                            }
                          }
                        }}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type your response or ask a question..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={conversationMutation.isPending || isRecording}
                      data-testid="input-chat-message"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputText.trim() || conversationMutation.isPending}
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={conversationMutation.isPending}
                      data-testid="button-record-audio"
                    >
                      {isRecording ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
                      {isRecording ? 'Stop Recording' : 'Record Audio'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDrawing}
                      disabled={conversationMutation.isPending}
                      data-testid="button-draw-symbols"
                    >
                      <Palette className="h-4 w-4 mr-1" />
                      Draw Symbols
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Context Panel */}
          <div className="space-y-4">
            <Card className="border-2" style={{ borderColor: 'hsl(25 25% 80%)', backgroundColor: 'white' }}>
              <CardHeader>
                <CardTitle className="text-sm" style={{ color: 'hsl(25 20% 25%)' }}>
                  AI Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-3 w-3 text-blue-500" />
                    <span>Language detection & database lookup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bot className="h-3 w-3 text-green-500" />
                    <span>Context-aware questioning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mic className="h-3 w-3 text-purple-500" />
                    <span>Audio analysis & phonetics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Palette className="h-3 w-3 text-orange-500" />
                    <span>Writing system recognition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Languages className="h-3 w-3 text-red-500" />
                    <span>Targeted data collection</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {currentPhase === 'contextual_interview' && languageContext && (
              <Card className="border-2" style={{ borderColor: 'hsl(25 25% 80%)', backgroundColor: 'white' }}>
                <CardHeader>
                  <CardTitle className="text-sm" style={{ color: 'hsl(25 20% 25%)' }}>
                    Interview Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span>Data completeness</span>
                        <span>{Math.round((1 - languageContext.missingFields.length / 20) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all" 
                          style={{ 
                            backgroundColor: 'hsl(25 25% 50%)',
                            width: `${Math.round((1 - languageContext.missingFields.length / 20) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {languageContext.missingFields.length} fields remaining
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}