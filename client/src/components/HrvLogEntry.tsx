/*
 * HrvLogEntry — Modal for logging daily Garmin HRV reading
 * Part of PGIS Breathe
 *
 * Design: Medical Biophilic — glass modal with numeric input
 */

import React, { useState } from 'react';

interface HrvLogEntryProps {
  isNightMode: boolean;
  onSave: (hrv: number, date: string, notes: string, timeOfDay: 'morning' | 'evening') => void;
  onClose: () => void;
  existingEntry?: { hrv: number; notes?: string; timeOfDay?: string } | null;
}

export default function HrvLogEntry({
  isNightMode,
  onSave,
  onClose,
  existingEntry,
}: HrvLogEntryProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [hrv, setHrv] = useState<string>(existingEntry ? String(existingEntry.hrv) : '');
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState(existingEntry?.notes ?? '');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'evening'>(
    (existingEntry?.timeOfDay as 'morning' | 'evening') ?? 'morning'
  );
  const [error, setError] = useState('');

  const accentColor = isNightMode ? '#f59e0b' : '#00b4d8';
  const accentDim = isNightMode ? 'rgba(245,158,11,0.12)' : 'rgba(0,180,216,0.10)';
  const accentBorder = isNightMode ? 'rgba(245,158,11,0.35)' : 'rgba(0,180,216,0.30)';

  const handleSave = () => {
    const val = parseFloat(hrv);
    if (!hrv || isNaN(val) || val < 10 || val > 200) {
      setError('Please enter a valid HRV value between 10 and 200 ms.');
      return;
    }
    setError('');
    onSave(Math.round(val), date, notes.trim(), timeOfDay);
    onClose();
  };

  // HRV zone interpretation
  const getHrvZone = (val: number) => {
    if (val >= 80) return { label: 'Excellent', color: '#4ade80' };
    if (val >= 60) return { label: 'Good', color: '#86efac' };
    if (val >= 40) return { label: 'Moderate', color: accentColor };
    if (val >= 25) return { label: 'Low', color: '#fb923c' };
    return { label: 'Very Low', color: '#f87171' };
  };

  const numVal = parseFloat(hrv);
  const zone = !isNaN(numVal) && numVal > 0 ? getHrvZone(numVal) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 animate-slide-up"
        style={{
          background: isNightMode
            ? 'linear-gradient(145deg, rgba(15,10,46,0.97) 0%, rgba(26,15,58,0.97) 100%)'
            : 'linear-gradient(145deg, rgba(7,26,46,0.97) 0%, rgba(13,79,92,0.95) 100%)',
          border: `1px solid ${accentBorder}`,
          boxShadow: `0 0 40px ${accentDim}, 0 20px 60px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-white font-semibold text-base">Log Garmin HRV</h3>
            <p className="text-white/40 text-xs mt-0.5">Daily HRV reading from your Garmin device</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* HRV Input */}
        <div className="mb-3">
          <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
            HRV (ms RMSSD)
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min={10}
              max={200}
              value={hrv}
              onChange={e => { setHrv(e.target.value); setError(''); }}
              placeholder="e.g. 52"
              className="w-full rounded-xl px-4 py-3 text-white text-2xl font-mono-nums font-semibold outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${hrv ? accentBorder : 'rgba(255,255,255,0.1)'}`,
                caretColor: accentColor,
              }}
              autoFocus
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-medium">ms</span>
          </div>

          {/* Zone indicator */}
          {zone && (
            <div className="flex items-center gap-2 mt-2 animate-fade-in">
              <div className="w-2 h-2 rounded-full" style={{ background: zone.color }} />
              <span className="text-xs font-medium" style={{ color: zone.color }}>{zone.label} HRV</span>
              <span className="text-white/25 text-xs">
                {numVal >= 60 ? '— Great recovery' : numVal >= 40 ? '— Normal range' : '— Consider rest'}
              </span>
            </div>
          )}
          {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
        </div>

        {/* Date */}
        <div className="mb-3">
          <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={e => setDate(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              colorScheme: 'dark',
            }}
          />
        </div>

        {/* Time of day */}
        <div className="mb-3">
          <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
            Time of Reading
          </label>
          <div className="flex gap-2">
            {(['morning', 'evening'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeOfDay(t)}
                className="flex-1 py-2 rounded-xl text-sm font-medium transition-all capitalize"
                style={{
                  background: timeOfDay === t ? accentDim : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${timeOfDay === t ? accentBorder : 'rgba(255,255,255,0.08)'}`,
                  color: timeOfDay === t ? accentColor : 'rgba(255,255,255,0.4)',
                }}
              >
                {t === 'morning' ? '🌅 Morning' : '🌙 Evening'}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
            Notes <span className="text-white/25 normal-case font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Good sleep, post-run, felt stressed..."
            rows={2}
            className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none resize-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              caretColor: accentColor,
            }}
          />
        </div>

        {/* Garmin tip */}
        <div
          className="rounded-lg px-3 py-2 mb-4 text-xs"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <span className="text-white/35">Find HRV in Garmin Connect: </span>
          <span className="text-white/55">Health Stats → Heart Rate Variability → Daily value (RMSSD)</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: accentColor,
              color: isNightMode ? '#1a0f3a' : '#071a2e',
              boxShadow: `0 0 20px ${accentDim}`,
            }}
          >
            Save HRV
          </button>
        </div>
      </div>
    </div>
  );
}
