import { useRef, useEffect } from "react";
import { useAudio } from "@/contexts/AudioContext";

export default function FrequencyMonitor() {
  const frequencyCanvasRef = useRef<HTMLCanvasElement>(null);
  const { audioData, detectedChord, currentFrequency } = useAudio();
  
  useEffect(() => {
    const canvas = frequencyCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full size
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    
    resize();
    window.addEventListener('resize', resize);
    
    // Function to draw frequency data
    const drawFrequencyData = () => {
      if (!ctx) return;
      
      // Get frequency data
      const freqData = audioData.frequencyData;
      if (!freqData || freqData.length === 0) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barCount = Math.min(64, freqData.length);
      const barWidth = canvas.width / barCount;
      const barColor = '#4ECDC4';
      const noteBarColor = '#FF6B6B';
      
      for (let i = 0; i < barCount; i++) {
        const value = freqData[i] / 255.0;
        const height = value * canvas.height;
        
        // Highlight detected chord notes
        const isNoteInChord = detectedChord.frequencies.some(freq => {
          const freqIndex = Math.round(freq / (44100 / freqData.length));
          return Math.abs(freqIndex - i) <= 1;
        });
        
        ctx.fillStyle = isNoteInChord ? noteBarColor : barColor;
        ctx.fillRect(i * barWidth, canvas.height - height, barWidth - 1, height);
      }
    };
    
    // Animation frame
    let animationId: number;
    
    const animate = () => {
      drawFrequencyData();
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [audioData, detectedChord]);
  
  const formattedFrequency = currentFrequency ? `${Math.round(currentFrequency)} Hz` : 'N/A';
  
  return (
    <div className="bg-dark bg-opacity-80 backdrop-blur-md rounded-lg p-4 mb-4 h-[200px]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Frequency Analysis</h3>
        <span className="text-xs font-mono text-secondary">{formattedFrequency}</span>
      </div>
      
      <div className="h-24 bg-dark border border-gray-800 rounded-md overflow-hidden">
        <canvas ref={frequencyCanvasRef} id="frequency-canvas" className="w-full h-full" />
      </div>
      
      <div className="mt-3">
        <div className="grid grid-cols-5 gap-1 mb-1">
          {detectedChord.notes.slice(0, 5).map((note, index) => (
            <div key={index} className="text-center text-xs">
              <div className="font-mono text-secondary">{note.name}</div>
              <div className="text-[10px] opacity-70">{Math.round(note.frequency)}Hz</div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>20Hz</span>
          <span>500Hz</span>
          <span>1kHz</span>
          <span>5kHz</span>
          <span>20kHz</span>
        </div>
      </div>
    </div>
  );
}
