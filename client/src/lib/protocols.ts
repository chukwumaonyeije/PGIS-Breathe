/*
 * HRV Breathing Protocols — Evidence-Based Parameters
 * Design: Medical Biophilic
 *
 * Sources:
 * - Resonance/Coherent: Chaitanya et al. (2022), Steffen et al. (2017), Lehrer & Gevirtz (2014)
 * - 4-7-8: Vierra et al. (2022), Weil (2015)
 * - Box Breathing: Kasap et al. (2025), US Navy SEAL protocol
 * - Extended Exhale: Magnon et al. (2021), Birdee et al. (2023)
 * - Alternate Nostril: Laborde et al. (2022)
 */

export type PhaseType = 'inhale' | 'hold' | 'exhale' | 'hold2';

export interface Phase {
  type: PhaseType;
  duration: number; // seconds
  label: string;
  sublabel?: string;
  color: string;
}

export interface Protocol {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  mechanism: string;
  evidence: string;
  citation: string;
  mode: 'day' | 'night' | 'both';
  phases: Phase[];
  sessionDuration: number; // recommended minutes
  bpm: number; // breaths per minute
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  color: string; // primary accent color
  glowColor: string;
}

export const PROTOCOLS: Protocol[] = [
  {
    id: 'resonance',
    name: 'Resonance Breathing',
    subtitle: 'The Gold Standard',
    description:
      'Breathe at exactly 6 breaths per minute to synchronize your heart rate with your breathing, maximizing HRV amplitude through baroreflex resonance at 0.1 Hz.',
    mechanism:
      'At ~0.1 Hz (6 BPM), breathing entrains the baroreflex loop, creating maximal oscillation in heart rate and blood pressure. This resonance effect amplifies HRV more than any other technique.',
    evidence:
      '4 weeks of daily 20-min sessions significantly increases RMSSD and SDNN. Reduces cortisol, improves mood and cognitive performance.',
    citation: 'Chaitanya et al. (2022) · Steffen et al. (2017) · Lehrer & Gevirtz (2014)',
    mode: 'both',
    phases: [
      { type: 'inhale', duration: 5, label: 'Inhale', sublabel: 'Slow & deep', color: '#00b4d8' },
      { type: 'exhale', duration: 5, label: 'Exhale', sublabel: 'Slow & complete', color: '#48cae4' },
    ],
    sessionDuration: 20,
    bpm: 6,
    difficulty: 'beginner',
    tags: ['HRV', 'Resonance', 'Vagal Tone', 'Daily Practice'],
    color: '#00b4d8',
    glowColor: 'rgba(0, 180, 216, 0.4)',
  },
  {
    id: 'extended-exhale',
    name: 'Extended Exhale',
    subtitle: '1:2 Ratio Protocol',
    description:
      'Inhale for 4 seconds and exhale for 8 seconds. The extended exhale directly activates the vagus nerve, increasing high-frequency HRV and parasympathetic tone.',
    mechanism:
      'Longer exhalations increase vagal efferent activity via the nucleus ambiguus. The 1:2 inhale-to-exhale ratio maximizes respiratory sinus arrhythmia (RSA) and HF-HRV power.',
    evidence:
      'A single 5-minute session significantly increases HF-HRV and reduces anxiety. Particularly effective for acute stress recovery and pre-sleep relaxation.',
    citation: 'Magnon et al. (2021) · Birdee et al. (2023) · Laborde et al. (2022)',
    mode: 'both',
    phases: [
      { type: 'inhale', duration: 4, label: 'Inhale', sublabel: 'Breathe in gently', color: '#00b4d8' },
      { type: 'exhale', duration: 8, label: 'Exhale', sublabel: 'Long, slow release', color: '#48cae4' },
    ],
    sessionDuration: 10,
    bpm: 5,
    difficulty: 'beginner',
    tags: ['Vagal Tone', 'RSA', 'Stress Relief', 'Sleep'],
    color: '#48cae4',
    glowColor: 'rgba(72, 202, 228, 0.4)',
  },
  {
    id: '478',
    name: '4-7-8 Breathing',
    subtitle: 'Deep Relaxation Protocol',
    description:
      'Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds. The extended hold and exhale create powerful parasympathetic activation ideal for pre-sleep use.',
    mechanism:
      'The prolonged breath hold increases CO₂ tolerance and activates the dive reflex. The extended exhale maximizes vagal tone. Together they produce profound parasympathetic dominance.',
    evidence:
      'Improves HRV and lowers blood pressure, especially in sleep-deprived individuals. Reduces time to sleep onset. Effective for acute anxiety management.',
    citation: 'Vierra et al. (2022) · Cleveland Clinic (2022)',
    mode: 'night',
    phases: [
      { type: 'inhale', duration: 4, label: 'Inhale', sublabel: 'Through the nose', color: '#7c3aed' },
      { type: 'hold', duration: 7, label: 'Hold', sublabel: 'Retain gently', color: '#a78bfa' },
      { type: 'exhale', duration: 8, label: 'Exhale', sublabel: 'Through the mouth', color: '#f59e0b' },
    ],
    sessionDuration: 8,
    bpm: 3.2,
    difficulty: 'intermediate',
    tags: ['Sleep', 'Parasympathetic', 'Anxiety', 'Pre-Bed'],
    color: '#7c3aed',
    glowColor: 'rgba(124, 58, 237, 0.4)',
  },
  {
    id: 'box',
    name: 'Box Breathing',
    subtitle: 'Tactical Reset Protocol',
    description:
      'Equal 4-second phases: inhale, hold, exhale, hold. Used by Navy SEALs and high-performance athletes for rapid autonomic balance and stress recovery.',
    mechanism:
      'Symmetric breath holds engage both sympathetic and parasympathetic branches, producing autonomic balance. Reduces cortisol and improves HRV recovery after high-intensity stress.',
    evidence:
      'Effective for post-exercise HRV recovery. Reduces perceived stress and improves focus. Comparable HRV effects to resonance breathing in acute sessions.',
    citation: 'Kasap et al. (2025) · US Navy SEAL Protocol',
    mode: 'day',
    phases: [
      { type: 'inhale', duration: 4, label: 'Inhale', sublabel: 'Fill completely', color: '#00b4d8' },
      { type: 'hold', duration: 4, label: 'Hold', sublabel: 'Top of breath', color: '#90e0ef' },
      { type: 'exhale', duration: 4, label: 'Exhale', sublabel: 'Empty fully', color: '#48cae4' },
      { type: 'hold2', duration: 4, label: 'Hold', sublabel: 'Bottom of breath', color: '#ade8f4' },
    ],
    sessionDuration: 5,
    bpm: 3.75,
    difficulty: 'beginner',
    tags: ['Focus', 'Recovery', 'Stress Reset', 'Performance'],
    color: '#0077a8',
    glowColor: 'rgba(0, 119, 168, 0.4)',
  },
  {
    id: 'slow-deep',
    name: 'Slow Deep Breathing',
    subtitle: 'Diaphragmatic Protocol',
    description:
      'Slow, diaphragmatic breathing at 4-6 breaths per minute with full belly expansion. The foundational technique for sustained HRV improvement over weeks.',
    mechanism:
      'Diaphragmatic breathing increases intra-abdominal pressure, stimulating vagal afferents. Slow rate (4-6 BPM) keeps breathing within the resonance window for maximum HRV benefit.',
    evidence:
      'Meta-analysis of 15 studies shows significant increases in RMSSD and HF-HRV. One month of daily practice reduces blood pressure and resting heart rate.',
    citation: 'Laborde et al. (2022) · Westbrook et al. (2011)',
    mode: 'both',
    phases: [
      { type: 'inhale', duration: 5, label: 'Inhale', sublabel: 'Belly first, then chest', color: '#00b4d8' },
      { type: 'hold', duration: 2, label: 'Pause', sublabel: 'Brief natural pause', color: '#90e0ef' },
      { type: 'exhale', duration: 7, label: 'Exhale', sublabel: 'Slow, complete release', color: '#48cae4' },
    ],
    sessionDuration: 15,
    bpm: 4.3,
    difficulty: 'beginner',
    tags: ['Diaphragmatic', 'Foundation', 'Daily Practice', 'Blood Pressure'],
    color: '#0096c7',
    glowColor: 'rgba(0, 150, 199, 0.4)',
  },
  {
    id: 'sleep-prep',
    name: 'Sleep Preparation',
    subtitle: 'Pre-Sleep Wind-Down',
    description:
      'A progressive 3-phase wind-down sequence: Extended Exhale → 4-7-8 → Ultra-slow resonance. Designed to guide your nervous system from wakefulness to sleep readiness.',
    mechanism:
      'Progressive slowing of respiratory rate shifts autonomic balance toward parasympathetic dominance. Increasing exhale ratios progressively activate vagal brake, reducing heart rate and cortisol.',
    evidence:
      'Extended exhale breathing before bed improves sleep onset latency and sleep quality scores. Combined with 4-7-8, produces measurable HRV improvements overnight.',
    citation: 'Vierra et al. (2022) · Magnon et al. (2021)',
    mode: 'night',
    phases: [
      { type: 'inhale', duration: 4, label: 'Inhale', sublabel: 'Gentle breath in', color: '#7c3aed' },
      { type: 'hold', duration: 4, label: 'Hold', sublabel: 'Soft and easy', color: '#a78bfa' },
      { type: 'exhale', duration: 8, label: 'Exhale', sublabel: 'Let everything go', color: '#f59e0b' },
    ],
    sessionDuration: 12,
    bpm: 3.75,
    difficulty: 'beginner',
    tags: ['Sleep', 'Wind-Down', 'Pre-Bed', 'Melatonin'],
    color: '#6d28d9',
    glowColor: 'rgba(109, 40, 217, 0.4)',
  },
];

export const getProtocolsByMode = (mode: 'day' | 'night') =>
  PROTOCOLS.filter((p) => p.mode === mode || p.mode === 'both');

export const getProtocolById = (id: string) =>
  PROTOCOLS.find((p) => p.id === id);

export const PHASE_COLORS: Record<PhaseType, string> = {
  inhale: 'var(--phase-inhale)',
  hold: 'var(--phase-hold)',
  exhale: 'var(--phase-exhale)',
  hold2: 'var(--phase-hold2)',
};

export const PHASE_INSTRUCTIONS: Record<PhaseType, string> = {
  inhale: 'Breathe in slowly through your nose',
  hold: 'Hold gently — no tension',
  exhale: 'Release slowly through your mouth',
  hold2: 'Rest at the bottom — soft and easy',
};
