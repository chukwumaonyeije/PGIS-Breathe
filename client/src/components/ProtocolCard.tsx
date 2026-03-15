/*
 * ProtocolCard — Protocol Selection Card
 * Design: Medical Biophilic — glass card with evidence badge
 */

import React from 'react';
import type { Protocol } from '@/lib/protocols';

interface ProtocolCardProps {
  protocol: Protocol;
  isSelected: boolean;
  isNightMode: boolean;
  onClick: () => void;
  /** When true, card fills its container width (used in desktop sidebar) */
  fillWidth?: boolean;
}

const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const DIFFICULTY_COLORS = {
  beginner: 'rgba(74, 222, 128, 0.8)',
  intermediate: 'rgba(251, 191, 36, 0.8)',
  advanced: 'rgba(248, 113, 113, 0.8)',
};

export default function ProtocolCard({
  protocol,
  isSelected,
  isNightMode,
  onClick,
  fillWidth = false,
}: ProtocolCardProps) {
  const totalSeconds = protocol.phases.reduce((s, p) => s + p.duration, 0);

  return (
    <div
      className={`protocol-card p-4 flex flex-col gap-2 select-none ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        minWidth: fillWidth ? 0 : 200,
        maxWidth: fillWidth ? '100%' : 240,
        width: fillWidth ? '100%' : undefined,
        borderColor: isSelected ? protocol.color : undefined,
        boxShadow: isSelected ? `0 0 24px ${protocol.glowColor}` : undefined,
      }}
    >
      {/* Mode badge */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            background: isNightMode
              ? 'rgba(124,58,237,0.25)'
              : 'rgba(0,180,216,0.2)',
            color: protocol.color,
            border: `1px solid ${protocol.color}40`,
          }}
        >
          {protocol.mode === 'both' ? 'Day & Night' : protocol.mode === 'day' ? 'Daytime' : 'Nighttime'}
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: DIFFICULTY_COLORS[protocol.difficulty] }}
        >
          {DIFFICULTY_LABELS[protocol.difficulty]}
        </span>
      </div>

      {/* Name */}
      <div>
        <h3 className="font-display text-white font-semibold text-sm leading-tight">
          {protocol.name}
        </h3>
        <p className="text-white/50 text-xs mt-0.5 font-medium tracking-wide">
          {protocol.subtitle}
        </p>
      </div>

      {/* Phase visualization */}
      <div className="flex gap-1 items-end h-6">
        {protocol.phases.map((phase, i) => {
          const widthPct = (phase.duration / totalSeconds) * 100;
          return (
            <div
              key={i}
              className="rounded-sm flex-shrink-0 relative group"
              style={{
                width: `${widthPct}%`,
                height: phase.type === 'inhale' ? '100%'
                  : phase.type === 'exhale' ? '80%'
                  : '50%',
                background: protocol.color,
                opacity: 0.6 + (i % 2) * 0.2,
                transition: 'opacity 0.2s',
              }}
              title={`${phase.label}: ${phase.duration}s`}
            />
          );
        })}
      </div>

      {/* Timing */}
      <div className="flex items-center gap-3 text-xs text-white/50">
        <span className="font-mono-nums">{protocol.bpm.toFixed(1)} BPM</span>
        <span>·</span>
        <span>{protocol.sessionDuration} min</span>
        <span>·</span>
        <span>{totalSeconds}s cycle</span>
      </div>

      {/* Evidence badge */}
      <div
        className="text-xs rounded px-2 py-1 leading-tight"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        <span className="text-white/30 mr-1">Ref:</span>
        {protocol.citation}
      </div>
    </div>
  );
}
