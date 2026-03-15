/*
 * WaveformVisualizer — Real-time breathing waveform
 * Design: Medical Biophilic
 *
 * Draws a smooth sine-like waveform representing the breathing pattern.
 * Updates in real-time based on orb scale (lung volume proxy).
 */

import React, { useRef, useEffect } from 'react';

interface WaveformVisualizerProps {
  orbScale: number;     // 0.75–1.15
  isNightMode: boolean;
  isActive: boolean;
  width?: number;
  height?: number;
}

export default function WaveformVisualizer({
  orbScale,
  isNightMode,
  isActive,
  width = 280,
  height = 48,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);

  const primaryColor = isNightMode ? '#a78bfa' : '#00b4d8';
  const glowColor = isNightMode ? 'rgba(167,139,250,0.4)' : 'rgba(0,180,216,0.4)';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Push current scale to history
    const maxPoints = Math.floor(width * 0.8);
    historyRef.current.push(orbScale);
    if (historyRef.current.length > maxPoints) {
      historyRef.current.shift();
    }

    const history = historyRef.current;
    const MIN_SCALE = 0.75;
    const MAX_SCALE = 1.15;
    const range = MAX_SCALE - MIN_SCALE;

    // Clear
    ctx.clearRect(0, 0, width, height);

    if (history.length < 2) return;

    // Draw waveform
    ctx.beginPath();
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isActive ? 6 : 0;

    const stepX = width / maxPoints;
    const padding = height * 0.15;
    const drawHeight = height - padding * 2;

    for (let i = 0; i < history.length; i++) {
      const x = i * stepX;
      const normalized = (history[i] - MIN_SCALE) / range;
      const y = padding + drawHeight * (1 - normalized);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        // Smooth curve
        const prevX = (i - 1) * stepX;
        const prevNorm = (history[i - 1] - MIN_SCALE) / range;
        const prevY = padding + drawHeight * (1 - prevNorm);
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    }
    ctx.stroke();

    // Gradient fill under curve
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, primaryColor + '30');
    gradient.addColorStop(1, 'transparent');

    ctx.lineTo(history.length * stepX, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }, [orbScale, isNightMode, isActive, width, height, primaryColor, glowColor]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        opacity: isActive ? 0.8 : 0.3,
        transition: 'opacity 0.5s ease',
      }}
    />
  );
}
