import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import P5.js through CDN to not make it part of the bundle
const p5Script = document.createElement('script');
p5Script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js';
p5Script.async = true;
document.head.appendChild(p5Script);

// Import Tone.js through CDN
const toneScript = document.createElement('script');
toneScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js';
toneScript.async = true;
document.head.appendChild(toneScript);

createRoot(document.getElementById("root")!).render(<App />);
