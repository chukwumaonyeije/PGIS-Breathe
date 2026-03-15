/*
 * HrvTrendChart — SVG-based HRV trend visualization
 * Part of PGIS Breathe
 *
 * Features:
 * - 7-day and 30-day views
 * - HRV zone color bands (Excellent / Good / Moderate / Low)
 * - Smooth bezier curve through data points
 * - Hover/tap tooltips
 * - 7-day rolling average line
 * - Stats summary row
 */

import React, { useState, useRef, useCallback } from 'react';
import type { HrvStats } from '@/hooks/useHrvLog';

interface ChartPoint {
  date: string;
  hrv: number | null;
  label: string;
}

interface HrvTrendChartProps {
  data: ChartPoint[];
  stats: HrvStats;
  isNightMode: boolean;
  onAddEntry: () => void;
  onRemoveEntry?: (date: string) => void;
}

const ZONES = [
  { min: 80,  max: 200, color: 'rgba(74,222,128,0.07)',  label: 'Excellent' },
  { min: 60,  max: 80,  color: 'rgba(134,239,172,0.06)', label: 'Good' },
  { min: 40,  max: 60,  color: 'rgba(251,191,36,0.06)',  label: 'Moderate' },
  { min: 25,  max: 40,  color: 'rgba(251,146,60,0.07)',  label: 'Low' },
  { min: 0,   max: 25,  color: 'rgba(248,113,113,0.07)', label: 'Very Low' },
];

function getZoneColor(hrv: number): string {
  if (hrv >= 80) return '#4ade80';
  if (hrv >= 60) return '#86efac';
  if (hrv >= 40) return '#fbbf24';
  if (hrv >= 25) return '#fb923c';
  return '#f87171';
}

