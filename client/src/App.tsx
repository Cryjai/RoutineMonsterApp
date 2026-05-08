import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import TodayPage from "@/pages/today";
import RoutinesPage from "@/pages/routines";
import RoutineEditorPage from "@/pages/routine-editor";
import RunnerPage from "@/pages/runner";
import AchievementsPage from "@/pages/achievements";
import RewardsPage from "@/pages/rewards";
import ProfilesPage from "@/pages/profiles";
import LoginPage from "@/pages/login";
import SubscriptionPage from "@/pages/subscription";
import CoachPage from "@/pages/coach";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={TodayPage} />
      <Route path="/routines" component={RoutinesPage} />
      <Route path="/routines/new" component={(p: any) => <RoutineEditorPage params={{}} {...p} />} />
      <Route path="/routines/:id/edit">
        {(params) => <RoutineEditorPage params={{ id: params.id }} />}
      </Route>
      <Route path="/run/:id">
        {(params) => <RunnerPage params={{ id: params.id }} />}
      </Route>
      <Route path="/coach" component={CoachPage} />
      <Route path="/achievements" component={AchievementsPage} />
      <Route path="/rewards" component={RewardsPage} />
      <Route path="/profiles" component={ProfilesPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/subscription" component={SubscriptionPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
