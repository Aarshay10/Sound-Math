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
    this.time += 0.01;
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

    // Normalize frequencies to usable ranges for the visualization
    const normalizeFreq = (freq: number) => {
      // Map frequency (typically 80-1000 Hz for guitar) to 1.0-4.0 range
      return 1.0 + (Math.min(Math.max(freq, 80), 1000) - 80) / 920 * 3.0;
    };

    // Get up to 3 frequencies
    const freq1 = frequencies[0] || 440;
    const freq2 = frequencies[1] || freq1 * 1.5;
    const freq3 = frequencies[2] || freq1 * 2;

    // Calculate frequency ratios
    const ratio1 = freq1 / 440; // A4 reference
    const ratio2 = freq2 / freq1;
    const ratio3 = freq3 / freq1;

    // Update harmonograph settings based on detected frequencies
    this.updateSettings({
      frequency1: normalizeFreq(freq1),
      frequency2: normalizeFreq(freq1) * 1.01, // Slight detuning creates interesting patterns
      frequency3: normalizeFreq(freq2),
      frequency4: normalizeFreq(freq3),
      
      // Phase shifts based on frequency relationships
      phase1: Math.PI / 4,
      phase2: Math.PI * (ratio1 % 1),
      phase3: Math.PI * (ratio2 % 1),
      phase4: Math.PI * (ratio3 % 1),
      
      // Amplitude can be adjusted based on how "pure" the frequencies are
      amplitude1: 1.0,
      amplitude2: 0.8 + 0.2 * Math.sin(ratio1 * Math.PI),
      amplitude3: 0.6 + 0.4 * Math.sin(ratio2 * Math.PI),
      amplitude4: 0.5 + 0.5 * Math.sin(ratio3 * Math.PI)
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
