import { useState, useRef, useCallback, useEffect } from 'react';

export const useStrangerThingsMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const intervalRef = useRef<number | null>(null);

  const createOscillator = (
    ctx: AudioContext,
    type: OscillatorType,
    frequency: number,
    gain: number,
    destination: AudioNode
  ) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.value = frequency;
    oscGain.gain.value = gain;
    
    osc.connect(oscGain);
    oscGain.connect(destination);
    osc.start();
    
    return { osc, oscGain };
  };

  const start = useCallback(() => {
    if (audioContextRef.current) return;

    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    // Master gain
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGainRef.current = masterGain;

    // Low-pass filter for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Deep bass drone (A1 - 55Hz)
    const bass = createOscillator(ctx, 'sawtooth', 55, 0.08, filter);
    oscillatorsRef.current.push(bass.osc);

    // Sub bass
    const subBass = createOscillator(ctx, 'sine', 27.5, 0.06, filter);
    oscillatorsRef.current.push(subBass.osc);

    // Pad oscillators (detuned for analog warmth)
    const pad1 = createOscillator(ctx, 'triangle', 110, 0.03, filter);
    const pad2 = createOscillator(ctx, 'triangle', 110.5, 0.03, filter);
    oscillatorsRef.current.push(pad1.osc, pad2.osc);

    // Arpeggio notes: A minor scale (A2, C3, E3, A3)
    const arpeggioNotes = [110, 130.81, 164.81, 220];
    let noteIndex = 0;

    // Arpeggio oscillator
    const arpOsc = ctx.createOscillator();
    const arpGain = ctx.createGain();
    arpOsc.type = 'square';
    arpOsc.frequency.value = arpeggioNotes[0];
    arpGain.gain.value = 0.04;
    
    // Add slight detune for analog feel
    arpOsc.detune.value = -5;
    
    arpOsc.connect(arpGain);
    arpGain.connect(filter);
    arpOsc.start();
    oscillatorsRef.current.push(arpOsc);

    // Arpeggio pattern - 8th notes at ~100 BPM
    const tempoMs = 300; // 300ms per note
    intervalRef.current = window.setInterval(() => {
      noteIndex = (noteIndex + 1) % arpeggioNotes.length;
      arpOsc.frequency.setTargetAtTime(
        arpeggioNotes[noteIndex],
        ctx.currentTime,
        0.01
      );
      
      // Pulsing effect on arp
      arpGain.gain.setTargetAtTime(0.05, ctx.currentTime, 0.01);
      arpGain.gain.setTargetAtTime(0.02, ctx.currentTime + 0.1, 0.1);
    }, tempoMs);

    // LFO for bass modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.2; // Very slow modulation
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(bass.osc.frequency);
    lfo.start();
    oscillatorsRef.current.push(lfo);

    // Fade in
    masterGain.gain.setTargetAtTime(0.18, ctx.currentTime, 0.5);
    
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    if (!audioContextRef.current) return;

    // Fade out
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        0,
        audioContextRef.current.currentTime,
        0.3
      );
    }

    // Clean up after fade
    setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Oscillator already stopped
        }
      });
      oscillatorsRef.current = [];

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      masterGainRef.current = null;
      setIsPlaying(false);
    }, 400);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  }, [isPlaying, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {}
      });
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { isPlaying, start, stop, toggle };
};
