import * as THREE from 'three';
import { ChordNote, Chord } from '@/types';

export class AudioVisualizer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particles: THREE.Points;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.PointsMaterial;
  private particlePositions: Float32Array;
  private particleVelocities: Float32Array[];
  private particleColors: Float32Array;
  private lastChord: Chord | null = null;
  private lastNote: ChordNote | null = null;
  private time: number = 0;
  private audioLevel: number = 0;
  private noiseTexture: THREE.DataTexture;
  private noiseData: Float32Array;
  private noiseSize: number = 64;

  constructor(container: HTMLElement) {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    // Camera setup
    this.camera.position.z = 5;

    // Initialize noise texture for TouchDesigner-like effects
    this.noiseData = new Float32Array(this.noiseSize * this.noiseSize);
    this.noiseTexture = new THREE.DataTexture(
      this.noiseData,
      this.noiseSize,
      this.noiseSize,
      THREE.RedFormat,
      THREE.FloatType
    );
    this.noiseTexture.needsUpdate = true;

    // Initialize particle system
    const particleCount = 2000; // Increased particle count for more complex patterns
    this.particleGeometry = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(particleCount * 3);
    this.particleVelocities = Array(particleCount).fill(null).map(() => new Float32Array(3));
    this.particleColors = new Float32Array(particleCount * 3);

    // Initialize particles in a sphere
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      this.particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      this.particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      this.particlePositions[i3 + 2] = radius * Math.cos(phi);

      // Initialize velocities with more variation
      this.particleVelocities[i][0] = (Math.random() - 0.5) * 0.04;
      this.particleVelocities[i][1] = (Math.random() - 0.5) * 0.04;
      this.particleVelocities[i][2] = (Math.random() - 0.5) * 0.04;

      // Initialize colors with more vibrant starting values
      this.particleColors[i3] = Math.random() * 0.5 + 0.5;
      this.particleColors[i3 + 1] = Math.random() * 0.5 + 0.5;
      this.particleColors[i3 + 2] = Math.random() * 0.5 + 0.5;
    }

    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));

    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particles);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Start animation loop
    this.animate();
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public updateAudioData(chord: Chord, note: ChordNote) {
    this.lastChord = chord;
    this.lastNote = note;
    
    // Update audio level based on chord/note presence
    this.audioLevel = chord.notes.length > 0 ? 1 : (note.frequency > 0 ? 0.5 : 0);
  }

  private updateNoiseTexture() {
    for (let i = 0; i < this.noiseData.length; i++) {
      this.noiseData[i] = Math.random();
    }
    this.noiseTexture.needsUpdate = true;
  }

  private applyTouchDesignerPatterns() {
    const frequency = this.lastNote?.frequency || 0;
    const chordSize = this.lastChord?.notes.length || 1;
    
    for (let i = 0; i < this.particlePositions.length / 3; i++) {
      const i3 = i * 3;
      
      if (this.lastChord && this.lastChord.notes.length > 1) {
        // TouchDesigner-inspired chord visualization
        const angle = (i / (this.particlePositions.length / 3)) * Math.PI * 2;
        const radius = 2 + Math.sin(this.time + i * 0.1) * 0.5;
        const noise = this.noiseData[i % this.noiseData.length];
        
        // Add noise-based displacement
        const noiseOffset = noise * 0.5 * this.audioLevel;
        
        this.particlePositions[i3] = Math.cos(angle) * radius + noiseOffset;
        this.particlePositions[i3 + 1] = Math.sin(angle) * radius + noiseOffset;
        this.particlePositions[i3 + 2] = Math.sin(this.time + i * 0.1) * 0.5 + noiseOffset;
        
        // Color based on chord type with noise influence
        const hue = (this.time * 0.1 + i * 0.01 + noise * 0.2) % 1;
        this.particleColors[i3] = hue;
        this.particleColors[i3 + 1] = (hue + 0.3 + noise * 0.1) % 1;
        this.particleColors[i3 + 2] = (hue + 0.6 + noise * 0.1) % 1;
      } else {
        // TouchDesigner-inspired single note visualization
        const spiral = (i / (this.particlePositions.length / 3)) * Math.PI * 4;
        const radius = 1 + Math.sin(this.time * 2 + i * 0.1) * 0.5;
        const noise = this.noiseData[i % this.noiseData.length];
        
        // Add frequency-based modulation
        const freqMod = Math.sin(frequency * 0.01) * 0.5;
        
        this.particlePositions[i3] = Math.cos(spiral) * radius + noise * freqMod;
        this.particlePositions[i3 + 1] = Math.sin(spiral) * radius + noise * freqMod;
        this.particlePositions[i3 + 2] = Math.sin(this.time + i * 0.1) * 0.5 + noise * freqMod;
        
        // Color based on frequency with noise influence
        const hue = ((frequency / 1000) + noise * 0.2) % 1;
        this.particleColors[i3] = hue;
        this.particleColors[i3 + 1] = (hue + 0.2 + noise * 0.1) % 1;
        this.particleColors[i3 + 2] = (hue + 0.4 + noise * 0.1) % 1;
      }
    }
  }

  private animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.time += 0.01;

    // Update noise texture periodically
    if (Math.floor(this.time * 10) % 5 === 0) {
      this.updateNoiseTexture();
    }

    // Apply TouchDesigner-inspired patterns
    this.applyTouchDesignerPatterns();

    // Update particle attributes
    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.color.needsUpdate = true;

    // Dynamic camera movement
    this.camera.position.x = Math.sin(this.time * 0.2) * 2;
    this.camera.position.y = Math.cos(this.time * 0.2) * 2;
    this.camera.lookAt(0, 0, 0);

    // Rotate the entire particle system with dynamic speed
    const rotationSpeed = 0.1 + this.audioLevel * 0.2;
    this.particles.rotation.y = this.time * rotationSpeed;
    this.particles.rotation.x = Math.sin(this.time * 0.2) * 0.2;

    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.renderer.dispose();
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.noiseTexture.dispose();
  }
} 