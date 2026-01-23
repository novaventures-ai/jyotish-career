import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GuestChartProvider } from "./contexts/GuestChartContext";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import ChartView from "./pages/ChartView";
import CareerPathfinder from "./pages/CareerPathfinder";
import EarningSources from "./pages/EarningSources";
import Timing from "./pages/Timing";
import Remedies from "./pages/Remedies";
import Profile from "./pages/Profile";
import WealthStatus from "./pages/WealthStatus";
import SwotAnalysis from "@/pages/SwotAnalysis";
import { CareerValidator } from "./pages/CareerValidator";
import AstroCounselor from "./pages/AstroCounselor";

function Router() {
  return (
    <Switch>
      {/* All routes are now accessible without sign-in */}
      <Route path="/" component={Home} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/chart/:profileId?" component={ChartView} />
      <Route path="/career" component={CareerPathfinder} />
      <Route path="/earning" component={EarningSources} />
      <Route path="/timing" component={Timing} />
      <Route path="/remedies" component={Remedies} />
      <Route path="/wealth" component={WealthStatus} />
      <Route path="/profile" component={Profile} />
      <Route path="/swot" component={SwotAnalysis} />
      <Route path="/career-validator" component={CareerValidator} />
      <Route path="/counselor" component={AstroCounselor} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <GuestChartProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </GuestChartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
