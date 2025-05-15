
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/context/LanguageContext";
import { GameProvider } from "@/context/GameContext";
import Index from "./pages/Index";
import JoinGame from "./pages/JoinGame";
import CreateGame from "./pages/CreateGame";
import WaitingRoomPage from "./pages/WaitingRoomPage";
import GamePage from "./pages/GamePage";
import NotFound from "./pages/NotFound";
import GameSelectionPage from "./pages/GameSelectionPage";
import RulesPage from "./pages/RulesPage";
import TriviaGamePage from "./pages/TriviaGamePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <GameProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/games" element={<GameSelectionPage />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="/join" element={<JoinGame />} />
              <Route path="/create" element={<CreateGame />} />
              <Route path="/waiting-room" element={<WaitingRoomPage />} />
              <Route path="/game" element={<GamePage />} />
              <Route path="/trivia" element={<TriviaGamePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </GameProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
