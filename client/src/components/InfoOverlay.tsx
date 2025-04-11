import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAudio } from "@/contexts/AudioContext";
import { useVisualization } from "@/contexts/VisualizationContext";

export default function InfoOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const { detectedChord } = useAudio();
  const { mode } = useVisualization();
  
  // Show overlay when chord changes
  useEffect(() => {
    if (detectedChord.name && detectedChord.name !== 'N/A') {
      setIsVisible(true);
      
      // Hide after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [detectedChord.name]);
  
  const getPatternDescription = () => {
    switch (mode) {
      case 'harmonograph':
        return `This pattern uses a harmonograph model based on the ratio of frequencies in the ${detectedChord.name} chord, creating damped sine waves with amplitude modulation related to the ratios of the chord frequencies.`;
      case 'waveform':
        return `Waveform visualization showing the real-time audio signal from the ${detectedChord.name} chord, revealing the complex harmonic content.`;
      case 'particles':
        return `Particle system visualization where particle movement and connections are driven by the frequency content of the ${detectedChord.name} chord.`;
      case 'fractal':
        return `Recursive fractal pattern where the growth and branching are influenced by the harmonic ratios of the ${detectedChord.name} chord.`;
      default:
        return '';
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div id="info-overlay" className="text-sm bg-dark bg-opacity-90 backdrop-blur-md rounded-lg p-4 shadow-lg max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">
          Current Chord: <span className="text-secondary font-mono">{detectedChord.name}</span>
        </h3>
        <button className="text-gray-400 hover:text-white" onClick={() => setIsVisible(false)}>
          <X size={16} />
        </button>
      </div>
      
      <div className="space-y-1">
        <p className="text-xs">
          <span className="text-gray-400">Formula:</span> {detectedChord.formula || 'N/A'}
        </p>
        <p className="text-xs">
          <span className="text-gray-400">Notes:</span> {detectedChord.notes.map(note => note.name).join('-')}
        </p>
        <p className="text-xs">
          <span className="text-gray-400">Frequencies:</span> {detectedChord.notes.map(note => `${Math.round(note.frequency)}Hz`).join(', ')}
        </p>
      </div>
      
      <div className="mt-3">
        <div className="text-xs text-gray-400 mb-1">Mathematical Pattern</div>
        <div className="text-xs">
          {getPatternDescription()}
        </div>
      </div>
    </div>
  );
}
