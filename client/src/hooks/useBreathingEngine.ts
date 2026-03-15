/*
 * useBreathingEngine — Core Breathing State Machine
 * Design: Medical Biophilic
 *
 * Manages the breathing cycle state, phase transitions, and session timing.
 * Uses requestAnimationFrame for smooth, accurate timing.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Protocol, Phase, PhaseType } from '@/lib/protocols';

export type SessionState = 'idle' | 'countdown' | 'active' | 'paused' | 'complete';

export interface BreathingState {
  sessionState: SessionState;
  currentPhaseIndex: number;
  currentPhase: Phase | null;
  phaseProgress: number;       // 0–1 within current phase
  phaseTimeRemaining: number;  // seconds remaining in phase
  cycleCount: number;
  sessionElapsed: number;      // seconds elapsed in session
  sessionProgress: number;     // 0–1 of total session
  totalBreaths: number;
  countdownValue: number;
  orbScale: number;            // 0.75–1.15 for orb animation
}

export interface BreathingControls {
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

const COUNTDOWN_SECONDS = 3;

export function useBreathingEngine(
  protocol: Protocol | null,
  sessionMinutes: number = 5
): [BreathingState, BreathingControls] {
  const sessionSeconds = sessionMinutes * 60;
  const cycleDuration = protocol
    ? protocol.phases.reduce((sum, p) => sum + p.duration, 0)
    : 10;

  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [totalBreaths, setTotalBreaths] = useState(0);
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_SECONDS);
  const [orbScale, setOrbScale] = useState(0.75);

  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const phaseElapsedRef = useRef<number>(0);
  const sessionElapsedRef = useRef<number>(0);
  const countdownElapsedRef = useRef<number>(0);
  const currentPhaseIndexRef = useRef<number>(0);
  const cycleCountRef = useRef<number>(0);
  const totalBreathsRef = useRef<number>(0);
  const sessionStateRef = useRef<SessionState>('idle');

  // Sync refs with state
  useEffect(() => { sessionStateRef.current = sessionState; }, [sessionState]);
  useEffect(() => { currentPhaseIndexRef.current = currentPhaseIndex; }, [currentPhaseIndex]);
  useEffect(() => { cycleCountRef.current = cycleCount; }, [cycleCount]);
  useEffect(() => { totalBreathsRef.current = totalBreaths; }, [totalBreaths]);

  const getOrbScaleForPhase = useCallback(
    (phaseType: PhaseType, progress: number): number => {
      const MIN_SCALE = 0.75;
      const MAX_SCALE = 1.15;
      // Use physiological lung volume curve (sigmoid-like)
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      switch (phaseType) {
        case 'inhale':
          return MIN_SCALE + (MAX_SCALE - MIN_SCALE) * eased;
        case 'hold':
          return MAX_SCALE;
        case 'exhale':
          return MAX_SCALE - (MAX_SCALE - MIN_SCALE) * eased;
        case 'hold2':
          return MIN_SCALE;
        default:
          return 1.0;
      }
    },
    []
  );

  const tick = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1); // cap at 100ms
      lastTimeRef.current = timestamp;

      const state = sessionStateRef.current;

      if (state === 'countdown') {
        countdownElapsedRef.current += delta;
        const remaining = Math.max(0, COUNTDOWN_SECONDS - countdownElapsedRef.current);
        setCountdownValue(Math.ceil(remaining));
        if (remaining <= 0) {
          setSessionState('active');
          sessionStateRef.current = 'active';
          countdownElapsedRef.current = 0;
          phaseElapsedRef.current = 0;
          lastTimeRef.current = timestamp;
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (state !== 'active') return;

      if (!protocol) return;

      // Session timer
      sessionElapsedRef.current += delta;
      setSessionElapsed(Math.min(sessionElapsedRef.current, sessionSeconds));

      if (sessionElapsedRef.current >= sessionSeconds) {
        setSessionState('complete');
        sessionStateRef.current = 'complete';
        cancelAnimationFrame(rafRef.current);
        return;
      }

      // Phase timer
      phaseElapsedRef.current += delta;
      const phaseIdx = currentPhaseIndexRef.current;
      const phase = protocol.phases[phaseIdx];
      const phaseDur = phase.duration;
      const progress = Math.min(phaseElapsedRef.current / phaseDur, 1);

      setPhaseProgress(progress);
      setPhaseTimeRemaining(Math.max(0, phaseDur - phaseElapsedRef.current));
      setOrbScale(getOrbScaleForPhase(phase.type, progress));

      if (phaseElapsedRef.current >= phaseDur) {
        phaseElapsedRef.current = 0;
        const nextIdx = (phaseIdx + 1) % protocol.phases.length;
        currentPhaseIndexRef.current = nextIdx;
        setCurrentPhaseIndex(nextIdx);

        // Count complete cycles
        if (nextIdx === 0) {
          cycleCountRef.current += 1;
          setCycleCount(cycleCountRef.current);
          // Count inhale phases as breaths
          totalBreathsRef.current += 1;
          setTotalBreaths(totalBreathsRef.current);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [protocol, sessionSeconds, getOrbScaleForPhase]
  );

  const start = useCallback(() => {
    if (!protocol) return;
    setSessionState('countdown');
    sessionStateRef.current = 'countdown';
    setCurrentPhaseIndex(0);
    currentPhaseIndexRef.current = 0;
    setCycleCount(0);
    cycleCountRef.current = 0;
    setTotalBreaths(0);
    totalBreathsRef.current = 0;
    setSessionElapsed(0);
    sessionElapsedRef.current = 0;
    phaseElapsedRef.current = 0;
    countdownElapsedRef.current = 0;
    lastTimeRef.current = 0;
    setCountdownValue(COUNTDOWN_SECONDS);
    setOrbScale(0.75);
    rafRef.current = requestAnimationFrame(tick);
  }, [protocol, tick]);

  const pause = useCallback(() => {
    setSessionState('paused');
    sessionStateRef.current = 'paused';
    cancelAnimationFrame(rafRef.current);
    lastTimeRef.current = 0;
  }, []);

  const resume = useCallback(() => {
    setSessionState('active');
    sessionStateRef.current = 'active';
    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setSessionState('idle');
    sessionStateRef.current = 'idle';
    setCurrentPhaseIndex(0);
    setPhaseProgress(0);
    setPhaseTimeRemaining(0);
    setCycleCount(0);
    setSessionElapsed(0);
    setTotalBreaths(0);
    setOrbScale(0.75);
    phaseElapsedRef.current = 0;
    sessionElapsedRef.current = 0;
    lastTimeRef.current = 0;
  }, []);

  const reset = useCallback(() => {
    stop();
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Reset when protocol changes
  useEffect(() => {
    if (sessionStateRef.current !== 'idle') {
      stop();
    }
  }, [protocol?.id, stop]);

  const currentPhase = protocol ? protocol.phases[currentPhaseIndex] : null;
  const sessionProgress = sessionSeconds > 0 ? sessionElapsed / sessionSeconds : 0;

  const state: BreathingState = {
    sessionState,
    currentPhaseIndex,
    currentPhase,
    phaseProgress,
    phaseTimeRemaining,
    cycleCount,
    sessionElapsed,
    sessionProgress,
    totalBreaths,
    countdownValue,
    orbScale,
  };

  const controls: BreathingControls = { start, pause, resume, stop, reset };

  return [state, controls];
}
