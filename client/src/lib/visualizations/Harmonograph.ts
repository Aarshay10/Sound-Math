export interface HarmonographSettings {
  frequency1: number;
  frequency2: number;
  frequency3: number;
  frequency4: number;
  phase1: number;
  phase2: number;
  phase3: number;
  phase4: number;
  decay: number;
  amplitude1: number;
  amplitude2: number;
  amplitude3: number;
  amplitude4: number;
}

export class Harmonograph {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private settings: HarmonographSettings;
  private time: number = 0;
  private animationId: number | null = null;
  private primaryColor: string = '#4ECDC4';
  private secondaryColor: string = '#FF6B6B';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;

    // Default settings
    this.settings = {
      frequency1: 2.0,
      frequency2: 2.01,
      frequency3: 3.0,
      frequency4: 3.01,
      phase1: Math.PI / 4,
      phase2: 0,
      phase3: Math.PI / 6,
      phase4: 0,
      decay: 0.008,
      amplitude1: 1.0,
      amplitude2: 1.0,
      amplitude3: 1.0,
      amplitude4: 1.0
    };
  }

  updateSettings(newSettings: Partial<HarmonographSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  setColors(primary: string, secondary: string): void {
    this.primaryColor = primary;
    this.secondaryColor = secondary;
  }

  start(): void {
    if (this.animationId) return;
    this.animate();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate(): void {
    // Increase animation speed slightly for more dynamic movement
    this.time += 0.015;
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  // Completely redraw the harmonograph from scratch
  draw(): void {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;

    // Draw first curve
    this.ctx.strokeStyle = this.primaryColor;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    for (let t = 0; t < 100; t += 0.1) {
      const decay = Math.exp(-this.settings.decay * t);
      
      // X coordinate is influenced by pendulum 1 and 3
      const x = centerX + radius * decay * (
        this.settings.amplitude1 * Math.sin(t * this.settings.frequency1 + this.settings.phase1 + this.time) + 
        this.settings.amplitude3 * Math.sin(t * this.settings.frequency3 + this.settings.phase3)
      );
      
      // Y coordinate is influenced by pendulum 2 and 4
      const y = centerY + radius * decay * (
        this.settings.amplitude2 * Math.sin(t * this.settings.frequency2 + this.settings.phase2 + this.time * 0.7) +
        this.settings.amplitude4 * Math.sin(t * this.settings.frequency4 + this.settings.phase4)
      );
      
      if (t === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    // Add glow effect
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = this.primaryColor;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    
    // Draw second curve with variations
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.secondaryColor;
    
    for (let t = 0; t < 100; t += 0.1) {
      const decay = Math.exp(-this.settings.decay * t);
      
      const x = centerX + radius * decay * (
        this.settings.amplitude1 * Math.sin(t * (this.settings.frequency1 * 1.5) + this.settings.phase1 + this.time * 1.1) +
        this.settings.amplitude3 * Math.sin(t * (this.settings.frequency3 * 0.8) + this.settings.phase3)
      );
      
      const y = centerY + radius * decay * (
        this.settings.amplitude2 * Math.sin(t * (this.settings.frequency2 * 0.9) + this.settings.phase2 + this.time * 0.5) +
        this.settings.amplitude4 * Math.sin(t * (this.settings.frequency4 * 1.2) + this.settings.phase4)
      );
      
      if (t === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = this.secondaryColor;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  // Update visualization based on audio frequencies (chord detection)
  updateFromChord(frequencies: number[]): void {
    if (frequencies.length === 0) return;

    // More sophisticated frequency normalization
    const normalizeFreq = (freq: number, minRange = 1.0, maxRange = 4.5) => {
      // Map frequency with logarithmic scaling for more musical response
      // Guitar frequencies are typically 80-1200 Hz (low E to high E 3rd octave)
      const minFreq = 80;
      const maxFreq = 1200;
      const logMin = Math.log(minFreq);
      const logMax = Math.log(maxFreq);
      const logFreq = Math.log(Math.max(freq, minFreq));
      
      // Get normalized position in logarithmic scale (0-1)
      const normalizedLog = (logFreq - logMin) / (logMax - logMin);
      
      // Map to desired range with exponential curve for more dynamic visual changes
      return minRange + Math.pow(normalizedLog, 1.5) * (maxRange - minRange);
    };

    // Get frequencies, ensuring we have at least 4 values even if we need to repeat
    const freq1 = frequencies[0] || 440;
    const freq2 = frequencies[1] || freq1 * 1.5;
    const freq3 = frequencies[2] || freq1 * 2;
    const freq4 = frequencies[3] || freq2 * 1.25;

    // Calculate musical ratios - these create more harmonically interesting patterns
    const ratio1 = freq1 / 440; // A4 reference
    const ratio2 = freq2 / freq1; // interval between first and second note
    const ratio3 = freq3 / freq1; // interval between first and third note
    const ratio4 = freq4 / freq1; // interval between first and fourth note

    // Introduce the golden ratio for more pleasing visual patterns
    const golden = 1.618033988749895;
    const phi = (Math.sqrt(5) + 1) / 2; // Another expression of golden ratio 

    // Calculate frequency complexity - how "spread out" the frequencies are
    const uniqueFreqCount = new Set(frequencies.map(f => Math.round(f))).size;
    const complexityFactor = Math.min(uniqueFreqCount / 3, 1); // 0-1 range

    // Calculate musical dissonance based on frequency ratios
    // Perfect fifth (1.5) and octave (2.0) are consonant, other ratios can be dissonant
    const dissonanceFactor = Math.min(
      Math.abs(ratio2 - 1.5) + Math.abs(ratio3 - 2.0), 
      1
    );

    // Base frequency settings on musical properties
    const baseFreq1 = normalizeFreq(freq1, 1.0, 3.0);
    const baseFreq2 = normalizeFreq(freq2, 1.0, 3.0);

    // Update harmonograph settings with more expressive parameters
    this.updateSettings({
      // Add slight detuning and time-based modulation for more organic feel
      frequency1: baseFreq1 + Math.sin(this.time * 0.05) * 0.05,
      frequency2: baseFreq1 * (1 + 0.01 * complexityFactor) + Math.sin(this.time * 0.06) * 0.06,
      frequency3: baseFreq2 + Math.sin(this.time * 0.03) * 0.04,
      frequency4: baseFreq2 * phi + Math.sin(this.time * 0.04) * 0.03,
      
      // More dynamic phase relationships based on ratios and time
      phase1: Math.PI * (ratio1 % 1) + Math.sin(this.time * 0.02) * 0.1,
      phase2: Math.PI * (ratio2 % 1) + Math.cos(this.time * 0.03) * 0.1,
      phase3: Math.PI * (ratio3 % 1) + Math.sin(this.time * 0.01) * 0.1,
      phase4: Math.PI * (ratio4 % 1) + Math.cos(this.time * 0.02) * 0.1,
      
      // Vary decay based on complexity - more complex chords decay slower
      // This creates more intricate patterns for complex harmonies
      decay: 0.004 + (0.004 * (1 - complexityFactor)),
      
      // Dynamic amplitudes based on ratios and dissonance
      amplitude1: 1.0,
      amplitude2: 0.9 + 0.1 * Math.sin(ratio1 * Math.PI),
      amplitude3: 0.75 + 0.25 * Math.sin(ratio2 * Math.PI) + 0.1 * dissonanceFactor,
      amplitude4: 0.65 + 0.35 * Math.sin(ratio3 * Math.PI) + 0.2 * complexityFactor
    });
  }

  // Resize the canvas to fit its container
  resize(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    
    // Redraw after resize
    this.draw();
  }
}
