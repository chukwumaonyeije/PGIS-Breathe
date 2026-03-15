/*
 * BreathingOrb — Animated Central Breathing Visualization
 * Design: Medical Biophilic
 *
 * Features:
 * - Physiological scale animation (lung volume curve)
 * - Phase-reactive color glow
 * - SVG progress ring
 * - Concentric ring pulses
 */

import React, { useMemo } from 'react';
import type { Phase, PhaseType } from '@/lib/protocols';

interface BreathingOrbProps {
  scale: number;           // 0.75–1.15
  phase: Phase | null;
  phaseProgress: number;   // 0–1
  sessionState: string;
  isNightMode: boolean;
  size?: number;           // px, default 220
  countdownValue?: number;
}

const PHASE_COLORS: Record<PhaseType, { day: string; night: string }> = {
  inhale:  { day: '#00b4d8', night: '#7c3aed' },
  hold:    { day: '#90e0ef', night: '#a78bfa' },
  exhale:  { day: '#48cae4', night: '#f59e0b' },
  hold2:   { day: '#ade8f4', night: '#fcd34d' },
};

const PHASE_GLOW: Record<PhaseType, { day: string; night: string }> = {
  inhale:  { day: 'rgba(0,180,216,0.45)',   night: 'rgba(124,58,237,0.45)' },
  hold:    { day: 'rgba(144,224,239,0.35)', night: 'rgba(167,139,250,0.35)' },
  exhale:  { day: 'rgba(72,202,228,0.40)',  night: 'rgba(245,158,11,0.40)' },
  hold2:   { day: 'rgba(173,232,244,0.30)', night: 'rgba(252,211,77,0.30)' },
};

export default function BreathingOrb({
  scale,
  phase,
  phaseProgress,
  sessionState,
  isNightMode,
  size = 220,
  countdownValue,
}: BreathingOrbProps) {
  const mode = isNightMode ? 'night' : 'day';

  const phaseColor = phase
    ? PHASE_COLORS[phase.type][mode]
    : isNightMode ? '#7c3aed' : '#00b4d8';

  const glowColor = phase
    ? PHASE_GLOW[phase.type][mode]
    : isNightMode ? 'rgba(124,58,237,0.35)' : 'rgba(0,180,216,0.35)';

  // SVG progress ring
  const ringRadius = size / 2 - 8;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference * (1 - phaseProgress);

  // Orb gradient stops
  const gradientId = `orb-grad-${isNightMode ? 'night' : 'day'}`;

  const orbStyle = useMemo(() => ({
    width: size,
    height: size,
    transform: `scale(${scale})`,
    transition: 'transform 0.08s linear',
    willChange: 'transform',
  }), [scale, size]);

  const isIdle = sessionState === 'idle';
  const isCountdown = sessionState === 'countdown';
  const isComplete = sessionState === 'complete';

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size + 80, height: size + 80 }}
    >
      {/* Outer ambient glow rings */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          transform: `scale(${0.8 + scale * 0.25})`,
          transition: 'transform 0.08s linear, background 0.5s ease',
          opacity: isIdle ? 0.3 : 0.7,
        }}
      />

      {/* SVG progress ring */}
      <svg
        className="absolute inset-0"
        width={size + 80}
        height={size + 80}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={phaseColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isNightMode ? '#f59e0b' : '#90e0ef'} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={(size + 80) / 2}
          cy={(size + 80) / 2}
          r={ringRadius + 28}
          className="progress-ring-track"
          strokeWidth="2"
        />
        {/* Fill */}
        {sessionState === 'active' && (
          <circle
            cx={(size + 80) / 2}
            cy={(size + 80) / 2}
            r={ringRadius + 28}
            className="progress-ring-fill"
            strokeWidth="2.5"
            stroke={`url(#${gradientId})`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.08s linear, stroke 0.5s ease' }}
          />
        )}
      </svg>

      {/* Orb container */}
      <div style={orbStyle} className="relative z-10">
        {/* Main orb */}
        <div
          className="rounded-full w-full h-full relative overflow-hidden"
          style={{
            background: `radial-gradient(circle at 38% 32%, rgba(255,255,255,0.3) 0%, ${phaseColor}cc 35%, ${phaseColor}66 60%, transparent 80%)`,
            boxShadow: `
              0 0 30px ${glowColor},
              0 0 60px ${glowColor},
              0 0 100px ${glowColor.replace('0.45', '0.15')},
              inset 0 0 30px rgba(255,255,255,0.08),
              inset 0 -10px 30px rgba(0,0,0,0.2)
            `,
            transition: 'background 0.5s ease, box-shadow 0.5s ease',
          }}
        >
          {/* Inner highlight */}
          <div
            className="absolute rounded-full"
            style={{
              width: '35%',
              height: '35%',
              top: '18%',
              left: '22%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
              filter: 'blur(4px)',
            }}
          />
        </div>

        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: `scale(${1 / scale})`, transition: 'transform 0.08s linear' }}
        >
          {isCountdown && countdownValue !== undefined && (
            <div
              className="font-mono-nums text-white font-bold"
              style={{ fontSize: size * 0.28, lineHeight: 1, textShadow: '0 0 20px rgba(255,255,255,0.8)' }}
            >
              {countdownValue}
            </div>
          )}
          {sessionState === 'active' && phase && (
            <>
              <div
                className="font-mono-nums text-white font-medium"
                style={{ fontSize: size * 0.18, lineHeight: 1, textShadow: '0 0 15px rgba(255,255,255,0.6)' }}
              >
                {Math.ceil(phase.duration * (1 - phaseProgress))}
              </div>
              <div
                className="phase-label text-white/80 mt-1"
                style={{ fontSize: size * 0.09 }}
              >
                {phase.label}
              </div>
            </>
          )}
          {isIdle && (
            <div
              className="text-white/60 font-display italic"
              style={{ fontSize: size * 0.09, textAlign: 'center', padding: '0 12px' }}
            >
              Tap to begin
            </div>
          )}
          {isComplete && (
            <div
              className="text-white/90 font-display"
              style={{ fontSize: size * 0.09, textAlign: 'center' }}
            >
              Complete
            </div>
          )}
        </div>
      </div>

      {/* Concentric ring 1 */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size + 30,
          height: size + 30,
          border: `1px solid rgba(255,255,255,${isIdle ? '0.06' : '0.12'})`,
          transform: `scale(${0.9 + scale * 0.12})`,
          transition: 'transform 0.08s linear, border-color 0.5s ease',
        }}
      />
      {/* Concentric ring 2 */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size + 55,
          height: size + 55,
          border: `1px solid rgba(255,255,255,${isIdle ? '0.04' : '0.07'})`,
          transform: `scale(${0.92 + scale * 0.10})`,
          transition: 'transform 0.08s linear, border-color 0.5s ease',
        }}
      />
    </div>
  );
}
