interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  color: string;
  alpha: number;
}

export class Particles {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private primaryColor: string = '#4ECDC4';
  private secondaryColor: string = '#FF6B6B';
  private time: number = 0;
  private complexity: number = 50;
  private sensitivity: number = 50;
  private audioAmplitude: number = 0;
  private chordFrequencies: number[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    
    // Initialize particles
    this.initParticles();
  }

  setColors(primary: string, secondary: string): void {
    this.primaryColor = primary;
    this.secondaryColor = secondary;
    
    // Update existing particle colors
    this.particles.forEach((particle, index) => {
      particle.color = index % 2 === 0 ? this.primaryColor : this.secondaryColor;
    });
  }

  setParameters(sensitivity: number, complexity: number): void {
    this.sensitivity = sensitivity;
    this.complexity = complexity;
    
    // Reinitialize particles if complexity changes significantly
    if (Math.abs(this.particles.length - this.getParticleCount()) > 5) {
      this.initParticles();
    }
  }

  updateAudioData(amplitude: number): void {
    // Smooth the amplitude changes
    this.audioAmplitude = this.audioAmplitude * 0.8 + amplitude * 0.2;
  }

  setChordFrequencies(frequencies: number[]): void {
    this.chordFrequencies = frequencies;
  }

  private getParticleCount(): number {
    // Base count plus complexity factor
    return 30 + Math.floor(this.complexity / 10);
  }

  private initParticles(): void {
    const { width, height } = this.canvas;
    const count = this.getParticleCount();
    
    this.particles = [];
    
    for (let i = 0; i < count; i++) {
      // Create particles in a circle
      const angle = (i / count) * Math.PI * 2;
      const distance = Math.random() * Math.min(width, height) * 0.3;
      
      this.particles.push({
        x: width / 2 + Math.cos(angle) * distance,
        y: height / 2 + Math.sin(angle) * distance,
        size: 2 + Math.random() * 3,
        speed: 0.2 + Math.random() * 0.5,
        angle: Math.random() * Math.PI * 2,
        color: i % 2 === 0 ? this.primaryColor : this.secondaryColor,
        alpha: 0.5 + Math.random() * 0.5
      });
    }
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
    this.updateParticles();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private updateParticles(): void {
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Use audio amplitude to influence particle motion
    const amplitudeFactor = this.audioAmplitude * this.sensitivity / 50;
    
    // For chord-based patterns
    const chordAngles: number[] = [];
    if (this.chordFrequencies.length) {
      this.chordFrequencies.forEach((freq, i) => {
        // Map frequencies to angles for movement patterns
        chordAngles.push((freq % 360) * Math.PI / 180);
      });
    }
    
    this.particles.forEach((particle, index) => {
      // Base movement with slight random drift
      particle.angle += (Math.sin(this.time) * 0.02) + (Math.random() - 0.5) * 0.01;
      
      // Add chord-based influence if available
      if (chordAngles.length) {
        const chordIndex = index % chordAngles.length;
        particle.angle += Math.sin(this.time + chordAngles[chordIndex]) * 0.03;
      }
      
      // Distance from center affects speed
      const dx = particle.x - centerX;
      const dy = particle.y - centerY;
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
      
      // Particles farther from center move slower
      const distanceFactor = 1 - Math.min(distanceFromCenter / (Math.min(width, height) * 0.5), 0.8);
      
      // Move the particle
      const speed = particle.speed * (1 + amplitudeFactor) * distanceFactor;
      particle.x += Math.cos(particle.angle) * speed;
      particle.y += Math.sin(particle.angle) * speed;
      
      // Add a slight attraction to center
      const centerAttractionSpeed = 0.01 * distanceFromCenter / 100;
      particle.x += (centerX - particle.x) * centerAttractionSpeed;
      particle.y += (centerY - particle.y) * centerAttractionSpeed;
      
      // Contain particles within bounds
      if (particle.x < 0 || particle.x > width || 
          particle.y < 0 || particle.y > height) {
        
        // Reset position to random location near center
        const resetAngle = Math.random() * Math.PI * 2;
        const resetDistance = Math.random() * Math.min(width, height) * 0.3;
        
        particle.x = centerX + Math.cos(resetAngle) * resetDistance;
        particle.y = centerY + Math.sin(resetAngle) * resetDistance;
        particle.angle = Math.random() * Math.PI * 2;
      }
      
      // Pulse size with audio
      particle.size = (2 + Math.random() * 3) * (1 + amplitudeFactor * 0.5);
    });
  }

  draw(): void {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    
    // Draw connections first
    this.drawConnections();
    
    // Then draw particles on top
    this.particles.forEach(particle => {
      this.ctx.beginPath();
      
      // Create a gradient for each particle
      const gradient = this.ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size
      );
      
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(1, 'transparent');
      
      this.ctx.fillStyle = gradient;
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    // Reset alpha
    this.ctx.globalAlpha = 1.0;
  }

  private drawConnections(): void {
    const maxDistance = 100 * (1 + this.complexity / 100);
    
    this.ctx.strokeStyle = this.secondaryColor;
    this.ctx.lineWidth = 0.5;
    
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          
          // Line opacity based on distance
          const opacity = 1 - (distance / maxDistance);
          this.ctx.globalAlpha = opacity * 0.5;
          
          this.ctx.stroke();
        }
      }
    }
    
    // Reset alpha
    this.ctx.globalAlpha = 1.0;
  }

  resize(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    
    // Re-initialize particles on resize
    this.initParticles();
    
    // Force a redraw
    this.draw();
  }
}
