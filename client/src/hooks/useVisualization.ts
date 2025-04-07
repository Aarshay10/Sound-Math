import { useState, useCallback } from 'react';

type VisualizationMode = 'harmonograph' | 'waveform' | 'particles' | 'fractal';
type ColorScheme = 'default' | 'warm' | 'cool' | 'vibrant';

interface VisualizationParams {
  sensitivity: number;
  complexity: number;
  decay: number;
}

export function useVisualization() {
  const [mode, setMode] = useState<VisualizationMode>('harmonograph');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [params, setParams] = useState<VisualizationParams>({
    sensitivity: 75,
    complexity: 60,
    decay: 40
  });
  
  const updateParams = useCallback((newParams: Partial<VisualizationParams>) => {
    setParams(prevParams => ({
      ...prevParams,
      ...newParams
    }));
  }, []);
  
  const toggleColorScheme = useCallback(() => {
    setColorScheme(prev => {
      const schemes: ColorScheme[] = ['default', 'warm', 'cool', 'vibrant'];
      const currentIndex = schemes.indexOf(prev);
      const nextIndex = (currentIndex + 1) % schemes.length;
      return schemes[nextIndex];
    });
  }, []);
  
  return {
    mode,
    setMode,
    colorScheme,
    setColorScheme,
    toggleColorScheme,
    params,
    updateParams
  };
}
