import { useAudio } from "@/contexts/AudioContext";

export default function Header() {
  const { isActive, detectedChord } = useAudio();

  return (
    <header className="relative z-20 p-4 flex justify-between items-center bg-opacity-20 bg-dark backdrop-blur-sm">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-secondary">
          Harmonic <span className="text-accent">Visualizer</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span 
            className={`w-3 h-3 rounded-full ${isActive ? 'bg-success animate-pulse' : 'bg-error'}`} 
          />
          <span className="text-sm font-medium">
            {isActive ? 'Audio Active' : 'Audio Inactive'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-dark bg-opacity-40 rounded-full">
          <span className="text-sm font-mono">{detectedChord.name || 'N/A'}</span>
        </div>
      </div>
    </header>
  );
}
