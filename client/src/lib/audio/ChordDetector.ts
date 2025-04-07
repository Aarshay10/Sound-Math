import { ChordNote, Chord } from "@/types";

// Map of note names to their frequencies (A4 = 440 Hz)
// Using 12-TET (twelve-tone equal temperament) for more accurate frequency mapping
// Middle C (C4) = 261.63 Hz
const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 261.63,
  'C#': 277.18,
  'Db': 277.18,
  'D': 293.66,
  'D#': 311.13,
  'Eb': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F#': 369.99,
  'Gb': 369.99,
  'G': 392.00,
  'G#': 415.30,
  'Ab': 415.30,
  'A': 440.00,
  'A#': 466.16,
  'Bb': 466.16,
  'B': 493.88
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
    
    // Improved frequency range for guitar/instruments
    // Most guitar frequencies are between 80Hz (low E) and ~1200Hz (high E on 24th fret)
    const minBin = Math.floor(80 / binSize); // Low E string (E2 = 82.4 Hz)
    const maxBin = Math.floor(1200 / binSize); // Upper limit for common guitar notes
    
    // Apply a window function to smooth the frequency data and reduce noise
    const smoothedData = new Uint8Array(frequencyData.length);
    const windowSize = 3;
    
    for (let i = windowSize; i < frequencyData.length - windowSize; i++) {
      let sum = 0;
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        sum += frequencyData[j];
      }
      smoothedData[i] = Math.floor(sum / (windowSize * 2 + 1));
    }
    
    // Find local maxima with adaptive peak distance based on frequency
    // Lower frequencies need wider spacing between peaks
    const getMinPeakDistance = (bin: number) => {
      // Lower frequencies need more spacing between peaks than higher ones
      return Math.max(3, Math.floor(10 / (bin / minBin)));
    };
    
    // Higher threshold for lower frequencies, which tend to be stronger
    const getThreshold = (bin: number) => {
      return 15 + (30 * Math.exp(-bin / (minBin * 2)));
    };
    
    // First pass: find all candidate peaks
    for (let i = minBin; i < Math.min(frequencyData.length - 1, maxBin); i++) {
      const threshold = getThreshold(i);
      
      // Stronger peak detection using smoothed data and 3-point window for local maxima
      if (smoothedData[i] > threshold && 
          smoothedData[i] > smoothedData[i-1] && 
          smoothedData[i] > smoothedData[i+1]) {
        
        // Find the actual peak within a small window for better precision
        let peakBin = i;
        let peakValue = smoothedData[i];
        for (let j = i-1; j <= i+1; j++) {
          if (frequencyData[j] > peakValue) {
            peakBin = j;
            peakValue = frequencyData[j];
          }
        }
        
        // Calculate actual frequency with parabolic interpolation for better accuracy
        // This helps find the true peak between frequency bins
        const alpha = frequencyData[peakBin-1];
        const beta = frequencyData[peakBin];
        const gamma = frequencyData[peakBin+1];
        let peakOffset = 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma);
        // Limit offset to reasonable range to avoid artifacts
        peakOffset = Math.max(-0.5, Math.min(0.5, peakOffset));
        
        const refinedFrequency = (peakBin + peakOffset) * binSize;
        
        // Check if it's far enough from existing peaks
        let farEnough = true;
        const minDistance = getMinPeakDistance(peakBin);
        
        for (const peak of peaks) {
          // Calculate distance in semitones instead of just bin difference
          // This is more musically relevant
          const freqRatio = peak.frequency / refinedFrequency;
          const semitoneDistance = Math.abs(12 * Math.log2(freqRatio));
          
          if (semitoneDistance < 1) { // Closer than 1 semitone
            farEnough = false;
            
            // If this peak is stronger, replace the existing one
            if (peakValue > peak.magnitude) {
              peak.frequency = refinedFrequency;
              peak.magnitude = peakValue;
            }
            break;
          }
        }
        
        if (farEnough) {
          peaks.push({
            frequency: refinedFrequency,
            magnitude: peakValue
          });
        }
      }
    }
    
    // Sort by magnitude and take the top N peaks
    peaks.sort((a, b) => b.magnitude - a.magnitude);
    
    // Second pass: filter harmonics (frequencies that are multiples of stronger peaks)
    const filteredPeaks: typeof peaks = [];
    
    for (const peak of peaks) {
      // Check if this might be a harmonic of a stronger peak
      let isHarmonic = false;
      
      for (const strongerPeak of filteredPeaks) {
        // Check common harmonic ratios (2:1, 3:1, 4:1, etc.)
        for (let harmonic = 2; harmonic <= 4; harmonic++) {
          const harmonicFreq = strongerPeak.frequency * harmonic;
          const ratio = peak.frequency / harmonicFreq;
          
          // Allow for some frequency deviation (within 3%)
          if (Math.abs(ratio - 1) < 0.03) {
            isHarmonic = true;
            break;
          }
        }
        
        if (isHarmonic) break;
      }
      
      if (!isHarmonic) {
        filteredPeaks.push(peak);
        if (filteredPeaks.length >= peakCount) break;
      }
    }
    
    return filteredPeaks.map(peak => peak.frequency);
  }

  // Find the closest musical note to a given frequency with improved accuracy
  private findClosestNote(frequency: number): ChordNote {
    // Handle edge cases
    if (frequency <= 0) {
      return {
        name: 'Unknown',
        octave: 0,
        frequency: 0
      };
    }
    
    // Reference tuning: A4 = 440 Hz
    const a4 = 440;
    const halfStepRatio = Math.pow(2, 1/12);
    
    // Calculate exact number of half steps from A4 (may be fractional)
    const exactHalfSteps = 12 * Math.log2(frequency / a4);
    
    // Calculate the exact frequency of the closest note
    const roundedHalfSteps = Math.round(exactHalfSteps);
    const closestFrequency = a4 * Math.pow(halfStepRatio, roundedHalfSteps);
    
    // Calculate the tuning deviation in cents (100 cents = 1 semitone)
    const centsDeviation = 100 * (exactHalfSteps - roundedHalfSteps);
    
    // Convert to a note name and octave
    // A4 is reference, so A is at index 0 and octave 4 is 57 half steps above C0
    const octave = Math.floor((roundedHalfSteps + 57) / 12); 
    const noteIndex = ((roundedHalfSteps + 57) % 12 + 12) % 12; // Ensure positive index
    
    // Note names array with sharps and flats for better guitar notation
    // Use context-appropriate names: guitar players typically think in sharps for sharp keys and flats for flat keys
    // Using sharp/flat pairs to allow for better chord identification later
    const noteNames = ['A', 'A#/Bb', 'B', 'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab'];
    const noteName = noteNames[noteIndex];
    
    // For debugging note issues
    // console.log(`Frequency: ${frequency}Hz, Closest Note: ${noteName}${octave}, Deviation: ${centsDeviation.toFixed(1)} cents`);
    
    return {
      name: noteName,
      octave,
      frequency: closestFrequency
    };
  }

  // Identify a chord based on a set of notes with improved reliability
  private identifyChord(notes: ChordNote[]): { name: string, formula: string } {
    if (notes.length === 0) {
      return { name: "", formula: "" };
    }
    
    // For single notes, just return the note name
    if (notes.length === 1) {
      return { 
        name: notes[0].name.split('/')[0], // Use the first name variant for simplicity
        formula: "1"
      };
    }
    
    // Get unique base note names without octaves for simpler matching
    // Also collect the frequencies for weighting
    const noteInfo = notes.map(note => ({
      name: note.name,
      frequency: note.frequency,
      // Lower frequency notes are usually more important in chords (root notes)
      weight: 1.0 / Math.max(note.frequency, 80)  
    }));
    
    // Sort notes by weight (importance) - this helps prioritize bass/root notes
    noteInfo.sort((a, b) => b.weight - a.weight);
    
    // Get just the note names for matching
    const baseNotes = noteInfo.map(note => note.name);
    
    // Scoring system for chord matches
    let bestMatchScore = -1;
    let bestMatchName = "";
    let bestMatchFormula = "";
    
    // Try different roots to find the best matching chord
    // Prioritize the lowest note as the most likely root
    const potentialRoots = [
      ...noteInfo.slice(0, 3).map(n => n.name), // Try the lowest 3 notes first
      ...baseNotes.slice(3)                     // Then try the rest
    ];
    
    // Use a Set to avoid duplicate root notes
    const uniqueRootNotes = Array.from(new Set(potentialRoots.flat().filter(Boolean)));
    const rootsToTry = uniqueRootNotes;
    
    for (const rootNote of rootsToTry) {
      // Try both versions of the note name (e.g., A# and Bb)
      const rootVariants = rootNote && typeof rootNote === 'string' && rootNote.includes('/') 
        ? rootNote.split('/') 
        : [rootNote || ''];
      
      for (const root of rootVariants) {
        for (const [suffix, formula] of Object.entries(CHORD_FORMULAS)) {
          // Calculate the expected note names for this chord
          const expectedNotes = this.calculateChordNotes(root, formula);
          
          // Calculate a score for this chord match
          let score = 0;
          let matchedNotes = 0;
          
          // Check each detected note to see if it exists in the expected chord
          for (let i = 0; i < baseNotes.length; i++) {
            const note = baseNotes[i] || '';
            const noteVariants = typeof note === 'string' && note.includes('/') ? note.split('/') : [note];
            
            // Check if any variant of this note exists in expected notes
            let noteMatched = false;
            for (const variant of noteVariants) {
              if (expectedNotes.includes(variant)) {
                noteMatched = true;
                break;
              }
            }
            
            if (noteMatched) {
              // Give more weight to the bass notes and to notes that are in the formula
              const weight = noteInfo[i].weight * 2;
              score += weight;
              matchedNotes++;
            } else {
              // Penalize unmatched notes, but less severely for higher ones (could be harmonics or overtones)
              score -= noteInfo[i].weight * 0.5;
            }
          }
          
          // Check for missing essential notes (especially the root, third, and fifth)
          const essentialIntervals = ['1', '3', 'b3', '5']; // Root, third, fifth
          let missingEssential = 0;
          
          for (const interval of formula) {
            if (essentialIntervals.includes(interval)) {
              const noteForInterval = this.calculateChordNotes(root, [interval])[0];
              let found = false;
              
              for (const note of baseNotes) {
                const noteStr = note || '';
                const variants = typeof noteStr === 'string' && noteStr.includes('/') ? noteStr.split('/') : [noteStr];
                if (noteForInterval && variants.includes(noteForInterval)) {
                  found = true;
                  break;
                }
              }
              
              if (!found) missingEssential++;
            }
          }
          
          // Strongly penalize missing essential notes
          score -= missingEssential * 2;
          
          // Require at least some matches for consideration
          const minRequiredMatches = Math.min(2, formula.length);
          
          if (matchedNotes >= minRequiredMatches && score > bestMatchScore) {
            bestMatchScore = score;
            bestMatchName = root + suffix;
            bestMatchFormula = formula.join('-');
          }
        }
      }
    }
    
    // If we found a reasonable match
    if (bestMatchScore > 0) {
      return { 
        name: bestMatchName,
        formula: bestMatchFormula
      };
    }
    
    // If no chord is identified, just return the first note
    // Clean up the name (prefer simpler names without accidental variations)
    const noteName = notes[0]?.name || '';
    const cleanName = noteName.includes?.('/') ? noteName.split('/')[0] : noteName;
    return { 
      name: cleanName,
      formula: "1"
    };
  }

  // Calculate the notes in a chord based on root note and formula
  private calculateChordNotes(rootNote: string, formula: string[]): string[] {
    // Handle empty root note
    if (!rootNote) {
      return [];
    }
    
    // Simplify root if it has enharmonic equivalent
    const root = typeof rootNote === 'string' && rootNote.includes('/') ? rootNote.split('/')[0] : rootNote;
    
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
