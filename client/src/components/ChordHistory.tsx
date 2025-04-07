import { useState } from "react";
import { useAudio } from "@/contexts/AudioContext";
import { Button } from "@/components/ui/button";

export default function ChordHistory() {
  const { chordHistory, clearChordHistory } = useAudio();
  
  return (
    <div className="fixed left-4 top-20 z-20 bg-dark bg-opacity-80 backdrop-blur-md rounded-lg p-4 w-60">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Chord History</h3>
        <Button 
          variant="ghost" 
          className="text-xs text-gray-400 hover:text-white h-auto py-0 px-1"
          onClick={clearChordHistory}
        >
          Clear
        </Button>
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
    </div>
  );
}
