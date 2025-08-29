import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing.tsx";
import Home from "@/pages/home.tsx";
import Discover from "@/pages/discover.tsx";
import Learn from "@/pages/learn.tsx";
import Contribute from "@/pages/contribute.tsx";
import Dashboard from "@/pages/dashboard.tsx";
import AdminPage from "@/pages/admin.tsx";
import AIInterviewPage from "@/pages/ai-interview.tsx";
import AuthPage from "@/pages/auth.tsx";
import NotFound from "@/pages/not-found.tsx";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/discover" component={Discover} />
          <Route path="/learn" component={Learn} />
          <Route path="/contribute" component={Contribute} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/ai-interview" component={AIInterviewPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
