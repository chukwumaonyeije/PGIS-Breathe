/*
 * useHrvLog — Garmin HRV daily log with localStorage persistence
 * Part of PGIS Breathe — Performance Glycemic Intelligence System
 *
 * Stores daily HRV readings from Garmin, with optional notes.
 * Provides trend analysis helpers.
 */

import { useState, useCallback } from 'react';

export interface HrvEntry {
  id: string;
  date: string;        // YYYY-MM-DD
  hrv: number;         // ms RMSSD from Garmin
  source: 'garmin';
  notes?: string;
  timeOfDay?: 'morning' | 'evening';
}

const STORAGE_KEY = 'pgis_hrv_log';

function loadEntries(): HrvEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: HrvEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-365)));
  } catch {
    // ignore
  }
}

export interface HrvStats {
  latest: number | null;
  avg7: number | null;
  avg30: number | null;
  trend7: 'up' | 'down' | 'stable' | null;
  min30: number | null;
  max30: number | null;
  totalEntries: number;
}

export function useHrvLog() {
  const [entries, setEntries] = useState<HrvEntry[]>(loadEntries);

  const addEntry = useCallback((
    hrv: number,
    date: string,
    notes?: string,
    timeOfDay: 'morning' | 'evening' = 'morning'
  ) => {
    const newEntry: HrvEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date,
      hrv,
      source: 'garmin',
      notes,
      timeOfDay,
    };
    setEntries(prev => {
      // Replace if same date exists, otherwise prepend
      const filtered = prev.filter(e => e.date !== date);
      const updated = [newEntry, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
      saveEntries(updated);
      return updated;
    });
    return newEntry;
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveEntries(updated);
      return updated;
    });
  }, []);

  const getStats = useCallback((): HrvStats => {
    if (entries.length === 0) {
      return { latest: null, avg7: null, avg30: null, trend7: null, min30: null, max30: null, totalEntries: 0 };
    }

    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0]?.hrv ?? null;

    const now = new Date();
    const cutoff7 = new Date(now); cutoff7.setDate(cutoff7.getDate() - 7);
    const cutoff30 = new Date(now); cutoff30.setDate(cutoff30.getDate() - 30);

    const last7 = sorted.filter(e => new Date(e.date) >= cutoff7).map(e => e.hrv);
    const last30 = sorted.filter(e => new Date(e.date) >= cutoff30).map(e => e.hrv);

    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;

    const avg7 = avg(last7);
    const avg30 = avg(last30);
    const min30 = last30.length ? Math.min(...last30) : null;
    const max30 = last30.length ? Math.max(...last30) : null;

    // Trend: compare first half vs second half of last 7 days
    let trend7: 'up' | 'down' | 'stable' | null = null;
    if (last7.length >= 4) {
      const half = Math.floor(last7.length / 2);
      const recent = avg(last7.slice(0, half)) ?? 0;
      const older = avg(last7.slice(half)) ?? 0;
      const diff = recent - older;
      trend7 = diff > 2 ? 'up' : diff < -2 ? 'down' : 'stable';
    }

    return { latest, avg7, avg30, trend7, min30, max30, totalEntries: entries.length };
  }, [entries]);

  // Get last N days of entries for chart (fills gaps with null)
  const getChartData = useCallback((days: number = 30) => {
    const result: { date: string; hrv: number | null; label: string }[] = [];
    const entryMap = new Map(entries.map(e => [e.date, e.hrv]));

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      result.push({ date: dateStr, hrv: entryMap.get(dateStr) ?? null, label });
    }
    return result;
  }, [entries]);

  return { entries, addEntry, removeEntry, getStats, getChartData };
}
