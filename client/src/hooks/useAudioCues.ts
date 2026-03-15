/*
 * useAudioCues — Web Audio API breathing phase cues
 * Design: Medical Biophilic
 *
 * Generates subtle, calming tones for phase transitions.
 * No external audio files needed — all synthesized.
 *
 * DAY MODE: Bright, clear tones (higher frequency)
 * NIGHT MODE: Warm, deep tones (lower frequency, softer)
 */

import { useRef, useCallback, useEffect } from 'react';
import type { PhaseType } from '@/lib/protocols';

interface AudioCueConfig {
  isNightMode: boolean;
  enabled: boolean;
}

// Tone frequencies for each phase
const DAY_TONES: Record<PhaseType, number> = {
  inhale: 528,   // C5 — clarity, focus
  hold: 396,     // G4 — steady
  exhale: 432,   // A4 — release, calm
  hold2: 285,    // D4 — rest
};

const NIGHT_TONES: Record<PhaseType, number> = {
  inhale: 285,   // D4 — gentle
  hold: 256,     // C4 — soft hold
  exhale: 174,   // F3 — deep release
  hold2: 136,    // C#3 — deep rest
};

export function useAudioCues({ isNightMode, enabled }: AudioCueConfig) {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback(
    (phaseType: PhaseType) => {
      if (!enabled) return;
      try {
        const ctx = getCtx();
        const tones = isNightMode ? NIGHT_TONES : DAY_TONES;
        const freq = tones[phaseType];

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Soft sine wave
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

        // Low-pass filter for warmth
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isNightMode ? 800 : 1200, ctx.currentTime);
        filter.Q.setValueAtTime(0.5, ctx.currentTime);

        // Envelope: quick attack, short sustain, fade
        const volume = isNightMode ? 0.12 : 0.15;
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.08);
        gainNode.gain.setValueAtTime(volume, ctx.currentTime + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.85);
      } catch (e) {
        // Silently fail — audio is non-critical
      }
    },
    [enabled, isNightMode, getCtx]
  );

  const playCountdownBeep = useCallback(
    (isFinal: boolean) => {
      if (!enabled) return;
      try {
        const ctx = getCtx();
        const freq = isFinal ? 660 : 440;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isFinal ? 0.5 : 0.2));

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + (isFinal ? 0.55 : 0.25));
      } catch (e) {
        // Silently fail
      }
    },
    [enabled, getCtx]
  );

  const playSessionComplete = useCallback(() => {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      // Play a gentle ascending chord
      const notes = isNightMode ? [174, 220, 285] : [528, 660, 792];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.15 + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 1.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 1.6);
      });
    } catch (e) {
      // Silently fail
    }
  }, [enabled, isNightMode, getCtx]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return { playTone, playCountdownBeep, playSessionComplete };
}
