import { useState, useEffect, useRef } from "react";
import { useAudio } from "@/contexts/AudioContext";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Move } from "lucide-react";

export default function ChordHistory() {
  const { chordHistory, clearChordHistory } = useAudio();
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);
  
  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only proceed with left mouse button
    
    setIsDragging(true);
    
    // Calculate the offset from the mouse position to the box position
    const rect = boxRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    
    // Prevent text selection during drag
    e.preventDefault();
  };
  
  // Handle drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Calculate new position
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Update position
      setPosition({ x: newX, y: newY });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Clean up
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);
  
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  
  return (
    <div 
      ref={boxRef}
      className={`fixed z-20 bg-dark bg-opacity-80 backdrop-blur-md rounded-lg shadow-lg transition-all duration-300 ${
        isDragging ? 'cursor-grabbing' : ''
      } ${collapsed ? 'w-12 h-12' : 'w-60 p-4'}`}
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transform: collapsed ? 'scale(0.9)' : 'scale(1)'
      }}
    >
      {collapsed ? (
        <button 
          className="w-full h-full flex items-center justify-center rounded-lg bg-primary bg-opacity-70 hover:bg-opacity-100 transition"
          onClick={toggleCollapse}
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2">
            <div 
              className="flex items-center cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
            >
              <Move className="h-4 w-4 mr-1 text-gray-400" />
              <h3 className="text-sm font-semibold">Chord History</h3>
            </div>
            <div className="flex">
              <Button 
                variant="ghost" 
                className="text-xs text-gray-400 hover:text-white h-auto py-0 px-1"
                onClick={clearChordHistory}
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                className="text-xs text-gray-400 hover:text-white h-auto py-0 px-1 ml-1"
                onClick={toggleCollapse}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {chordHistory.length === 0 ? (
              <div className="text-xs text-gray-400 py-2 text-center">No chords detected yet</div>
            ) : (
              chordHistory.map((chord, index) => (
                <div key={index} className="flex justify-between items-center py-1 border-b border-gray-800">
                  <span className="font-mono text-sm">{chord.name}</span>
                  <span className="text-xs text-gray-400">{chord.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
