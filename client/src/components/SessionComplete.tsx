/*
 * SessionComplete — Post-Session Summary Screen
 * Design: Medical Biophilic
 */

import React from 'react';
import type { Protocol } from '@/lib/protocols';

interface SessionCompleteProps {
  protocol: Protocol;
  cyclesCompleted: number;
  totalBreaths: number;
  durationMinutes: number;
  isNightMode: boolean;
  onDone: () => void;
  onRepeat: () => void;
}

export default function SessionComplete({
  protocol,
  cyclesCompleted,
  totalBreaths,
  durationMinutes,
  isNightMode,
  onDone,
  onRepeat,
}: SessionCompleteProps) {
  const accentColor = isNightMode ? '#f59e0b' : '#00b4d8';
  const glowColor = isNightMode ? 'rgba(245,158,11,0.3)' : 'rgba(0,180,216,0.3)';

  return (
    <div className="flex flex-col items-center justify-center gap-6 animate-fade-in-up px-6 py-8 text-center">
      {/* Checkmark */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, ${accentColor}33 0%, transparent 70%)`,
          border: `2px solid ${accentColor}66`,
          boxShadow: `0 0 30px ${glowColor}`,
        }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path
            d="M8 18L15 25L28 11"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Title */}
      <div>
        <h2 className="font-display text-white text-2xl font-semibold">
          Session Complete
        </h2>
        <p className="text-white/50 text-sm mt-1 font-medium">
          {protocol.name}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {[
          { label: 'Duration', value: `${durationMinutes}`, unit: 'min' },
          { label: 'Cycles', value: `${cyclesCompleted}`, unit: '' },
          { label: 'Breaths', value: `${totalBreaths}`, unit: '' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card p-3 flex flex-col items-center gap-1"
          >
            <div
              className="font-mono-nums font-semibold text-xl"
              style={{ color: accentColor }}
            >
              {stat.value}
              {stat.unit && (
                <span className="text-sm font-normal text-white/50 ml-0.5">
                  {stat.unit}
                </span>
              )}
            </div>
            <div className="text-white/40 text-xs">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* HRV note */}
      <div
        className="glass-card p-4 text-left max-w-xs w-full"
        style={{ borderColor: `${accentColor}30` }}
      >
        <p className="text-white/60 text-xs leading-relaxed">
          <span style={{ color: accentColor }} className="font-semibold">
            HRV Benefit:{' '}
          </span>
          {protocol.evidence}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={onRepeat}
          className="flex-1 py-3 rounded-xl font-medium text-sm transition-all"
          style={{
            background: `${accentColor}22`,
            border: `1px solid ${accentColor}44`,
            color: accentColor,
          }}
        >
          Repeat
        </button>
        <button
          onClick={onDone}
          className="flex-1 py-3 rounded-xl font-medium text-sm text-white transition-all"
          style={{
            background: accentColor,
            boxShadow: `0 0 20px ${glowColor}`,
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
