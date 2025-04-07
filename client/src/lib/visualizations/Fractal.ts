export class Fractal {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private primaryColor: string = '#4ECDC4';
  private secondaryColor: string = '#FF6B6B';
  private tertiaryColor: string = '#6042A6';
  private complexity: number = 50;
  private sensitivity: number = 50;
  private time: number = 0;
  private chordFrequencies: number[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
  }

  setColors(primary: string, secondary: string, tertiary: string = '#6042A6'): void {
    this.primaryColor = primary;
    this.secondaryColor = secondary;
    this.tertiaryColor = tertiary;
  }

  setParameters(sensitivity: number, complexity: number): void {
    this.sensitivity = sensitivity;
    this.complexity = complexity;
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
    this.time += 0.01;
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  draw(): void {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.4;
    
    // Calculate branch parameters based on chord frequencies
    let branchRatio = 0.67;
    let angleOffset = Math.PI / 4;
    let maxDepth = 9 + Math.floor(this.complexity / 20);
    
    if (this.chordFrequencies.length) {
      // Use frequencies to influence the fractal
      const baseFreq = this.chordFrequencies[0] || 440;
      
      // Extract frequency ratios (normalized to base frequency)
      const ratios = this.chordFrequencies.map(f => f / baseFreq);
      
      // Adjust branch ratio based on first ratio
      if (ratios.length > 1) {
        // Map ratio to a reasonable branch ratio range (0.5 - 0.8)
        branchRatio = 0.5 + Math.min(Math.max((ratios[1] % 1), 0), 0.5) * 0.6;
      }
      
      // Adjust angle based on second ratio
      if (ratios.length > 2) {
        // Map to angle range (PI/6 - PI/3)
        angleOffset = Math.PI/6 + Math.min(Math.max((ratios[2] % 1), 0), 0.5) * Math.PI/6;
      }
    }
    
    // Apply sensitivity to angle
    angleOffset *= (0.7 + this.sensitivity / 100 * 0.6);
    
    // Draw the fractal
    this.drawBranch(centerX, centerY + size, size, -Math.PI / 2, maxDepth, branchRatio, angleOffset);
  }

  private drawBranch(
    x: number, 
    y: number, 
    length: number, 
    angle: number, 
    depth: number,
    branchRatio: number,
    angleOffset: number
  ): void {
    if (depth <= 0) return;
    
    const endX = x + length * Math.cos(angle);
    const endY = y + length * Math.sin(angle);
    
    // Choose color based on depth
    const colorIndex = depth % 3;
    const colors = [
      this.primaryColor,
      this.secondaryColor,
      this.tertiaryColor
    ];
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(endX, endY);
    
    // Vary line width with depth
    this.ctx.lineWidth = depth * 0.5;
    this.ctx.strokeStyle = colors[colorIndex];
    
    // Add slight glow for visual appeal
    this.ctx.shadowBlur = 5;
    this.ctx.shadowColor = colors[colorIndex];
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    
    // Time-based angle variation for subtle animation
    const timeVary = Math.sin(this.time + depth * 0.1) * 0.05;
    
    // Recursively draw branches
    this.drawBranch(
      endX, 
      endY, 
      length * branchRatio, 
      angle - angleOffset + timeVary, 
      depth - 1,
      branchRatio,
      angleOffset
    );
    
    this.drawBranch(
      endX, 
      endY, 
      length * branchRatio, 
      angle + angleOffset + timeVary, 
      depth - 1,
      branchRatio,
      angleOffset
    );
    
    // Add a third branch for more complex fractals when complexity is high
    if (this.complexity > 70 && depth > 3) {
      this.drawBranch(
        endX, 
        endY, 
        length * branchRatio * 0.8, 
        angle + timeVary * 2, 
        depth - 2,
        branchRatio,
        angleOffset
      );
    }
  }

  resize(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    
    // Force a redraw
    this.draw();
  }
}
