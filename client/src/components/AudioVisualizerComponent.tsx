import React, { useEffect, useRef } from 'react';
import { AudioVisualizer } from '@/lib/visualization/AudioVisualizer';
import { Chord, ChordNote } from '@/types';

interface AudioVisualizerComponentProps {
  chord: Chord;
  note: ChordNote;
}

export const AudioVisualizerComponent: React.FC<AudioVisualizerComponentProps> = ({ chord, note }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<AudioVisualizer | null>(null);

  useEffect(() => {
    if (containerRef.current && !visualizerRef.current) {
      visualizerRef.current = new AudioVisualizer(containerRef.current);
    }

    return () => {
      if (visualizerRef.current) {
        visualizerRef.current.dispose();
        visualizerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (visualizerRef.current) {
      visualizerRef.current.updateAudioData(chord, note);
    }
  }, [chord, note]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100vh', 
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 0
      }}
    />
  );
}; 