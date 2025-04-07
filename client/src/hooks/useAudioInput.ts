import { useState, useEffect, useCallback } from 'react';
import { audioProcessor } from '@/lib/audio/AudioProcessor';
import { AudioData } from '@/types';

export function useAudioInput() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [audioData, setAudioData] = useState<AudioData>({
    frequencyData: new Uint8Array(),
    timeData: new Float32Array()
  });
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [currentAudioInput, setCurrentAudioInput] = useState<string | null>(null);
  
  // Initialize audio processor
  const initializeAudio = useCallback(async (deviceId?: string) => {
    try {
      const success = await audioProcessor.initialize(deviceId);
      if (success) {
        setIsInitialized(true);
        setIsActive(true);
        if (deviceId) {
          setCurrentAudioInput(deviceId);
        }
        audioProcessor.start();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  }, []);
  
  // Get available audio inputs
  const loadAudioInputs = useCallback(async () => {
    try {
      const inputs = await audioProcessor.getAudioInputs();
      setAudioInputs(inputs);
      return inputs;
    } catch (error) {
      console.error('Failed to load audio inputs:', error);
      return [];
    }
  }, []);
  
  // Change audio input
  const changeAudioInput = useCallback(async (deviceId: string) => {
    // Stop current processing
    audioProcessor.stop();
    setIsActive(false);
    
    // Initialize with new device
    const success = await initializeAudio(deviceId);
    return success;
  }, [initializeAudio]);
  
  // Subscribe to audio data updates
  useEffect(() => {
    if (!isInitialized) return;
    
    const unsubscribe = audioProcessor.subscribe((data) => {
      setAudioData(data);
      setIsActive(audioProcessor.isAudioActive());
    });
    
    return unsubscribe;
  }, [isInitialized]);
  
  // Load audio inputs on mount
  useEffect(() => {
    loadAudioInputs();
    
    // Cleanup on unmount
    return () => {
      audioProcessor.stop();
    };
  }, [loadAudioInputs]);
  
  return {
    isInitialized,
    isActive,
    audioData,
    audioInputs,
    currentAudioInput,
    initializeAudio,
    loadAudioInputs,
    changeAudioInput,
    setAudioInput: changeAudioInput,
    getDominantFrequency: () => audioProcessor.detectDominantFrequency(),
    getAmplitude: () => audioProcessor.getAmplitude()
  };
}
