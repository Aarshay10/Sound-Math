import { useRef, useEffect } from "react";
import { useVisualization } from "@/contexts/VisualizationContext";
import { useAudio } from "@/contexts/AudioContext";

export default function VisualizationCanvas() {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const { mode, params, colorScheme } = useVisualization();
  const { audioData, isActive, detectedChord } = useAudio();
  
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full size
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };

    resize();
    window.addEventListener('resize', resize);

    // Animation variables
    let animationId: number;
    let time = 0;

    const colors = {
      primary: '#6042A6',
      secondary: '#4ECDC4',
      accent: '#FF6B6B',
    };

    // Basic harmonograph visualization function
    const drawHarmonograph = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) * 0.8;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // First curve
      ctx.strokeStyle = colorScheme === 'default' ? colors.secondary : colors.primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Calculate frequencies based on chord
      const baseFreq = detectedChord.name ? 2.0 : 2.0;
      const freq1 = baseFreq * (1 + params.complexity / 100);
      const freq2 = baseFreq * 1.5 * (1 + params.complexity / 200);
      const decay = 0.004 + (params.decay / 100) * 0.02;
      
      for (let t = 0; t < 100; t += 0.1) {
        const decayFactor = Math.exp(-decay * t);
        
        const x = centerX + radius * decayFactor * Math.sin(t * freq1 + Math.PI/4 + time);
        const y = centerY + radius * decayFactor * Math.sin(t * freq2 + Math.PI/6 + time * 0.7);
        
        if (t === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      // Add glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = colorScheme === 'default' ? colors.secondary : colors.primary;
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Second curve
      ctx.beginPath();
      ctx.strokeStyle = colorScheme === 'default' ? colors.accent : colors.secondary;
      
      for (let t = 0; t < 100; t += 0.1) {
        const decayFactor = Math.exp(-decay * t);
        
        const x = centerX + radius * decayFactor * Math.sin(t * (freq1 * 1.5) + Math.PI/4 + time * 1.1);
        const y = centerY + radius * decayFactor * Math.sin(t * (freq2 * 0.8) + Math.PI/6 + time * 0.5);
        
        if (t === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = colorScheme === 'default' ? colors.accent : colors.secondary;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // Wave visualization
    const drawWaveform = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const waveData = audioData.timeData || new Float32Array(1024);
      
      ctx.strokeStyle = colorScheme === 'default' ? colors.secondary : colors.primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const sliceWidth = canvas.width / waveData.length;
      let x = 0;
      
      for (let i = 0; i < waveData.length; i++) {
        const v = waveData[i] * 0.5 * (params.sensitivity / 100 * 3);
        const y = (canvas.height / 2) + (v * canvas.height / 2);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.shadowBlur = 10;
      ctx.shadowColor = colorScheme === 'default' ? colors.secondary : colors.primary;
      ctx.stroke();
    };

    // Particle visualization
    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const freqData = audioData.frequencyData || new Uint8Array(1024);
      const particles = [];
      const particleCount = 50 + Math.floor(params.complexity);
      
      for (let i = 0; i < particleCount; i++) {
        const index = Math.floor(i / particleCount * freqData.length);
        const amplitude = freqData[index] / 255.0;
        
        const size = 2 + (amplitude * 10 * params.sensitivity / 100);
        const x = canvas.width / 2 + Math.cos(i / particleCount * Math.PI * 2 + time) * (100 + amplitude * 200);
        const y = canvas.height / 2 + Math.sin(i / particleCount * Math.PI * 2 + time) * (100 + amplitude * 200);
        
        particles.push({ x, y, size, amplitude });
      }
      
      // Draw particles
      particles.forEach((particle) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size
        );
        
        gradient.addColorStop(0, colorScheme === 'default' ? colors.secondary : colors.primary);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fill();
      });
      
      // Connect particles with lines
      ctx.strokeStyle = colorScheme === 'default' ? colors.accent : colors.secondary;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.globalAlpha = 1 - (distance / 100);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      
      ctx.globalAlpha = 1;
    };

    // Basic fractal visualization
    const drawFractal = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxSize = Math.min(canvas.width, canvas.height) * 0.4;
      
      const drawBranch = (x: number, y: number, length: number, angle: number, depth: number) => {
        if (depth <= 0) return;
        
        const endX = x + length * Math.cos(angle);
        const endY = y + length * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        
        // Color based on depth
        const colorIndex = depth % 3;
        const colors = [
          colorScheme === 'default' ? '#6042A6' : '#4ECDC4',
          colorScheme === 'default' ? '#4ECDC4' : '#FF6B6B',
          colorScheme === 'default' ? '#FF6B6B' : '#6042A6'
        ];
        
        ctx.strokeStyle = colors[colorIndex];
        ctx.lineWidth = depth * 0.5;
        ctx.stroke();
        
        // Calculate branch factor based on complexity
        const branchFactor = 0.65 + (params.complexity / 100) * 0.1;
        const angleOffset = Math.PI / 6 + (params.sensitivity / 100) * (Math.PI / 12);
        
        // Recursive calls for branches
        drawBranch(endX, endY, length * branchFactor, angle - angleOffset, depth - 1);
        drawBranch(endX, endY, length * branchFactor, angle + angleOffset, depth - 1);
      };
      
      // Start the fractal
      const maxDepth = 9 + Math.floor(params.complexity / 20);
      drawBranch(centerX, centerY + maxSize, maxSize, -Math.PI / 2, maxDepth);
    };

    // Animation loop
    const animate = () => {
      time += 0.01;
      
      // Adjust animation speed based on activity
      if (isActive) {
        time += 0.01 * (params.sensitivity / 50);
      }
      
      // Choose visualization based on mode
      switch (mode) {
        case 'waveform':
          drawWaveform();
          break;
        case 'particles':
          drawParticles();
          break;
        case 'fractal':
          drawFractal();
          break;
        case 'harmonograph':
        default:
          drawHarmonograph();
          break;
      }
      
      animationId = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [mode, params, colorScheme, audioData, isActive, detectedChord]);

  return (
    <div id="visualization-canvas" className="absolute inset-0 bg-dark z-10">
      <canvas ref={mainCanvasRef} id="main-canvas" className="w-full h-full" />
    </div>
  );
}
