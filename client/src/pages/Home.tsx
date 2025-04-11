import { useEffect } from "react";
import VisualizationCanvas from "@/components/VisualizationCanvas";
import Header from "@/components/Header";
import ControlPanel from "@/components/ControlPanel";
import FrequencyMonitor from "@/components/FrequencyMonitor";
import ChordHistory from "@/components/ChordHistory";
import InfoOverlay from "@/components/InfoOverlay";
import MobileToolbar from "@/components/MobileToolbar";
import { useAudio } from "@/contexts/AudioContext";

export default function Home() {
  const { initializeAudio } = useAudio();

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await initializeAudio();
      } catch (error) {
        console.error("Failed to initialize audio:", error);
      }
    };

    setupAudio();
  }, [initializeAudio]);

  return (
    <div className="h-screen w-screen flex flex-col relative bg-dark text-light overflow-hidden">
      {/* Background visualization */}
      <VisualizationCanvas />
      
      {/* Header area - fixed at top */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <Header />
      </div>
      
      {/* Main content area with flexible layout */}
      <div className="absolute inset-0 pt-16 pb-16 z-10 pointer-events-none">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full p-4">
          {/* Left panel - control panel */}
          <div className="md:col-span-3 pointer-events-auto">
            <ControlPanel />
          </div>
          
          {/* Middle area - intentionally empty for visualization */}
          <div className="hidden md:block md:col-span-6">
            {/* Space for visualization */}
          </div>
          
          {/* Right panel - frequency and chord history */}
          <div className="md:col-span-3 flex flex-col gap-4 pointer-events-auto">
            <FrequencyMonitor />
            <ChordHistory />
          </div>
        </div>
      </div>
      
      {/* Info overlay */}
      <div className="absolute top-20 right-4 z-30 pointer-events-auto">
        <InfoOverlay />
      </div>
      
      {/* Mobile toolbar - only visible on small screens */}
      <div className="absolute bottom-0 left-0 right-0 z-20 md:hidden">
        <MobileToolbar />
      </div>
    </div>
  );
}
