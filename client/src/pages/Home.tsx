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
    <div className="h-screen w-screen overflow-hidden bg-dark text-light relative">
      {/* Background visualization */}
      <VisualizationCanvas />
      
      {/* Header */}
      <Header />
      
      {/* Main content area with sidebar layout */}
      <div className="absolute inset-0 pt-16 z-10">
        <div className="h-full flex">
          {/* Left panel - controls on desktop */}
          <div className="w-72 hidden md:block h-full p-4 pointer-events-auto">
            <ControlPanel />
          </div>
          
          {/* Center area - main visualization, keep empty */}
          <div className="flex-grow"></div>
          
          {/* Right panel - frequency monitor and chord history */}
          <div className="w-80 hidden md:flex flex-col p-4 pointer-events-auto">
            <FrequencyMonitor />
            <ChordHistory />
            
            {/* Info overlay shown inside right panel */}
            <div className="mt-auto mb-4">
              <InfoOverlay />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile-only info overlay */}
      <div className="absolute bottom-16 left-0 right-0 md:hidden px-4 z-30 flex justify-center pointer-events-auto">
        <InfoOverlay />
      </div>
      
      {/* Mobile toolbar */}
      <MobileToolbar />
    </div>
  );
}
