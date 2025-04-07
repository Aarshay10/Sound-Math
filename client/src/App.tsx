import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import { AudioProvider } from "./contexts/AudioContext";
import { VisualizationProvider } from "./contexts/VisualizationContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AudioProvider>
        <VisualizationProvider>
          <Router />
          <Toaster />
        </VisualizationProvider>
      </AudioProvider>
    </QueryClientProvider>
  );
}

export default App;
