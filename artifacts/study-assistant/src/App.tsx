import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load pages for better performance
const Home = lazy(() => import("@/pages/home").then(m => ({ default: m.Home })));
const Login = lazy(() => import("@/pages/login").then(m => ({ default: m.Login })));
const Signup = lazy(() => import("@/pages/signup").then(m => ({ default: m.Signup })));
const Dashboard = lazy(() => import("@/pages/dashboard").then(m => ({ default: m.Dashboard })));
const Upload = lazy(() => import("@/pages/upload").then(m => ({ default: m.Upload })));
const SessionOverview = lazy(() => import("@/pages/session/overview").then(m => ({ default: m.SessionOverview })));
const SessionNotes = lazy(() => import("@/pages/session/notes").then(m => ({ default: m.SessionNotes })));
const SessionQuiz = lazy(() => import("@/pages/session/quiz").then(m => ({ default: m.SessionQuiz })));
const SessionFlashcards = lazy(() => import("@/pages/session/flashcards").then(m => ({ default: m.SessionFlashcards })));
const Library = lazy(() => import("@/pages/library").then(m => ({ default: m.Library })));
const Profile = lazy(() => import("@/pages/profile").then(m => ({ default: m.Profile })));
const Settings = lazy(() => import("@/pages/settings").then(m => ({ default: m.Settings })));

function Fallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="space-y-4 w-full max-w-sm p-4">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6 mx-auto" />
        <Skeleton className="h-32 w-full mt-8" />
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Suspense fallback={<Fallback />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/upload" component={Upload} />
          <Route path="/sessions/:id" component={SessionOverview} />
          <Route path="/sessions/:id/notes" component={SessionNotes} />
          <Route path="/sessions/:id/quiz" component={SessionQuiz} />
          <Route path="/sessions/:id/flashcards" component={SessionFlashcards} />
          <Route path="/library" component={Library} />
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
