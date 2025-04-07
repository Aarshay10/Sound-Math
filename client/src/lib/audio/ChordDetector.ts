import { ChordNote, Chord } from "@/types";

// Map of note names to their frequencies (A4 = 440 Hz)
const NOTE_FREQUENCIES: Record<string, number> = {
  'A': 440.00,
  'A#/Bb': 466.16,
  'B': 493.88,
  'C': 261.63,
  'C#/Db': 277.18,
  'D': 293.66,
  'D#/Eb': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F#/Gb': 369.99,
  'G': 392.00,
  'G#/Ab': 415.30
};

// Common chord formulas
const CHORD_FORMULAS: Record<string, string[]> = {
  '': ['1', '3', '5'],           // Major
  'm': ['1', 'b3', '5'],         // Minor
  '7': ['1', '3', '5', 'b7'],    // Dominant 7th
  'maj7': ['1', '3', '5', '7'],  // Major 7th
  'm7': ['1', 'b3', '5', 'b7'],  // Minor 7th
  'dim': ['1', 'b3', 'b5'],      // Diminished
  'aug': ['1', '3', '#5'],       // Augmented
  'sus4': ['1', '4', '5'],       // Suspended 4th
  'sus2': ['1', '2', '5'],       // Suspended 2nd
  '6': ['1', '3', '5', '6'],     // Major 6th
  'm6': ['1', 'b3', '5', '6']    // Minor 6th
};

// Interval ratios relative to the root note
const INTERVAL_RATIOS: Record<string, number> = {
  '1': 1,        // Root/Unison
  'b2': 16/15,   // Minor 2nd
  '2': 9/8,      // Major 2nd
  'b3': 6/5,     // Minor 3rd
  '3': 5/4,      // Major 3rd
  '4': 4/3,      // Perfect 4th
  'b5': 10/7,    // Diminished 5th
  '5': 3/2,      // Perfect 5th
  '#5': 8/5,     // Augmented 5th
  '6': 5/3,      // Major 6th
  'b7': 7/4,     // Minor 7th
  '7': 15/8      // Major 7th
};

export class ChordDetector {
  // Detect a chord based on frequency data
  detectChord(frequencyData: Uint8Array, sampleRate: number, fftSize: number): Chord {
    // If no significant audio, return null
    if (this.isDataMostlySilent(frequencyData)) {
      return {
        name: "",
        formula: "",
        notes: [],
        frequencies: []
      };
    }

    // Identify prominent frequencies/peaks
    const peaks = this.findFrequencyPeaks(frequencyData, sampleRate, fftSize);
    
    // If we don't have enough peaks for a chord, just return the detected notes
    if (peaks.length < 2) {
      const notes = peaks.map(freq => this.findClosestNote(freq));
      return {
        name: notes.length > 0 ? notes[0].name : "",
        formula: "",
        notes,
        frequencies: peaks
      };
    }

    // Try to identify the chord from the notes
    const notes = peaks.map(freq => this.findClosestNote(freq));
    const chord = this.identifyChord(notes);
    
    return {
      name: chord.name,
      formula: chord.formula,
      notes,
      frequencies: peaks
    };
  }

