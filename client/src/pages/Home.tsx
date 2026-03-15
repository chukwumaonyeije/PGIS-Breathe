/*
 * Home — PGIS Breathe Main App Page
 * Design: Medical Biophilic
 *
 * PGIS Breathe is a component of the Performance Glycemic Intelligence System.
 * Tabs: Breathe | HRV Log
 *
 * Breathe tab: full breathing session UI
 * HRV Log tab: Garmin HRV entry + trend chart
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import BreathingOrb from '@/components/BreathingOrb';
import ProtocolCard from '@/components/ProtocolCard';
import PhaseIndicator from '@/components/PhaseIndicator';
import WaveformVisualizer from '@/components/WaveformVisualizer';
import SessionComplete from '@/components/SessionComplete';
import HrvLogEntry from '@/components/HrvLogEntry';
import HrvTrendChart from '@/components/HrvTrendChart';
import { useBreathingEngine } from '@/hooks/useBreathingEngine';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { useAudioCues } from '@/hooks/useAudioCues';
import { useHrvLog } from '@/hooks/useHrvLog';
import { PROTOCOLS, getProtocolsByMode, PHASE_INSTRUCTIONS } from '@/lib/protocols';
import type { Protocol } from '@/lib/protocols';

const DAY_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/109699472/W9zmLSCMB5TJW5GPoehiUK/hrv-day-bg-WLtxQDpSwJmu3hKHgWRT36.webp';
const NIGHT_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/109699472/W9zmLSCMB5TJW5GPoehiUK/hrv-night-bg-D8PPZ2JMBdfAxTVL62JjX4.webp';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function useOrbSize() {
  const [size, setSize] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 240 : 190
  );
  useEffect(() => {
    const handler = () => setSize(window.innerWidth >= 768 ? 240 : 190);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
}

type Tab = 'breathe' | 'hrv';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('breathe');
  const [isNightMode, setIsNightMode] = useState(() => {
    const h = new Date().getHours();
    return h >= 20 || h < 7;
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>(() => {
    const h = new Date().getHours();
    const night = h >= 20 || h < 7;
    return night
      ? PROTOCOLS.find(p => p.id === 'sleep-prep')!
      : PROTOCOLS.find(p => p.id === 'resonance')!;
  });
  const [sessionMinutes, setSessionMinutes] = useState(selectedProtocol.sessionDuration);
  const [showProtocolDetail, setShowProtocolDetail] = useState(false);
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [showHrvEntry, setShowHrvEntry] = useState(false);

  const orbSize = useOrbSize();
  const prevPhaseIndexRef = useRef<number>(-1);
  const prevCountdownRef = useRef<number>(4);
  const sessionStartedRef = useRef(false);

  const { sessions, addSession, getStats } = useSessionHistory();
  const sessionStats = getStats();

  const { entries, addEntry, removeEntry, getStats: getHrvStats, getChartData } = useHrvLog();
  const hrvStats = getHrvStats();
  const chartData30 = getChartData(30);

  const [breathingState, controls] = useBreathingEngine(selectedProtocol, sessionMinutes);
  const { playTone, playCountdownBeep, playSessionComplete } = useAudioCues({
    isNightMode,
    enabled: soundEnabled,
  });

  // Audio: phase change
  useEffect(() => {
    if (
      breathingState.sessionState === 'active' &&
      breathingState.currentPhase &&
      breathingState.currentPhaseIndex !== prevPhaseIndexRef.current
    ) {
      prevPhaseIndexRef.current = breathingState.currentPhaseIndex;
      playTone(breathingState.currentPhase.type);
    }
  }, [breathingState.currentPhaseIndex, breathingState.sessionState, breathingState.currentPhase, playTone]);

  // Audio: countdown
  useEffect(() => {
    if (breathingState.sessionState === 'countdown') {
      const v = breathingState.countdownValue;
      if (v !== prevCountdownRef.current && v > 0) {
        prevCountdownRef.current = v;
        playCountdownBeep(v === 1);
      }
    } else {
      prevCountdownRef.current = 4;
    }
  }, [breathingState.countdownValue, breathingState.sessionState, playCountdownBeep]);

  // Session complete
  useEffect(() => {
    if (breathingState.sessionState === 'complete' && sessionStartedRef.current) {
      sessionStartedRef.current = false;
      playSessionComplete();
      addSession({
        protocolId: selectedProtocol.id,
        protocolName: selectedProtocol.name,
        durationMinutes: sessionMinutes,
        cyclesCompleted: breathingState.cycleCount,
        totalBreaths: breathingState.totalBreaths,
        mode: isNightMode ? 'night' : 'day',
      });
    }
  }, [breathingState.sessionState]);

  const handleStart = useCallback(() => {
    sessionStartedRef.current = true;
    controls.start();
  }, [controls]);

  const handleProtocolSelect = useCallback((p: Protocol) => {
    controls.stop();
    setSelectedProtocol(p);
    setSessionMinutes(p.sessionDuration);
    setShowProtocolDetail(false);
  }, [controls]);

  const handleModeToggle = useCallback(() => {
    controls.stop();
    setIsNightMode(n => {
      const next = !n;
      if (next) {
        const p = PROTOCOLS.find(x => x.id === 'sleep-prep')!;
        setSelectedProtocol(p);
        setSessionMinutes(p.sessionDuration);
      } else {
        const p = PROTOCOLS.find(x => x.id === 'resonance')!;
        setSelectedProtocol(p);
        setSessionMinutes(p.sessionDuration);
      }
      return next;
    });
  }, [controls]);

  const filteredProtocols = getProtocolsByMode(isNightMode ? 'night' : 'day');
  const isActive = breathingState.sessionState === 'active';
  const isPaused = breathingState.sessionState === 'paused';
  const isSessionActive = isActive || isPaused;
  const isComplete = breathingState.sessionState === 'complete';
  const isCountdown = breathingState.sessionState === 'countdown';
  const isIdle = breathingState.sessionState === 'idle';

  const accentColor = isNightMode ? '#f59e0b' : '#00b4d8';
  const accentGlow = isNightMode ? 'rgba(245,158,11,0.3)' : 'rgba(0,180,216,0.3)';
  const accentDim = isNightMode ? 'rgba(245,158,11,0.12)' : 'rgba(0,180,216,0.10)';
  const accentBorder = isNightMode ? 'rgba(245,158,11,0.35)' : 'rgba(0,180,216,0.28)';

  return (
    <div
      className={`relative w-full flex flex-col ${isNightMode ? 'night-mode' : ''}`}
      style={{ height: '100dvh', background: 'var(--bg-gradient)', overflow: 'hidden' }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${isNightMode ? NIGHT_BG : DAY_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.14,
          transition: 'opacity 1.2s ease',
        }}
      />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: isNightMode
            ? 'linear-gradient(to bottom, rgba(8,5,22,0.85) 0%, rgba(26,15,58,0.42) 45%, rgba(8,5,22,0.92) 100%)'
            : 'linear-gradient(to bottom, rgba(7,26,46,0.85) 0%, rgba(13,79,92,0.32) 45%, rgba(7,26,46,0.92) 100%)',
        }}
      />

      {/* ─── TOP BAR ─── */}
      <div className="relative z-10 flex-shrink-0 safe-top">
        <div className="app-container flex items-center justify-between px-4 pt-3 pb-1">
          {/* Left: branding */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-white font-semibold text-base leading-none tracking-tight">
                PGIS Breathe
              </h1>
              <span
                className="text-xs px-1.5 py-0.5 rounded font-semibold"
                style={{
                  background: accentDim,
                  border: `1px solid ${accentBorder}`,
                  color: accentColor,
                  fontSize: '0.6rem',
                  letterSpacing: '0.08em',
                }}
              >
                PGIS
              </span>
            </div>
            <p className="text-white/30 text-xs mt-0.5 font-medium">
              {isNightMode ? 'Night Recovery' : 'Day Performance'}
              {hrvStats.latest && (
                <span className="ml-2" style={{ color: accentColor + 'cc' }}>
                  · HRV {hrvStats.latest} ms
                </span>
              )}
            </p>
          </div>

          {/* Right: controls + blog link */}
          <div className="flex items-center gap-1.5">
            {/* Blog link — desktop only */}
            <a
              href="https://DoctorsWhoCode.blog"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium transition-all hover:opacity-80"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              DoctorsWhoCode.blog
            </a>

            {/* Sound */}
            <button
              onClick={() => setSoundEnabled(s => !s)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{
                background: soundEnabled ? accentDim : 'rgba(255,255,255,0.06)',
                border: `1px solid ${soundEnabled ? accentBorder : 'rgba(255,255,255,0.09)'}`,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={soundEnabled ? accentColor : 'rgba(255,255,255,0.35)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {soundEnabled ? (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                  </>
                )}
              </svg>
            </button>

            {/* Day/Night */}
            <button
              onClick={handleModeToggle}
              className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold transition-all"
              style={{ background: accentDim, border: `1px solid ${accentBorder}`, color: accentColor }}
            >
              {isNightMode ? '☽ Night' : '☀ Day'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── TAB BAR ─── */}
      <div className="relative z-10 flex-shrink-0">
        <div className="app-container flex items-center gap-1 px-4 pb-1">
          {([
            { id: 'breathe' as Tab, label: 'Breathe', icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12" />
                <path d="M12 6v6l4 2" />
              </svg>
            )},
            { id: 'hrv' as Tab, label: 'HRV Log', icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            )},
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: activeTab === tab.id ? accentDim : 'transparent',
                border: `1px solid ${activeTab === tab.id ? accentBorder : 'transparent'}`,
                color: activeTab === tab.id ? accentColor : 'rgba(255,255,255,0.3)',
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'hrv' && hrvStats.totalEntries > 0 && (
                <span
                  className="rounded-full px-1 text-xs font-bold"
                  style={{ background: accentDim, color: accentColor, fontSize: '0.55rem' }}
                >
                  {hrvStats.totalEntries}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── BREATHE TAB ─── */}
      {activeTab === 'breathe' && (
        /* Desktop: two-column row. Mobile: stacked column */
        <div className="relative z-10 flex-1 min-h-0 flex flex-col md:flex-row md:overflow-hidden">

          {/* ── ORB COLUMN (left / center on desktop, full on mobile) ── */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 gap-3 md:gap-6 min-h-0 py-4 md:py-6">
            {isComplete ? (
              <div className="w-full max-w-sm">
                <SessionComplete
                  protocol={selectedProtocol}
                  cyclesCompleted={breathingState.cycleCount}
                  totalBreaths={breathingState.totalBreaths}
                  durationMinutes={sessionMinutes}
                  isNightMode={isNightMode}
                  onDone={controls.reset}
                  onRepeat={() => { controls.reset(); setTimeout(handleStart, 150); }}
                />
              </div>
            ) : (
              <>
                {/* Protocol name / Timer */}
                <div className="text-center flex-shrink-0" style={{ minHeight: 52 }}>
                  {isIdle && (
                    <div className="animate-fade-in">
                      <h2 className="font-display text-white text-xl md:text-2xl font-semibold leading-tight">
                        {selectedProtocol.name}
                      </h2>
                      <p className="text-white/40 text-sm mt-1">{selectedProtocol.subtitle}</p>
                    </div>
                  )}
                  {(isSessionActive || isCountdown) && (
                    <div className="animate-fade-in">
                      <div
                        className="font-mono-nums text-2xl md:text-3xl font-medium"
                        style={{ color: accentColor, textShadow: `0 0 20px ${accentGlow}` }}
                      >
                        {formatTime(breathingState.sessionElapsed)}
                        <span className="text-white/25 text-base ml-1">/ {formatTime(sessionMinutes * 60)}</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center mt-1">
                        <div className="h-0.5 rounded-full overflow-hidden" style={{ width: 120, background: 'rgba(255,255,255,0.08)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${breathingState.sessionProgress * 100}%`,
                              background: accentColor,
                              transition: 'width 0.3s linear',
                            }}
                          />
                        </div>
                        <span className="text-white/25 text-xs font-mono-nums">{breathingState.cycleCount} cycles</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Orb */}
                <div
                  className="flex items-center justify-center flex-shrink-0 cursor-pointer"
                  onClick={() => {
                    if (isIdle) handleStart();
                    else if (isActive) controls.pause();
                    else if (isPaused) controls.resume();
                  }}
                >
                  <BreathingOrb
                    scale={breathingState.orbScale}
                    phase={breathingState.currentPhase}
                    phaseProgress={breathingState.phaseProgress}
                    sessionState={breathingState.sessionState}
                    isNightMode={isNightMode}
                    size={orbSize}
                    countdownValue={breathingState.countdownValue}
                  />
                </div>

                {/* Phase instruction */}
                <div className="text-center flex-shrink-0" style={{ minHeight: 44 }}>
                  {isSessionActive && breathingState.currentPhase && (
                    <div className="animate-fade-in" key={breathingState.currentPhaseIndex}>
                      <p className="phase-label text-white/75 text-base md:text-lg" style={{ textShadow: `0 0 16px ${accentGlow}` }}>
                        {breathingState.currentPhase.sublabel}
                      </p>
                      <p className="text-white/30 text-xs mt-0.5">
                        {PHASE_INSTRUCTIONS[breathingState.currentPhase.type]}
                      </p>
                    </div>
                  )}
                  {isIdle && (
                    <p className="text-white/35 text-sm animate-fade-in">
                      Tap the orb to begin · {sessionMinutes} min
                    </p>
                  )}
                  {isPaused && (
                    <p className="text-white/40 text-sm animate-fade-in">Paused — tap to resume</p>
                  )}
                </div>

                {/* Phase indicator */}
                <div className="flex-shrink-0 w-full max-w-xs md:max-w-sm">
                  <PhaseIndicator
                    phases={selectedProtocol.phases}
                    currentPhaseIndex={breathingState.currentPhaseIndex}
                    isNightMode={isNightMode}
                    isActive={isSessionActive}
                  />
                </div>

                {/* Waveform */}
                <div className="flex-shrink-0">
                  <WaveformVisualizer
                    orbScale={breathingState.orbScale}
                    isNightMode={isNightMode}
                    isActive={isSessionActive}
                    width={260}
                    height={40}
                  />
                </div>

                {isSessionActive && (
                  <button
                    onClick={controls.stop}
                    className="text-white/25 text-xs hover:text-white/50 transition-colors flex-shrink-0"
                  >
                    End session
                  </button>
                )}
              </>
            )}
          </div>

          {/* ── PROTOCOL PANEL — desktop right sidebar, hidden on mobile ── */}
          {!isSessionActive && !isCountdown && !isComplete && (
            <div
              className="hidden md:flex flex-col flex-shrink-0 py-5 px-5 safe-bottom"
              style={{
                width: 320,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                borderLeft: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.12)',
              }}
            >
              {/* Duration picker */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/35 text-xs font-semibold uppercase tracking-widest">
                  {isNightMode ? 'Night Protocols' : 'Day Protocols'}
                </span>
                <div className="flex items-center gap-1">
                  {[5, 10, 15, 20].map((min) => (
                    <button
                      key={min}
                      onClick={() => setSessionMinutes(min)}
                      className="px-2 py-0.5 rounded text-xs font-semibold transition-all"
                      style={{
                        background: sessionMinutes === min ? accentDim : 'transparent',
                        color: sessionMinutes === min ? accentColor : 'rgba(255,255,255,0.25)',
                        border: `1px solid ${sessionMinutes === min ? accentBorder : 'transparent'}`,
                      }}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Protocol cards — vertical list, full-width in sidebar */}
              <div className="flex flex-col gap-2.5">
                {filteredProtocols.map((protocol) => (
                  <ProtocolCard
                    key={protocol.id}
                    protocol={protocol}
                    isSelected={selectedProtocol.id === protocol.id}
                    isNightMode={isNightMode}
                    onClick={() => handleProtocolSelect(protocol)}
                    fillWidth
                  />
                ))}
              </div>

              {/* About this protocol — always visible in sidebar */}
              <div
                className="mt-4 rounded-xl p-3 text-xs"
                style={{ background: accentDim, border: `1px solid ${accentBorder}` }}
              >
                <p className="font-semibold mb-1" style={{ color: accentColor }}>{selectedProtocol.name}</p>
                <p className="text-white/50 leading-relaxed mb-2">{selectedProtocol.description}</p>
                <div className="border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <p className="text-white/35 font-semibold uppercase tracking-wider mb-1" style={{ fontSize: '0.6rem' }}>Evidence</p>
                  <p className="text-white/45 leading-relaxed">{selectedProtocol.evidence}</p>
                  <p className="text-white/22 mt-1 italic">{selectedProtocol.citation}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── PROTOCOL SELECTOR — mobile bottom strip (unchanged) ── */}
          {!isSessionActive && !isCountdown && !isComplete && (
            <div className="md:hidden relative z-10 flex-shrink-0 pb-2 safe-bottom">
              <div className="flex items-center justify-between px-4 mb-2">
                <span className="text-white/35 text-xs font-semibold uppercase tracking-widest">
                  {isNightMode ? 'Night Protocols' : 'Day Protocols'}
                </span>
                <div className="flex items-center gap-1">
                  {[5, 10, 15, 20].map((min) => (
                    <button
                      key={min}
                      onClick={() => setSessionMinutes(min)}
                      className="px-2 py-0.5 rounded text-xs font-semibold transition-all"
                      style={{
                        background: sessionMinutes === min ? accentDim : 'transparent',
                        color: sessionMinutes === min ? accentColor : 'rgba(255,255,255,0.25)',
                        border: `1px solid ${sessionMinutes === min ? accentBorder : 'transparent'}`,
                      }}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="flex gap-3 overflow-x-auto px-4 pb-1"
                style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
              >
                {filteredProtocols.map((protocol) => (
                  <div key={protocol.id} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
                    <ProtocolCard
                      protocol={protocol}
                      isSelected={selectedProtocol.id === protocol.id}
                      isNightMode={isNightMode}
                      onClick={() => handleProtocolSelect(protocol)}
                    />
                  </div>
                ))}
              </div>

              <div className="px-4 mt-1.5 flex items-center justify-between">
                <button
                  onClick={() => setShowProtocolDetail(d => !d)}
                  className="text-xs flex items-center gap-1 transition-colors"
                  style={{ color: accentColor + '88' }}
                >
                  <svg
                    width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: showProtocolDetail ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  {showProtocolDetail ? 'Hide details' : 'About this protocol'}
                </button>

                <a
                  href="https://DoctorsWhoCode.blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 transition-colors hover:opacity-80"
                  style={{ color: 'rgba(255,255,255,0.22)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  DoctorsWhoCode.blog
                </a>
              </div>

              {showProtocolDetail && (
                <div className="px-4 mt-2">
                  <div className="glass-card p-3 animate-fade-in-up max-h-44 overflow-y-auto">
                    <h4 className="font-display text-white font-semibold text-sm mb-1">{selectedProtocol.name}</h4>
                    <p className="text-white/55 text-xs leading-relaxed mb-2">{selectedProtocol.description}</p>
                    <div className="border-t border-white/08 pt-2">
                      <p className="text-white/35 text-xs font-semibold uppercase tracking-wider mb-1">Evidence</p>
                      <p className="text-white/50 text-xs leading-relaxed">{selectedProtocol.evidence}</p>
                      <p className="text-white/25 text-xs mt-1 italic">{selectedProtocol.citation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── HRV LOG TAB ─── */}
      {activeTab === 'hrv' && (
        <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-4 safe-bottom">
          <div className="hrv-container mx-auto py-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-display text-white font-semibold text-base">Garmin HRV Tracker</h2>
                <p className="text-white/35 text-xs mt-0.5">Daily HRV readings from your Garmin device</p>
              </div>
              <button
                onClick={() => setShowHrvEntry(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: accentColor,
                  color: isNightMode ? '#1a0f3a' : '#071a2e',
                  boxShadow: `0 0 16px ${accentGlow}`,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Log Today
              </button>
            </div>

            {/* Desktop two-column layout */}
            <div className="md:grid md:grid-cols-2 md:gap-4">
              {/* Trend chart */}
              <div className="glass-card p-4 mb-3 md:mb-0">
                <HrvTrendChart
                  data={chartData30}
                  stats={hrvStats}
                  isNightMode={isNightMode}
                  onAddEntry={() => setShowHrvEntry(true)}
                  onRemoveEntry={(date) => {
                    const entry = entries.find(e => e.date === date);
                    if (entry) removeEntry(entry.id);
                  }}
                />
              </div>

              {/* Session breathing stats */}
              <div className="glass-card p-4 mb-3 md:mb-0">
                <h3 className="font-display text-white font-semibold text-sm mb-3">Breathing Sessions</h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'Sessions', value: sessionStats.total, color: accentColor },
                    { label: 'Total Min', value: sessionStats.totalMinutes, color: 'rgba(255,255,255,0.7)' },
                    { label: 'Day Streak', value: sessionStats.streak, color: '#4ade80' },
                  ].map(s => (
                    <div key={s.label} className="flex flex-col items-center gap-0.5 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <span className="font-mono-nums font-semibold text-lg" style={{ color: s.color }}>{s.value}</span>
                      <span className="text-white/30 text-xs">{s.label}</span>
                    </div>
                  ))}
                </div>

                {sessions.length === 0 ? (
                  <p className="text-white/25 text-xs text-center py-2">No sessions yet — switch to Breathe tab to start.</p>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                    <span className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-0.5">Recent Sessions</span>
                    {sessions.slice(0, 8).map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <span className="text-white/60 font-medium truncate max-w-[130px]">{s.protocolName}</span>
                        <span className="text-white/30">{s.durationMinutes}m · {s.cyclesCompleted} cycles</span>
                        <span className="text-white/20">{new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* PGIS integration note */}
            <div
              className="mt-3 rounded-xl p-3 text-xs"
              style={{ background: accentDim, border: `1px solid ${accentBorder}` }}
            >
              <p className="font-semibold mb-0.5" style={{ color: accentColor }}>PGIS Integration</p>
              <p className="text-white/45 leading-relaxed">
                HRV data logged here is stored locally on your device. For full PGIS integration, export your data from Garmin Connect and correlate with CGM, HRV, and training metrics in the main PGIS system.
              </p>
            </div>

            {/* Footer blog link */}
            <div className="mt-4 text-center">
              <a
                href="https://DoctorsWhoCode.blog"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
                style={{ color: 'rgba(255,255,255,0.20)' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                DoctorsWhoCode.blog
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── HRV ENTRY MODAL ─── */}
      {showHrvEntry && (
        <HrvLogEntry
          isNightMode={isNightMode}
          onSave={(hrv, date, notes, timeOfDay) => addEntry(hrv, date, notes, timeOfDay)}
          onClose={() => setShowHrvEntry(false)}
          existingEntry={entries.find(e => e.date === new Date().toISOString().slice(0, 10)) ?? null}
        />
      )}
    </div>
  );
}
