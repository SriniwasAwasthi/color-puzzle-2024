import { useEffect, useRef, useState, useCallback } from "react";

// ─── 432 Hz tuning ────────────────────────────────────────────
const TUNE = 432 / 440;
function hz(f: number) { return f * TUNE; }

// ─────────────────────────────────────────────────────────────
//  TRACK CATALOGUE
// ─────────────────────────────────────────────────────────────
export type TrackId = 0 | 1 | 2 | 3;

interface TrackDef {
  id: TrackId;
  name: string;
  emoji: string;
  desc: string;
  bpm: number;
  pads: number[][];      // 4 bars × n chord tones
  arp: number[][];       // 4 bars × n arp tones (one octave up)
  melody: number[];      // 32 melody steps (0 = rest)
  padVol: number;
  arpVol: number;
  melVol: number;
}

// ── Track 0 · Forest Bells (C major, 72 BPM) ─────────────────
const T0_PADS: number[][] = [
  [hz(130.81), hz(164.81), hz(196.00), hz(261.63)],
  [hz(110.00), hz(130.81), hz(164.81), hz(220.00)],
  [hz( 87.31), hz(110.00), hz(130.81), hz(174.61)],
  [hz( 98.00), hz(123.47), hz(146.83), hz(196.00)],
];
const T0_MELODY: number[] = [
  hz(523.25), hz(659.25), hz(783.99), hz(659.25),
  hz(587.33), hz(659.25), hz(523.25),           0,
  hz(440.00), hz(523.25), hz(659.25), hz(523.25),
  hz(493.88), hz(440.00), hz(392.00),           0,
  hz(349.23), hz(440.00), hz(523.25), hz(440.00),
  hz(392.00), hz(349.23), hz(329.63),           0,
  hz(392.00), hz(493.88), hz(587.33), hz(493.88),
  hz(440.00), hz(392.00),           0,          0,
];

// ── Track 1 · Ocean Drift (D minor, 58 BPM) ──────────────────
const T1_PADS: number[][] = [
  [hz(146.83), hz(174.61), hz(220.00), hz(293.66)],  // Dm
  [hz(110.00), hz(130.81), hz(164.81), hz(220.00)],  // Am
  [hz(116.54), hz(146.83), hz(174.61), hz(233.08)],  // Bb
  [hz( 87.31), hz(110.00), hz(130.81), hz(174.61)],  // F
];
const T1_MELODY: number[] = [
  hz(293.66),           0, hz(349.23), hz(440.00),
  hz(392.00), hz(349.23),           0,           0,
  hz(329.63),           0, hz(293.66),           0,
  hz(220.00), hz(261.63), hz(293.66),           0,
  hz(233.08),           0, hz(220.00), hz(196.00),
  hz(174.61),           0, hz(196.00),           0,
  hz(220.00), hz(261.63), hz(293.66), hz(261.63),
  hz(220.00), hz(196.00), hz(174.61),           0,
];

// ── Track 2 · Starlight (E major, 78 BPM) ────────────────────
const T2_PADS: number[][] = [
  [hz(164.81), hz(207.65), hz(246.94), hz(329.63)],  // E major
  [hz(138.59), hz(164.81), hz(207.65), hz(277.18)],  // C#m
  [hz(110.00), hz(138.59), hz(164.81), hz(220.00)],  // A major
  [hz(123.47), hz(155.56), hz(185.00), hz(246.94)],  // B major
];
const T2_MELODY: number[] = [
  hz(659.25), hz(554.37), hz(493.88), hz(415.30),
  hz(369.99), hz(329.63),           0, hz(246.94),
  hz(277.18), hz(329.63), hz(415.30), hz(369.99),
  hz(329.63),           0, hz(277.18),           0,
  hz(246.94), hz(207.65), hz(220.00), hz(246.94),
  hz(277.18), hz(329.63), hz(369.99),           0,
  hz(415.30), hz(369.99), hz(329.63), hz(277.18),
  hz(246.94), hz(220.00), hz(207.65),           0,
];

