import { AudioData, ChordNote } from "@/types";

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isInitialized = false;
  private isProcessing = false;
  private frequencyData: Uint8Array = new Uint8Array();
  private timeData: Float32Array = new Float32Array();
  private fftSize = 2048;
  private updateCallbacks: ((data: AudioData) => void)[] = [];

  constructor() {
    this.resetData();
  }

  private resetData() {
    this.frequencyData = new Uint8Array();
    this.timeData = new Float32Array();
  }

  async initialize(deviceId?: string): Promise<boolean> {
    try {
      console.log("Requesting microphone access...");
      
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Media devices API not available in this browser");
        return false;
      }
      
      // Try accessing user media first to ensure permissions are granted
      // before creating audio context (important for iOS Safari)
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        video: false,
      };
      
      // Release previous stream if exists
      if (this.stream) {
        this.stop();
      }
      
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Create new AudioContext if not already created
      // Do this AFTER getting user media to avoid auto-suspend in some browsers
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume the audio context (may be suspended in some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create source and analyser nodes
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect nodes
      this.source.connect(this.analyser);

      // Create data arrays of appropriate size
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Float32Array(this.analyser.fftSize);

      console.log("Audio successfully initialized");
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Error initializing audio:", error);
      return false;
    }
  }

  start() {
    if (!this.isInitialized || this.isProcessing) return;
    this.isProcessing = true;
    this.processAudio();
  }

  stop() {
    this.isProcessing = false;
    
    // Stop and clean up audio stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    this.analyser = null;
    this.resetData();
  }

  private processAudio() {
    if (!this.isProcessing || !this.analyser) return;

    // Get audio data
    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getFloatTimeDomainData(this.timeData);

    // Notify listeners with new data
    this.notifyListeners();

    // Continue processing
    requestAnimationFrame(() => this.processAudio());
  }

  subscribe(callback: (data: AudioData) => void) {
    this.updateCallbacks.push(callback);
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyListeners() {
    const data: AudioData = {
      frequencyData: this.frequencyData,
      timeData: this.timeData,
    };

    this.updateCallbacks.forEach(callback => callback(data));
  }

  // Get the current audio devices
  async getAudioInputs(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      console.error("Failed to get audio inputs:", error);
      return [];
    }
  }

  // Detect the most prominent frequency in the current audio data
  detectDominantFrequency(): number | null {
    if (!this.frequencyData.length) return null;

    // Find the index with maximum amplitude
    let maxIndex = 0;
    let maxValue = 0;

    for (let i = 0; i < this.frequencyData.length; i++) {
      if (this.frequencyData[i] > maxValue) {
        maxValue = this.frequencyData[i];
        maxIndex = i;
      }
    }

    // Ignore if amplitude is too low (silence)
    if (maxValue < 10) return null;

    // Convert bin index to frequency 
    // Formula: frequency = index * (sample rate / fft size)
    const sampleRate = this.audioContext?.sampleRate || 44100;
    return maxIndex * sampleRate / (this.fftSize * 2);
  }

  // Get the current FFT data
  getFFTData(): Uint8Array {
    return this.frequencyData;
  }

  // Get the current time domain data
  getTimeDomainData(): Float32Array {
    return this.timeData;
  }

  // Calculate the relative energy/amplitude of the current audio
  getAmplitude(): number {
    if (!this.timeData.length) return 0;

    // Calculate RMS amplitude
    let sum = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      sum += this.timeData[i] * this.timeData[i];
    }

    return Math.sqrt(sum / this.timeData.length);
  }

  // Check if audio is "active" (has significant sound)
  isAudioActive(): boolean {
    // First check if we have an initialized stream and analyzer
    if (!this.stream || !this.analyser || !this.isInitialized) {
      return false;
    }
    
    // Lower threshold to be more sensitive to input
    return this.getAmplitude() > 0.005;
  }
}

export const audioProcessor = new AudioProcessor();
