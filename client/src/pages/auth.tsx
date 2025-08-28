import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { initFirebase, googleLogin, handleGoogleRedirect } from "@/firebase";

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();

  // Initialize Firebase
  useEffect(() => {
    initFirebase();
    
    // Handle Google redirect result
    handleGoogleRedirect().then(async (result) => {
      if (result && result.user) {
        try {
          const idToken = await result.user.getIdToken();
          const res = await apiRequest("POST", "/api/auth/google", { idToken });
          
          if (res.ok) {
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            toast({
              title: "Welcome!",
              description: "You have successfully signed in with Google.",
            });
            setLocation("/");
          }
        } catch (error) {
          console.error("Google login error:", error);
          toast({
            title: "Google Login Failed",
            description: "Failed to complete Google sign-in. Please try again.",
            variant: "destructive",
          });
        }
      }
    }).catch((error) => {
      console.error("Google redirect error:", error);
      toast({
        title: "Google Login Error",
        description: "Failed to complete Google sign-in. Please try again.",
        variant: "destructive",
      });
    });
  }, []);

  // Redirect if already logged in
  if (!isLoading && user) {
    setLocation("/");
    return null;
  }

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await apiRequest("POST", "/api/login", data);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Welcome to LanguaLegacy!",
        description: "Your account has been created successfully.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const handleRegister = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  const handleGoogleLogin = () => {
    const hasFirebaseConfig = import.meta.env.VITE_FIREBASE_API_KEY && 
                             import.meta.env.VITE_FIREBASE_APP_ID && 
                             import.meta.env.VITE_FIREBASE_PROJECT_ID;

    if (!hasFirebaseConfig) {
      toast({
        title: "Google Login Not Available",
        description: "Please configure Firebase credentials to enable Google login.",
        variant: "default",
      });
      return;
    }

    try {
      googleLogin();
    } catch (error) {
      toast({
        title: "Google Login Error",
        description: "Failed to initiate Google login. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'hsl(35 40% 96%)' }}>
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Auth forms */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold" style={{ color: 'hsl(25 60% 35%)' }}>
              Join LanguaLegacy
            </h1>
            <p className="text-muted-foreground">
              Help preserve endangered languages for future generations
            </p>
          </div>

          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">
                {isLoginMode ? "Sign In" : "Create Account"}
              </CardTitle>
              <CardDescription className="text-center">
                {isLoginMode 
                  ? "Welcome back! Sign in to continue your language preservation journey."
                  : "Join our community of language preservationists and learners."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google Login Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                data-testid="button-google-login"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Login Form */}
              {isLoginMode ? (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="usernameOrEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username or Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your username or email" 
                              {...field} 
                              data-testid="input-username-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              {...field}
                              data-testid="input-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              ) : (
                /* Register Form */
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Choose a username" 
                              {...field}
                              data-testid="input-username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Enter your email" 
                              {...field}
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="First name" 
                                {...field}
                                data-testid="input-firstname"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Last name" 
                                {...field}
                                data-testid="input-lastname"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Create a password (min. 6 characters)" 
                              {...field}
                              data-testid="input-register-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              )}

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  data-testid="button-toggle-mode"
                >
                  {isLoginMode 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Hero section */}
        <div className="hidden lg:block space-y-6">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold" style={{ color: 'hsl(25 60% 35%)' }}>
              Preserve Languages.
              <br />
              Share Stories.
              <br />
              Build Community.
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of language enthusiasts working together to document, 
              learn, and preserve endangered languages from around the world.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <i className="fas fa-microphone text-primary-foreground text-sm"></i>
              </div>
              <div>
                <h3 className="font-semibold">Contribute Audio & Text</h3>
                <p className="text-sm text-muted-foreground">
                  Record native speakers and document cultural context
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <i className="fas fa-graduation-cap text-primary-foreground text-sm"></i>
              </div>
              <div>
                <h3 className="font-semibold">Learn & Practice</h3>
                <p className="text-sm text-muted-foreground">
                  Master endangered languages through interactive lessons
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <i className="fas fa-globe-americas text-primary-foreground text-sm"></i>
              </div>
              <div>
                <h3 className="font-semibold">Global Impact</h3>
                <p className="text-sm text-muted-foreground">
                  Be part of a worldwide movement to preserve linguistic diversity
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}