// ── Track 3 · Garden Waltz (G major, 92 BPM) ─────────────────
const T3_PADS: number[][] = [
  [hz( 98.00), hz(123.47), hz(146.83), hz(196.00)],  // G major
  [hz( 82.41), hz( 98.00), hz(123.47), hz(164.81)],  // Em
  [hz( 65.41), hz( 82.41), hz( 98.00), hz(130.81)],  // C major
  [hz( 73.42), hz( 92.50), hz(110.00), hz(146.83)],  // D major
];
const T3_MELODY: number[] = [
  hz(392.00), hz(440.00), hz(493.88), hz(440.00),
  hz(392.00), hz(329.63), hz(293.66),           0,
  hz(329.63), hz(392.00), hz(440.00), hz(392.00),
  hz(329.63), hz(293.66), hz(246.94),           0,
  hz(261.63), hz(293.66), hz(329.63), hz(392.00),
  hz(440.00), hz(493.88), hz(440.00),           0,
  hz(392.00), hz(329.63), hz(392.00), hz(440.00),
  hz(493.88), hz(392.00),           0,           0,
];

export const TRACKS: TrackDef[] = [
  {
    id: 0, name: "Forest Bells", emoji: "🌲", desc: "Calm & meditative",
    bpm: 72,
    pads: T0_PADS, arp: T0_PADS.map(ch => ch.map(f => f * 2)), melody: T0_MELODY,
    padVol: 0.06, arpVol: 0.028, melVol: 0.12,
  },
  {
    id: 1, name: "Ocean Drift", emoji: "🌊", desc: "Deep & flowing",
    bpm: 58,
    pads: T1_PADS, arp: T1_PADS.map(ch => ch.map(f => f * 2)), melody: T1_MELODY,
    padVol: 0.07, arpVol: 0.022, melVol: 0.10,
  },
  {
    id: 2, name: "Starlight", emoji: "✨", desc: "Bright & ethereal",
    bpm: 78,
    pads: T2_PADS, arp: T2_PADS.map(ch => ch.map(f => f * 2)), melody: T2_MELODY,
    padVol: 0.055, arpVol: 0.032, melVol: 0.13,
  },
  {
    id: 3, name: "Garden Waltz", emoji: "🌸", desc: "Playful & warm",
    bpm: 92,
    pads: T3_PADS, arp: T3_PADS.map(ch => ch.map(f => f * 2)), melody: T3_MELODY,
    padVol: 0.06, arpVol: 0.030, melVol: 0.11,
  },
];

// ─── Audio helpers ────────────────────────────────────────────

function padNote(
  ac: AudioContext, dest: AudioNode,
  freq: number, t: number, dur: number, vol: number
) {
  const osc  = ac.createOscillator(); osc.type  = "sine"; osc.frequency.value = freq;
  const osc2 = ac.createOscillator(); osc2.type = "sine"; osc2.frequency.value = freq * 1.0015;
  const g = ac.createGain();
  const attack = 0.35; const release = dur * 0.55;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.setValueAtTime(vol, t + dur - release);
  g.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(g); osc2.connect(g); g.connect(dest);
  osc.start(t);  osc.stop(t + dur + 0.05);
  osc2.start(t); osc2.stop(t + dur + 0.05);
}

function bellNote(
  ac: AudioContext, dest: AudioNode,
  freq: number, t: number, vol: number, dur: number
) {
  if (vol < 0.004 || freq <= 0) return;
  const osc = ac.createOscillator(); osc.type = "sine"; osc.frequency.value = freq;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.018);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur * 1.4);
  osc.connect(g); g.connect(dest);
  osc.start(t); osc.stop(t + dur * 1.5);
}

function melodyNote(
  ac: AudioContext, dest: AudioNode,
  freq: number, t: number, vol: number, dur: number
) {
  if (vol < 0.005 || freq <= 0) return;
  const sine = ac.createOscillator(); sine.type = "sine";     sine.frequency.value = freq;
  const tri  = ac.createOscillator(); tri.type  = "triangle"; tri.frequency.value  = freq;
  const filt = ac.createBiquadFilter(); filt.type = "lowpass";
  filt.frequency.value = freq * 3.5; filt.Q.value = 0.5;
  const gs = ac.createGain(); const gt = ac.createGain();
  gs.gain.setValueAtTime(0, t); gs.gain.linearRampToValueAtTime(vol * 0.65, t + 0.025);
  gs.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.92);
  gt.gain.setValueAtTime(0, t); gt.gain.linearRampToValueAtTime(vol * 0.35, t + 0.025);
  gt.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.92);
  sine.connect(gs); gs.connect(filt); filt.connect(dest);
  tri.connect(gt);  gt.connect(dest);
  sine.start(t); sine.stop(t + dur);
  tri.start(t);  tri.stop(t + dur);
}

