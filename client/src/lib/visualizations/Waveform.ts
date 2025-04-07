export class Waveform {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private timeData: Float32Array = new Float32Array();
  private frequencyData: Uint8Array = new Uint8Array();
  private animationId: number | null = null;
  private primaryColor: string = '#4ECDC4';
  private secondaryColor: string = '#FF6B6B';
  private sensitivity: number = 1.0;
  private chordFrequencies: number[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
  }

  setColors(primary: string, secondary: string): void {
    this.primaryColor = primary;
    this.secondaryColor = secondary;
  }

  setSensitivity(value: number): void {
    // Map 0-100 to 0.5-3.0
    this.sensitivity = 0.5 + (value / 100) * 2.5;
  }

  updateData(timeData: Float32Array, frequencyData: Uint8Array): void {
    this.timeData = timeData;
    this.frequencyData = frequencyData;
  }

  setChordFrequencies(frequencies: number[]): void {
    this.chordFrequencies = frequencies;
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
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  draw(): void {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    // Only proceed if we have data
    if (!this.timeData.length && !this.frequencyData.length) return;

    // Draw waveform from time domain data
    if (this.timeData.length) {
      this.drawWaveform();
    }

    // Draw frequency spectrum in the background
    if (this.frequencyData.length) {
      this.drawFrequencySpectrum();
    }
  }

  private drawWaveform(): void {
    const { width, height } = this.canvas;
    
    this.ctx.strokeStyle = this.primaryColor;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    
    const sliceWidth = width / this.timeData.length;
    let x = 0;
    
    // First pass - smooth line
    for (let i = 0; i < this.timeData.length; i++) {
      const v = this.timeData[i] * this.sensitivity;
      const y = (height / 2) + (v * height / 2);
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    // Add glow effect
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = this.primaryColor;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    
    // Second pass - draw points at peaks
    this.ctx.fillStyle = this.secondaryColor;
    
    x = 0;
    const threshold = 0.5; // Threshold for peak detection
    
    for (let i = 1; i < this.timeData.length - 1; i++) {
      const prev = Math.abs(this.timeData[i-1]);
      const curr = Math.abs(this.timeData[i]);
      const next = Math.abs(this.timeData[i+1]);
      
      // Check if this is a local maximum
      if (curr > threshold * this.sensitivity && curr > prev && curr > next) {
        const v = this.timeData[i] * this.sensitivity;
        const y = (height / 2) + (v * height / 2);
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      x += sliceWidth;
    }
  }

  private drawFrequencySpectrum(): void {
    const { width, height } = this.canvas;
    
    // Only draw a portion of the spectrum (focus on audible frequencies)
    const maxDisplayBin = Math.min(this.frequencyData.length, 256);
    const barWidth = width / maxDisplayBin;
    
    // Draw as a semi-transparent area under the waveform
    this.ctx.fillStyle = this.secondaryColor;
    this.ctx.globalAlpha = 0.2;
    
    this.ctx.beginPath();
    this.ctx.moveTo(0, height);
    
    for (let i = 0; i < maxDisplayBin; i++) {
      const percent = this.frequencyData[i] / 255;
      const barHeight = height * percent * 0.5; // Only use half the height
      const x = i * barWidth;
      const y = height - barHeight;
      
      this.ctx.lineTo(x, y);
    }
    
    this.ctx.lineTo(width, height);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Reset alpha
    this.ctx.globalAlpha = 1.0;
    
    // Highlight chord frequencies
    if (this.chordFrequencies.length) {
      this.ctx.fillStyle = this.primaryColor;
      
      for (const freq of this.chordFrequencies) {
        // Estimate bin index from frequency
        // This is approximate and depends on sample rate and FFT size
        const binIndex = Math.round(freq / 22050 * maxDisplayBin);
        
        if (binIndex >= 0 && binIndex < maxDisplayBin) {
          const x = binIndex * barWidth;
          const percent = this.frequencyData[binIndex] / 255;
          const barHeight = height * percent * 0.7; // Make it taller
          
          this.ctx.fillRect(x - barWidth/2, height - barHeight, barWidth * 2, barHeight);
          
          // Add small label
          this.ctx.fillStyle = '#fff';
          this.ctx.font = '10px monospace';
          this.ctx.fillText(`${Math.round(freq)}Hz`, x - 15, height - barHeight - 5);
          this.ctx.fillStyle = this.primaryColor;
        }
      }
    }
  }

  resize(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    
    // Redraw after resize
    this.draw();
  }
}
