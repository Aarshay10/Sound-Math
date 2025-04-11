import { useAudio } from "@/contexts/AudioContext";

export default function Header() {
  const { isActive, detectedChord } = useAudio();

  return (
    <header className="fixed top-0 left-0 right-0 z-20 py-3 px-4 flex justify-between items-center bg-dark bg-opacity-30 backdrop-blur-md shadow-md">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">
          <span className="text-secondary">Harmonic</span> <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Visualizer</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span 
            className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} 
          />
          <span className="text-sm font-medium hidden md:inline">
            {isActive ? 'Audio Active' : 'Audio Inactive'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-dark bg-opacity-60 rounded-full">
          <span className="text-sm font-mono">{detectedChord.name || 'N/A'}</span>
        </div>
      </div>
    </header>
  );
}
