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
      <VisualizationCanvas />
      <Header />
      <ControlPanel />
      <FrequencyMonitor />
      <ChordHistory />
      <InfoOverlay />
      <MobileToolbar />
    </div>
  );
}
