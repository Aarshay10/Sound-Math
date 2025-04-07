import { Settings, Moon, Info, Menu } from "lucide-react";
import { useState } from "react";
import { useVisualization } from "@/contexts/VisualizationContext";
import ControlPanel from "./ControlPanel";

export default function MobileToolbar() {
  const [showSettings, setShowSettings] = useState(false);
  const { toggleColorScheme } = useVisualization();
  
  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-dark bg-opacity-90 backdrop-blur-md p-3 flex justify-center gap-4">
        <button 
          className={`p-3 rounded-full ${showSettings ? 'bg-primary bg-opacity-100' : 'bg-primary bg-opacity-70 hover:bg-opacity-100'} transition`}
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-5 w-5" />
        </button>
        
        <button 
          className="p-3 rounded-full bg-dark hover:bg-opacity-70 transition"
          onClick={toggleColorScheme}
        >
          <Moon className="h-5 w-5" />
        </button>
        
        <button 
          className="p-3 rounded-full bg-dark hover:bg-opacity-70 transition"
        >
          <Info className="h-5 w-5" />
        </button>
        
        <button 
          className="p-3 rounded-full bg-dark hover:bg-opacity-70 transition"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      
      {showSettings && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="w-full max-w-sm mx-4 max-h-[80vh] overflow-y-auto">
            <ControlPanel />
            <button 
              className="mt-4 w-full py-2 bg-gray-800 text-white rounded-lg"
              onClick={() => setShowSettings(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
