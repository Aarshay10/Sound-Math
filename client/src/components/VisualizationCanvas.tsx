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

    // Validate params to prevent invalid calculations
    const validatedParams = {
      complexity: isFinite(params.complexity) ? Math.max(0, Math.min(100, params.complexity)) : 50,
      sensitivity: isFinite(params.sensitivity) ? Math.max(0, Math.min(100, params.sensitivity)) : 50,
      decay: isFinite(params.decay) ? Math.max(0, Math.min(100, params.decay)) : 50
    };

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
      // Validate canvas dimensions
      if (!canvas.width || !canvas.height || !isFinite(canvas.width) || !isFinite(canvas.height)) {
        return; // Exit if canvas dimensions are invalid
      }
      
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
      const freq1 = baseFreq * (1 + validatedParams.complexity / 100);
      const freq2 = baseFreq * 1.5 * (1 + validatedParams.complexity / 200);
      const decay = 0.004 + (validatedParams.decay / 100) * 0.02;
      
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
      // Validate canvas dimensions
      if (!canvas.width || !canvas.height || !isFinite(canvas.width) || !isFinite(canvas.height)) {
        return; // Exit if canvas dimensions are invalid
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const waveData = audioData?.timeData || new Float32Array(1024);
      if (!waveData || waveData.length === 0) {
        return; // Exit if no time data
      }
      
      ctx.strokeStyle = colorScheme === 'default' ? colors.secondary : colors.primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const sliceWidth = canvas.width / waveData.length;
      let x = 0;
      
      for (let i = 0; i < waveData.length; i++) {
        const v = waveData[i] * 0.5 * (validatedParams.sensitivity / 100 * 3);
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

    // Define particle interface
    interface Particle {
      x: number;
      y: number;
      size: number;
      amplitude: number;
      speedFactor?: number;
    }
    
    // Particle visualization
    const drawParticles = () => {
      // Validate canvas dimensions
      if (!canvas.width || !canvas.height || !isFinite(canvas.width) || !isFinite(canvas.height)) {
        return; // Exit if canvas dimensions are invalid
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const freqData = audioData?.frequencyData || new Uint8Array(1024);
      if (!freqData || freqData.length === 0) {
        return; // Exit if no frequency data
      }
      const particles: Particle[] = [];
      
      // Reduce particle count to make it less cluttered
      const particleCount = 20 + Math.floor(validatedParams.complexity / 2);
      
      // Get chord frequency data for more dynamic movement
      const chordFrequencies = detectedChord?.frequencies || [];
      if (!Array.isArray(chordFrequencies)) {
        return; // Exit if chord frequencies are invalid
      }
      
      // Create particles
      for (let i = 0; i < particleCount; i++) {
        // Use specific frequency ranges for better visual mapping
        const freqIndex = Math.floor(i / particleCount * (freqData.length / 2));
        
        // Validate frequency data
        if (!freqData[freqIndex] || !isFinite(freqData[freqIndex])) {
          continue; // Skip this particle if frequency data is invalid
        }
        
        // More responsive amplitude calculation
        const amplitude = Math.pow(freqData[freqIndex] / 255.0, 1.2); // Non-linear response
        
        // Larger particle sizes
        const baseSizeFactor = 3.5; // Increased base size
        const sizeFactor = 15 * (validatedParams.sensitivity / 100); // More sensitive to controls
        const size = baseSizeFactor + (amplitude * sizeFactor);
        
        // More dynamic movements based on chord frequencies and time
        let orbitSize = 120 + amplitude * 250;
        let speedFactor = 1.0;
        
        // If we have chord data, use it to influence the particle behavior
        if (chordFrequencies.length > 0) {
          const chordFreq = chordFrequencies[i % chordFrequencies.length];
          if (chordFreq && isFinite(chordFreq) && chordFreq > 0) {
            const freqInfluence = chordFreq / 440; // A4 reference
            orbitSize = 100 + amplitude * 200 * freqInfluence;
            speedFactor = 0.8 + (freqInfluence % 1) * 0.8;
          }
        }
        
        // Calculate position with more organic movement
        const angle = (i / particleCount * Math.PI * 2) + (time * speedFactor);
        const wobble = Math.sin(time * 0.5 + i) * 10 * amplitude;
        
        const x = canvas.width / 2 + Math.cos(angle) * (orbitSize + wobble);
        const y = canvas.height / 2 + Math.sin(angle) * (orbitSize + wobble);
        
        // Validate calculated values before adding particle
        if (isFinite(x) && isFinite(y) && isFinite(size) && size > 0) {
          particles.push({ x, y, size, amplitude, speedFactor });
        }
      }
      
      // Draw connections first (behind particles for better layering)
      ctx.strokeStyle = colorScheme === 'default' ? colors.accent : colors.secondary;
      ctx.lineWidth = 0.8; // Slightly thicker lines
      
      // Connect fewer particles to reduce clutter
      const connectionDistance = 150; // Larger distance threshold
      const maxConnections = 3; // Limit connections per particle
      
      for (let i = 0; i < particles.length; i++) {
        let connectionCount = 0;
        
        // Sort nearest particles for better connection patterns
        interface NearbyParticle {
          particle: Particle;
          distance: number;
        }
        
        const nearbyParticles: NearbyParticle[] = particles.slice()
          .filter((p, idx) => idx !== i)
          .map(p => {
            const dx = particles[i].x - p.x;
            const dy = particles[i].y - p.y;
            return { particle: p, distance: Math.sqrt(dx * dx + dy * dy) };
          })
          .filter(p => p.distance < connectionDistance)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, maxConnections);
          
        // Draw connections to nearest particles
        for (const nearby of nearbyParticles) {
          // Validate particle coordinates before drawing
          if (!isFinite(particles[i].x) || !isFinite(particles[i].y) || 
              !isFinite(nearby.particle.x) || !isFinite(nearby.particle.y)) {
            continue; // Skip invalid connections
          }
          
          const opacity = 1 - (nearby.distance / connectionDistance);
          ctx.globalAlpha = opacity * 0.7; // Slightly more transparent
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(nearby.particle.x, nearby.particle.y);
          ctx.stroke();
          
          connectionCount++;
          if (connectionCount >= maxConnections) break;
        }
      }
      
      // Reset opacity for particles
      ctx.globalAlpha = 1;
      
      // Draw particles
      particles.forEach((particle) => {
        // Validate particle data to prevent NaN/Infinity errors
        if (!isFinite(particle.x) || !isFinite(particle.y) || !isFinite(particle.size) || particle.size <= 0) {
          return; // Skip invalid particles
        }
        
        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = colorScheme === 'default' ? colors.secondary : colors.primary;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        
        // More vibrant gradients
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size
        );
        
        // Color based on color scheme with better transitions
        const innerColor = colorScheme === 'default' ? colors.secondary : colors.primary;
        const outerColor = colorScheme === 'default' ? 'rgba(78, 205, 196, 0.1)' : 'rgba(96, 66, 166, 0.1)';
        
        gradient.addColorStop(0, innerColor);
        gradient.addColorStop(0.6, innerColor + '80'); // Semi-transparent
        gradient.addColorStop(1, outerColor);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Reset shadow for next particle
        ctx.shadowBlur = 0;
      });
      
      ctx.globalAlpha = 1;
    };

    // Basic fractal visualization
    const drawFractal = () => {
      // Validate canvas dimensions
      if (!canvas.width || !canvas.height || !isFinite(canvas.width) || !isFinite(canvas.height)) {
        return; // Exit if canvas dimensions are invalid
      }
      
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
        const branchFactor = 0.65 + (validatedParams.complexity / 100) * 0.1;
        const angleOffset = Math.PI / 6 + (validatedParams.sensitivity / 100) * (Math.PI / 12);
        
        // Recursive calls for branches
        drawBranch(endX, endY, length * branchFactor, angle - angleOffset, depth - 1);
        drawBranch(endX, endY, length * branchFactor, angle + angleOffset, depth - 1);
      };
      
      // Start the fractal
      const maxDepth = 9 + Math.floor(validatedParams.complexity / 20);
      drawBranch(centerX, centerY + maxSize, maxSize, -Math.PI / 2, maxDepth);
    };

    // Animation loop
    const animate = () => {
      // Validate time variable to prevent it from becoming infinite
      if (!isFinite(time)) {
        time = 0;
      }
      
      time += 0.01;
      
      // Adjust animation speed based on activity
      if (isActive) {
        const timeIncrement = 0.01 * (validatedParams.sensitivity / 50);
        if (isFinite(timeIncrement)) {
          time += timeIncrement;
        }
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
    <div id="visualization-canvas" className="absolute inset-0 bg-dark z-0">
      <canvas ref={mainCanvasRef} id="main-canvas" className="w-full h-full" />
    </div>
  );
}
