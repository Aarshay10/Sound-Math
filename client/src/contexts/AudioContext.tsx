import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAudioInput } from '@/hooks/useAudioInput';
import { AudioData, Chord, ChordNote } from '@/types';
import { chordDetector } from '@/lib/audio/ChordDetector';

interface ChordHistoryItem {
  name: string;
  timestamp: string;
}

interface AudioContextType {
  isActive: boolean;
  audioData: AudioData;
  detectedChord: Chord;
  currentFrequency: number | null;
  chordHistory: ChordHistoryItem[];
  audioInputs: MediaDeviceInfo[];
  currentAudioInput: string | null;
  initializeAudio: () => Promise<boolean>;
  setAudioInput: (deviceId: string) => Promise<boolean>;
  clearChordHistory: () => void;
}

const AudioContext = createContext<AudioContextType>({
  isActive: false,
  audioData: { frequencyData: new Uint8Array(), timeData: new Float32Array() },
  detectedChord: { name: '', formula: '', notes: [], frequencies: [] },
  currentFrequency: null,
  chordHistory: [],
  audioInputs: [],
  currentAudioInput: null,
  initializeAudio: async () => false,
  setAudioInput: async () => false,
  clearChordHistory: () => {},
});

export const useAudio = () => useContext(AudioContext);

interface AudioProviderProps {
  children: React.ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const {
    isActive,
    audioData,
    audioInputs,
    currentAudioInput,
    initializeAudio,
    setAudioInput,
    getDominantFrequency
  } = useAudioInput();
  
  const [detectedChord, setDetectedChord] = useState<Chord>({ 
    name: '', 
    formula: '', 
    notes: [], 
    frequencies: [] 
  });
  
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);
  const [chordHistory, setChordHistory] = useState<ChordHistoryItem[]>([]);
  const [lastDetectedChord, setLastDetectedChord] = useState('');
  const [lastChordTime, setLastChordTime] = useState(0);
  
  // Format time for chord history
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Clear chord history
  const clearChordHistory = useCallback(() => {
    setChordHistory([]);
  }, []);
  
  // Audio processing effect
  useEffect(() => {
    if (!isActive) return;
    
    // Get current dominant frequency
    const frequency = getDominantFrequency();
    setCurrentFrequency(frequency);
    
    // Only detect chord if we have frequency data
    if (audioData.frequencyData && audioData.frequencyData.length) {
      // Detect chord from frequency data
      const sampleRate = 44100; // Default sample rate
      const fftSize = audioData.frequencyData.length * 2; // FFT size is twice the frequency bin count
      
      const chord = chordDetector.detectChord(audioData.frequencyData, sampleRate, fftSize);
      
      // Update detected chord if changed
      setDetectedChord(chord);
      
      // Add to history if chord changed and is valid
      const now = performance.now();
      if (chord.name && chord.name !== lastDetectedChord && (now - lastChordTime > 2000)) {
        setLastDetectedChord(chord.name);
        setLastChordTime(now);
        
        // Add to history
        const timeString = formatTime(now / 1000);
        setChordHistory(prev => [{ name: chord.name, timestamp: timeString }, ...prev].slice(0, 10));
      }
    }
  }, [audioData, isActive, getDominantFrequency, lastDetectedChord, lastChordTime]);
  
  const contextValue: AudioContextType = {
    isActive,
    audioData,
    detectedChord,
    currentFrequency,
    chordHistory,
    audioInputs,
    currentAudioInput,
    initializeAudio,
    setAudioInput,
    clearChordHistory
  };
  
  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};