export default function HrvTrendChart({
  data,
  stats,
  isNightMode,
  onAddEntry,
  onRemoveEntry,
}: HrvTrendChartProps) {
  const [view, setView] = useState<7 | 30>(30);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: ChartPoint } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const accentColor = isNightMode ? '#f59e0b' : '#00b4d8';
  const accentDim = isNightMode ? 'rgba(245,158,11,0.12)' : 'rgba(0,180,216,0.10)';
  const accentBorder = isNightMode ? 'rgba(245,158,11,0.3)' : 'rgba(0,180,216,0.25)';

  const displayData = view === 7 ? data.slice(-7) : data;
  const validPoints = displayData.filter(d => d.hrv !== null) as (ChartPoint & { hrv: number })[];

  const W = 320;
  const H = 140;
  const PAD = { top: 16, right: 12, bottom: 28, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const allHrv = validPoints.map(p => p.hrv);
  const minHrv = allHrv.length ? Math.max(0, Math.min(...allHrv) - 10) : 0;
  const maxHrv = allHrv.length ? Math.max(...allHrv) + 15 : 100;

  const toX = (i: number) => PAD.left + (i / (displayData.length - 1)) * chartW;
  const toY = (hrv: number) => PAD.top + chartH - ((hrv - minHrv) / (maxHrv - minHrv)) * chartH;

  // Build SVG path for the line
  const buildPath = (points: { x: number; y: number }[]): string => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX} ${prev.y} ${cpX} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return d;
  };

  // Map valid points to SVG coords
  const svgPoints = validPoints.map(p => {
    const idx = displayData.findIndex(d => d.date === p.date);
    return { x: toX(idx), y: toY(p.hrv), point: p };
  });

  const linePath = buildPath(svgPoints.map(p => ({ x: p.x, y: p.y })));

  // Rolling 7-day average line
  const avgPoints: { x: number; y: number }[] = [];
  for (let i = 0; i < displayData.length; i++) {
    const window = displayData.slice(Math.max(0, i - 6), i + 1).filter(d => d.hrv !== null);
    if (window.length >= 2) {
      const avg = window.reduce((s, d) => s + (d.hrv ?? 0), 0) / window.length;
      avgPoints.push({ x: toX(i), y: toY(avg) });
    }
  }
  const avgPath = buildPath(avgPoints);

  // Area fill path
  const areaPath = svgPoints.length >= 2
    ? `${linePath} L ${svgPoints[svgPoints.length - 1].x} ${PAD.top + chartH} L ${svgPoints[0].x} ${PAD.top + chartH} Z`
    : '';

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    // Find closest point
    let closest: typeof svgPoints[0] | null = null;
    let minDist = Infinity;
    for (const sp of svgPoints) {
      const dist = Math.abs(sp.x - mx);
      if (dist < minDist) { minDist = dist; closest = sp; }
    }
    if (closest && minDist < 24) {
      setTooltip(prev =>
        prev?.point.date === closest!.point.date ? null : { x: closest!.x, y: closest!.y, point: closest!.point }
      );
    } else {
      setTooltip(null);
    }
  }, [svgPoints]);

  const trendIcon = stats.trend7 === 'up' ? '↑' : stats.trend7 === 'down' ? '↓' : stats.trend7 === 'stable' ? '→' : '—';
  const trendColor = stats.trend7 === 'up' ? '#4ade80' : stats.trend7 === 'down' ? '#f87171' : 'rgba(255,255,255,0.4)';

  return (
    <div className="flex flex-col gap-3">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Latest', value: stats.latest ? `${stats.latest}` : '—', unit: 'ms', color: stats.latest ? getZoneColor(stats.latest) : 'rgba(255,255,255,0.3)' },
          { label: '7d Avg', value: stats.avg7 ? `${stats.avg7}` : '—', unit: 'ms', color: accentColor },
          { label: '30d Avg', value: stats.avg30 ? `${stats.avg30}` : '—', unit: 'ms', color: 'rgba(255,255,255,0.6)' },
          { label: 'Trend', value: trendIcon, unit: '', color: trendColor },
        ].map(s => (
          <div
            key={s.label}
            className="glass-card p-2.5 flex flex-col items-center gap-0.5"
          >
            <div className="font-mono-nums font-semibold text-lg leading-none" style={{ color: s.color }}>
              {s.value}
              {s.unit && <span className="text-xs font-normal text-white/30 ml-0.5">{s.unit}</span>}
            </div>
            <div className="text-white/35 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart header */}
      <div className="flex items-center justify-between">
        <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">
          Garmin HRV Trend
        </span>
        <div className="flex items-center gap-1.5">
          {([7, 30] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-2 py-0.5 rounded text-xs font-semibold transition-all"
              style={{
                background: view === v ? accentDim : 'transparent',
                color: view === v ? accentColor : 'rgba(255,255,255,0.25)',
                border: `1px solid ${view === v ? accentBorder : 'transparent'}`,
              }}
            >
              {v}d
            </button>
          ))}
          <button
            onClick={onAddEntry}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold transition-all ml-1"
            style={{
              background: accentDim,
              border: `1px solid ${accentBorder}`,
              color: accentColor,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Log HRV
          </button>
        </div>
      </div>

      {/* SVG Chart */}
      {validPoints.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-xl py-8"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <p className="text-white/25 text-xs text-center">
            No HRV data yet.<br />Tap "Log HRV" to add your first Garmin reading.
          </p>
        </div>
      ) : (
        <div className="relative" style={{ width: W, maxWidth: '100%' }}>
          <svg
            ref={svgRef}
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            onClick={handleSvgClick}
            style={{ cursor: 'crosshair', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="hrv-area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
              </linearGradient>
              <clipPath id="chart-clip">
                <rect x={PAD.left} y={PAD.top} width={chartW} height={chartH} />
              </clipPath>
            </defs>

            {/* Zone bands */}
            {ZONES.map(zone => {
              const y1 = toY(Math.min(zone.max, maxHrv));
              const y2 = toY(Math.max(zone.min, minHrv));
              if (y2 <= PAD.top || y1 >= PAD.top + chartH) return null;
              return (
                <rect
                  key={zone.label}
                  x={PAD.left}
                  y={Math.max(PAD.top, y1)}
                  width={chartW}
                  height={Math.min(y2, PAD.top + chartH) - Math.max(PAD.top, y1)}
                  fill={zone.color}
                />
              );
            })}

            {/* Grid lines */}
            {[25, 40, 60, 80].map(v => {
              if (v < minHrv || v > maxHrv) return null;
              const y = toY(v);
              return (
                <g key={v}>
                  <line
                    x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
                    stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3,4"
                  />
                  <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.25)">{v}</text>
                </g>
              );
            })}

            {/* Area fill */}
            {areaPath && (
              <path d={areaPath} fill="url(#hrv-area-grad)" clipPath="url(#chart-clip)" />
            )}

            {/* 7-day avg line */}
            {avgPath && (
              <path
                d={avgPath}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
                strokeDasharray="4,3"
                clipPath="url(#chart-clip)"
              />
            )}

            {/* Main line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
                strokeLinecap="round"
                clipPath="url(#chart-clip)"
              />
            )}

            {/* Data points */}
            {svgPoints.map(sp => (
              <g key={sp.point.date}>
                <circle
                  cx={sp.x} cy={sp.y} r={tooltip?.point.date === sp.point.date ? 5 : 3.5}
                  fill={getZoneColor(sp.point.hrv)}
                  stroke={tooltip?.point.date === sp.point.date ? 'white' : 'rgba(0,0,0,0.4)'}
                  strokeWidth={tooltip?.point.date === sp.point.date ? 1.5 : 1}
                  style={{ transition: 'r 0.15s ease' }}
                />
              </g>
            ))}

            {/* X-axis labels — show every N-th */}
            {displayData.map((d, i) => {
              const step = view === 7 ? 1 : 5;
              if (i % step !== 0 && i !== displayData.length - 1) return null;
              return (
                <text
                  key={d.date}
                  x={toX(i)}
                  y={H - 4}
                  textAnchor="middle"
                  fontSize="8"
                  fill="rgba(255,255,255,0.25)"
                >
                  {d.label}
                </text>
              );
            })}

            {/* Tooltip */}
            {tooltip && (() => {
              const tx = Math.min(Math.max(tooltip.x, PAD.left + 30), W - 50);
              const ty = tooltip.y > PAD.top + 40 ? tooltip.y - 38 : tooltip.y + 12;
              return (
                <g>
                  <rect
                    x={tx - 30} y={ty} width={60} height={28}
                    rx={5} ry={5}
                    fill={isNightMode ? 'rgba(26,15,58,0.95)' : 'rgba(7,26,46,0.95)'}
                    stroke={accentBorder}
                    strokeWidth="1"
                  />
                  <text x={tx} y={ty + 11} textAnchor="middle" fontSize="9" fill={getZoneColor(tooltip.point.hrv!)} fontWeight="bold">
                    {tooltip.point.hrv} ms
                  </text>
                  <text x={tx} y={ty + 22} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.4)">
                    {tooltip.point.label}
                  </text>
                </g>
              );
            })()}
          </svg>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-1 justify-end">
            <div className="flex items-center gap-1">
              <div className="w-4 h-0.5 rounded" style={{ background: accentColor }} />
              <span className="text-white/25 text-xs">HRV</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-0 border-t border-dashed border-white/20" />
              <span className="text-white/25 text-xs">7d avg</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent entries list */}
      {validPoints.length > 0 && (
        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
          <span className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-0.5">Recent Readings</span>
          {validPoints.slice(0, 7).map(p => (
            <div
              key={p.date}
              className="flex items-center justify-between text-xs py-1 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <span className="text-white/40">{new Date(p.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: getZoneColor(p.hrv) }} />
                <span className="font-mono-nums font-semibold" style={{ color: getZoneColor(p.hrv) }}>{p.hrv}</span>
                <span className="text-white/25">ms</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
