/*
 * PhaseIndicator — Shows all phases in the current protocol cycle
 * Design: Medical Biophilic
 */

import React from 'react';
import type { Phase } from '@/lib/protocols';

interface PhaseIndicatorProps {
  phases: Phase[];
  currentPhaseIndex: number;
  isNightMode: boolean;
  isActive: boolean;
}

const PHASE_COLORS_DAY: Record<string, string> = {
  inhale: '#00b4d8',
  hold: '#90e0ef',
  exhale: '#48cae4',
  hold2: '#ade8f4',
};

const PHASE_COLORS_NIGHT: Record<string, string> = {
  inhale: '#7c3aed',
  hold: '#a78bfa',
  exhale: '#f59e0b',
  hold2: '#fcd34d',
};

export default function PhaseIndicator({
  phases,
  currentPhaseIndex,
  isNightMode,
  isActive,
}: PhaseIndicatorProps) {
  const colors = isNightMode ? PHASE_COLORS_NIGHT : PHASE_COLORS_DAY;
  const totalDuration = phases.reduce((s, p) => s + p.duration, 0);

  return (
    <div className="flex items-center gap-2 w-full max-w-xs">
      {phases.map((phase, i) => {
        const isCurrentPhase = i === currentPhaseIndex && isActive;
        const color = colors[phase.type] || '#fff';
        const widthPct = (phase.duration / totalDuration) * 100;

        return (
          <div
            key={i}
            className="flex flex-col items-center gap-1"
            style={{ width: `${widthPct}%` }}
          >
            {/* Bar */}
            <div
              className="w-full rounded-full transition-all duration-300"
              style={{
                height: isCurrentPhase ? 4 : 2,
                background: isCurrentPhase
                  ? color
                  : `${color}40`,
                boxShadow: isCurrentPhase ? `0 0 8px ${color}80` : 'none',
              }}
            />
            {/* Label */}
            <span
              className="text-xs font-medium transition-all duration-300 truncate w-full text-center"
              style={{
                color: isCurrentPhase ? color : 'rgba(255,255,255,0.3)',
                fontSize: '0.6rem',
              }}
            >
              {phase.label} {phase.duration}s
            </span>
          </div>
        );
      })}
    </div>
  );
}