// ─── Game state ───────────────────────────────────────────────
export type MusicState = { score: number; best: number; moveCount: number };

// ─── Hook ─────────────────────────────────────────────────────
export function useMusic(_state: MusicState) {
  const [muted,   setMuted]   = useState(false);
  const [trackId, setTrackId] = useState<TrackId>(0);

  const ctxRef     = useRef<AudioContext | null>(null);
  const masterRef  = useRef<GainNode | null>(null);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextRef    = useRef(0);
  const stepRef    = useRef(0);
  const started    = useRef(false);
  const trackIdRef = useRef<TrackId>(0);

  // Keep ref in sync
  trackIdRef.current = trackId;

  const schedule = useCallback(() => {
    const ac     = ctxRef.current;
    const master = masterRef.current;
    if (!ac || !master) return;

    const now = ac.currentTime;

    while (nextRef.current < now + 1.2) {
      const t   = nextRef.current;
      const trk = TRACKS[trackIdRef.current];
      const Q   = 60 / trk.bpm;
      const E   = Q / 2;
      const S   = Q / 4;
      const WHOLE = Q * 4;

      const pos  = stepRef.current % 64;
      const bar  = Math.floor(pos / 16);
      const bPos = pos % 16;

      // Pad chord (whole bar sustain)
      if (bPos === 0) {
        for (const freq of trk.pads[bar]) {
          padNote(ac, master, freq, t, WHOLE, trk.padVol);
        }
      }

      // Bell arpeggio (every 4 sixteenths)
      if (bPos % 4 === 0) {
        const arpIdx = (bPos / 4) % trk.arp[bar].length;
        bellNote(ac, master, trk.arp[bar][arpIdx], t, trk.arpVol, E * 1.5);
      }

      // Melody (every 2 sixteenths = eighth notes)
      if (pos % 2 === 0) {
        const mi = (pos / 2) % trk.melody.length;
        melodyNote(ac, master, trk.melody[mi], t, trk.melVol, E * 0.88);
      }

      nextRef.current += S;
      stepRef.current++;
    }

    timerRef.current = setTimeout(schedule, 350);
  }, []);

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;

    const ac = new AudioContext();
    ctxRef.current = ac;

    // Gentle delay reverb
    const delay   = ac.createDelay(1.0); delay.delayTime.value = 0.38;
    const fbGain  = ac.createGain();     fbGain.gain.value = 0.22;
    const dlpf    = ac.createBiquadFilter(); dlpf.type = "lowpass"; dlpf.frequency.value = 1800;
    delay.connect(dlpf); dlpf.connect(fbGain); fbGain.connect(delay);

    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 8;
    comp.ratio.value = 4; comp.attack.value = 0.008; comp.release.value = 0.25;
    comp.connect(ac.destination);

    const master = ac.createGain();
    master.gain.value = muted ? 0 : 0.48;
    masterRef.current = master;

    const dry = ac.createGain(); dry.gain.value = 0.72;
    const wet = ac.createGain(); wet.gain.value = 0.28;
    master.connect(dry); dry.connect(comp);
    master.connect(delay); delay.connect(wet); wet.connect(comp);

    nextRef.current = ac.currentTime + 0.05;
    schedule();
  }, [muted, schedule]);

  // Switch tracks: update ref, reset step, jump time to near-now
  const selectTrack = useCallback((id: TrackId) => {
    setTrackId(id);
    trackIdRef.current = id;
    stepRef.current = 0;
    if (ctxRef.current) {
      nextRef.current = ctxRef.current.currentTime + 0.08;
    }
  }, []);

  useEffect(() => {
    const go = () => {
      start();
      window.removeEventListener("keydown",     go);
      window.removeEventListener("pointerdown", go);
    };
    window.addEventListener("keydown",     go, { once: true });
    window.addEventListener("pointerdown", go, { once: true });
    return () => {
      window.removeEventListener("keydown",     go);
      window.removeEventListener("pointerdown", go);
    };
  }, [start]);

  useEffect(() => {
    const master = masterRef.current;
    const ac     = ctxRef.current;
    if (!master || !ac) return;
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.linearRampToValueAtTime(muted ? 0 : 0.48, ac.currentTime + 0.3);
  }, [muted]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    ctxRef.current?.close().catch(() => {});
  }, []);

  const toggle = useCallback(() => setMuted((m) => !m), []);

  return { muted, toggle, trackId, selectTrack };
}
