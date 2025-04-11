import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useVisualization } from "@/contexts/VisualizationContext";
import { useAudio } from "@/contexts/AudioContext";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ColorScheme, VisualizationMode } from "@/types";

export default function ControlPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const { mode, setMode, params, updateParams, colorScheme, setColorScheme } = useVisualization();
  const { audioInputs, currentAudioInput, setAudioInput } = useAudio();
  
  const toggleCollapse = () => setCollapsed(!collapsed);

  const handleModeChange = (selectedMode: string) => {
    setMode(selectedMode as VisualizationMode);
  };
  
  const handleInputChange = (value: string) => {
    setAudioInput(value);
  };

  const handleColorSchemeChange = (scheme: string) => {
    setColorScheme(scheme as ColorScheme);
  };

  const handleParamChange = (param: string, value: number[]) => {
    updateParams({ [param]: value[0] });
  };

  return (
    <div 
      id="controls-panel" 
      className={`bg-dark bg-opacity-80 backdrop-blur-md rounded-lg shadow-lg p-4 h-full overflow-auto transition-all duration-300 ${
        collapsed ? 'opacity-30 hover:opacity-100' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-secondary">Controls</h2>
        <button 
          id="collapse-btn" 
          className="text-light opacity-70 hover:opacity-100"
          onClick={toggleCollapse}
        >
          {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Visualization Mode</label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant={mode === 'harmonograph' ? 'default' : 'secondary'}
            onClick={() => handleModeChange('harmonograph')}
            className={`${mode === 'harmonograph' ? 'bg-primary bg-opacity-70 hover:bg-opacity-100' : 'bg-dark hover:bg-primary hover:bg-opacity-70'} text-sm`}
          >
            Harmonograph
          </Button>
          <Button
            size="sm"
            variant={mode === 'waveform' ? 'default' : 'secondary'}
            onClick={() => handleModeChange('waveform')}
            className={`${mode === 'waveform' ? 'bg-primary bg-opacity-70 hover:bg-opacity-100' : 'bg-dark hover:bg-primary hover:bg-opacity-70'} text-sm`}
          >
            Waveform
          </Button>
          <Button
            size="sm"
            variant={mode === 'particles' ? 'default' : 'secondary'}
            onClick={() => handleModeChange('particles')}
            className={`${mode === 'particles' ? 'bg-primary bg-opacity-70 hover:bg-opacity-100' : 'bg-dark hover:bg-primary hover:bg-opacity-70'} text-sm`}
          >
            Particles
          </Button>
          <Button
            size="sm"
            variant={mode === 'fractal' ? 'default' : 'secondary'}
            onClick={() => handleModeChange('fractal')}
            className={`${mode === 'fractal' ? 'bg-primary bg-opacity-70 hover:bg-opacity-100' : 'bg-dark hover:bg-primary hover:bg-opacity-70'} text-sm`}
          >
            Fractal
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Audio Input</label>
        <Select onValueChange={handleInputChange} value={currentAudioInput || ''}>
          <SelectTrigger className="w-full bg-dark border border-gray-700 rounded text-sm">
            <SelectValue placeholder="Select input device" />
          </SelectTrigger>
          <SelectContent>
            {audioInputs.length > 0 ? (
              audioInputs.map((input) => (
                <SelectItem key={input.deviceId} value={input.deviceId || 'default-device'}>
                  {input.label || 'Default Microphone'}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-devices">
                No audio devices found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Visualization Parameters</label>
        
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Sensitivity</span>
            <span>{params.sensitivity}%</span>
          </div>
          <Slider
            value={[params.sensitivity]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => handleParamChange('sensitivity', value)}
            className="w-full h-2"
          />
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Complexity</span>
            <span>{params.complexity}%</span>
          </div>
          <Slider
            value={[params.complexity]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => handleParamChange('complexity', value)}
            className="w-full h-2"
          />
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Decay</span>
            <span>{params.decay}%</span>
          </div>
          <Slider
            value={[params.decay]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => handleParamChange('decay', value)}
            className="w-full h-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Color Scheme</label>
        <div className="grid grid-cols-4 gap-2">
          <button 
            className={`w-full aspect-square rounded-full bg-gradient-to-br from-secondary to-primary ${colorScheme === 'default' ? 'ring-2 ring-white' : ''}`}
            onClick={() => handleColorSchemeChange('default')}
          />
          <button 
            className={`w-full aspect-square rounded-full bg-gradient-to-br from-accent to-yellow-400 ${colorScheme === 'warm' ? 'ring-2 ring-white' : ''}`}
            onClick={() => handleColorSchemeChange('warm')}
          />
          <button 
            className={`w-full aspect-square rounded-full bg-gradient-to-br from-green-400 to-blue-500 ${colorScheme === 'cool' ? 'ring-2 ring-white' : ''}`}
            onClick={() => handleColorSchemeChange('cool')}
          />
          <button 
            className={`w-full aspect-square rounded-full bg-gradient-to-br from-purple-500 to-pink-500 ${colorScheme === 'vibrant' ? 'ring-2 ring-white' : ''}`}
            onClick={() => handleColorSchemeChange('vibrant')}
          />
        </div>
      </div>
    </div>
  );
}
