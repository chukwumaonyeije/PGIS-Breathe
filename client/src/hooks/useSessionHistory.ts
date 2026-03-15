/*
 * useSessionHistory — Session Tracking with localStorage persistence
 */

import { useState, useCallback } from 'react';

export interface SessionRecord {
  id: string;
  protocolId: string;
  protocolName: string;
  date: string;        // ISO string
  durationMinutes: number;
  cyclesCompleted: number;
  totalBreaths: number;
  mode: 'day' | 'night';
}

const STORAGE_KEY = 'hrv_breathe_sessions';

function loadSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: SessionRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(-100)));
  } catch {
    // ignore
  }
}

export function useSessionHistory() {
  const [sessions, setSessions] = useState<SessionRecord[]>(loadSessions);

  const addSession = useCallback((record: Omit<SessionRecord, 'id' | 'date'>) => {
    const newRecord: SessionRecord = {
      ...record,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString(),
    };
    setSessions((prev) => {
      const updated = [newRecord, ...prev];
      saveSessions(updated);
      return updated;
    });
    return newRecord;
  }, []);

  const clearHistory = useCallback(() => {
    setSessions([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getStats = useCallback(() => {
    const total = sessions.length;
    const totalMinutes = sessions.reduce((s, r) => s + r.durationMinutes, 0);
    const totalBreaths = sessions.reduce((s, r) => s + r.totalBreaths, 0);
    const streak = computeStreak(sessions);
    return { total, totalMinutes, totalBreaths, streak };
  }, [sessions]);

  return { sessions, addSession, clearHistory, getStats };
}

function computeStreak(sessions: SessionRecord[]): number {
  if (sessions.length === 0) return 0;
  const dates = Array.from(new Set(sessions.map((s) => s.date.slice(0, 10)))).sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let expected = today;
  for (const d of dates) {
    if (d === expected) {
      streak++;
      const prev = new Date(expected);
      prev.setDate(prev.getDate() - 1);
      expected = prev.toISOString().slice(0, 10);
    } else {
      break;
    }
  }
  return streak;
}