  // Check if the frequency data is mostly silent
  private isDataMostlySilent(frequencyData: Uint8Array): boolean {
    const threshold = 10; // Arbitrary low threshold for "silence"
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i];
    }
    const average = sum / frequencyData.length;
    return average < threshold;
  }

  // Find the most prominent frequency peaks in the data
  private findFrequencyPeaks(frequencyData: Uint8Array, sampleRate: number, fftSize: number, peakCount: number = 6): number[] {
    const binSize = sampleRate / fftSize;
    const peaks: { frequency: number, magnitude: number }[] = [];
    
    // Ignore the very low frequencies (below ~80Hz)
    const minBin = Math.floor(80 / binSize);
    
    // Find local maxima with minimum peak distance
    const minPeakDistance = 3; // Minimum distance between peaks in bins
    
    for (let i = minBin; i < frequencyData.length - 1; i++) {
      // Check if this bin is a local maximum
      if (frequencyData[i] > frequencyData[i-1] && 
          frequencyData[i] > frequencyData[i+1] &&
          frequencyData[i] > 20) { // Threshold to avoid noise
        
        // Check if it's far enough from existing peaks
        let farEnough = true;
        for (const peak of peaks) {
          const distance = Math.abs(i - peak.frequency / binSize);
          if (distance < minPeakDistance) {
            farEnough = false;
            // If this peak is stronger, replace the existing one
            if (frequencyData[i] > peak.magnitude) {
              peak.frequency = i * binSize;
              peak.magnitude = frequencyData[i];
            }
            break;
          }
        }
        
        if (farEnough) {
          peaks.push({
            frequency: i * binSize,
            magnitude: frequencyData[i]
          });
        }
      }
    }
    
    // Sort by magnitude and take the top N peaks
    peaks.sort((a, b) => b.magnitude - a.magnitude);
    return peaks.slice(0, peakCount).map(peak => peak.frequency);
  }

  // Find the closest musical note to a given frequency
  private findClosestNote(frequency: number): ChordNote {
    // Get the logarithmic distance to A4 (440 Hz)
    const a4 = 440;
    const halfStepRatio = Math.pow(2, 1/12);
    let halfSteps = Math.round(12 * Math.log2(frequency / a4));
    
    // Calculate the exact frequency of the closest note
    const closestFrequency = a4 * Math.pow(halfStepRatio, halfSteps);
    
    // Convert to a note name
    const octave = Math.floor((halfSteps + 57) / 12); // A4 is in octave 4
    const noteIndex = (halfSteps + 57) % 12;
    
    const noteNames = ['A', 'A#/Bb', 'B', 'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab'];
    const noteName = noteNames[noteIndex];
    
    return {
      name: noteName,
      octave,
      frequency: closestFrequency
    };
  }

  // Identify a chord based on a set of notes
  private identifyChord(notes: ChordNote[]): { name: string, formula: string } {
    if (notes.length === 0) {
      return { name: "", formula: "" };
    }
    
    // Get base note names without octaves for simpler matching
    const baseNotes = notes.map(note => note.name);
    
    // Try different roots to find a matching chord
    for (const rootNote of baseNotes) {
      for (const [suffix, formula] of Object.entries(CHORD_FORMULAS)) {
        // Calculate the expected note names for this chord
        const expectedNotes = this.calculateChordNotes(rootNote, formula);
        
        // Check if we have a significant match
        const matchCount = baseNotes.filter(note => 
          expectedNotes.includes(note.split('/')[0]) || // Handle exact matches
          expectedNotes.includes(note.split('/')[1])    // Handle enharmonic equivalents
        ).length;
        
        // Require at least 3 matches for triads or all notes in the chord
        const requiredMatches = Math.min(3, formula.length);
        
        if (matchCount >= requiredMatches) {
          // Clean up the root note name (prefer simpler names)
          const cleanRoot = rootNote.includes('/') ? rootNote.split('/')[0] : rootNote;
          return { 
            name: cleanRoot + suffix,
            formula: formula.join('-')
          };
        }
      }
    }
    
    // If no chord is identified, just return the first note
    return { 
      name: notes[0].name,
      formula: "1"
    };
  }

  // Calculate the notes in a chord based on root note and formula
  private calculateChordNotes(rootNote: string, formula: string[]): string[] {
    // Simplify root if it has enharmonic equivalent
    const root = rootNote.includes('/') ? rootNote.split('/')[0] : rootNote;
    
    // Calculate the semitone index of the root note
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = noteNames.findIndex(note => note === root);
    
    if (rootIndex === -1) {
      return []; // Unknown root note
    }
    
    // Map intervals to semitones
    const intervalToSemitones: Record<string, number> = {
      '1': 0,
      'b2': 1,
      '2': 2,
      'b3': 3,
      '3': 4,
      '4': 5,
      'b5': 6,
      '5': 7,
      '#5': 8,
      '6': 9,
      'b7': 10,
      '7': 11
    };
    
    // Calculate the notes in the chord
    return formula.map(interval => {
      const semitones = intervalToSemitones[interval];
      const noteIndex = (rootIndex + semitones) % 12;
      return noteNames[noteIndex];
    });
  }
}

export const chordDetector = new ChordDetector();
