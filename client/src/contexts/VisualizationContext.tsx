import React, { createContext, useContext, useState } from 'react';
import { useVisualization as useVisualizationHook } from '@/hooks/useVisualization';

type VisualizationMode = 'harmonograph' | 'waveform' | 'particles' | 'fractal';
type ColorScheme = 'default' | 'warm' | 'cool' | 'vibrant';

interface VisualizationParams {
  sensitivity: number;
  complexity: number;
  decay: number;
}

interface VisualizationContextType {
  mode: VisualizationMode;
  setMode: (mode: VisualizationMode) => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
  params: VisualizationParams;
  updateParams: (newParams: Partial<VisualizationParams>) => void;
}

const VisualizationContext = createContext<VisualizationContextType>({
  mode: 'harmonograph',
  setMode: () => {},
  colorScheme: 'default',
  setColorScheme: () => {},
  toggleColorScheme: () => {},
  params: {
    sensitivity: 75,
    complexity: 60,
    decay: 40
  },
  updateParams: () => {}
});

export const useVisualization = () => useContext(VisualizationContext);

interface VisualizationProviderProps {
  children: React.ReactNode;
}

export const VisualizationProvider: React.FC<VisualizationProviderProps> = ({ children }) => {
  const visualization = useVisualizationHook();
  
  return (
    <VisualizationContext.Provider value={visualization}>
      {children}
    </VisualizationContext.Provider>
  );
};
