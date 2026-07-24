import { useCallback } from "react";

// ─── 432 Hz tuning ────────────────────────────────────────────
const TUNE = 432 / 440;
function hz(f: number) { return f * TUNE; }

// ─── Shared AudioContext for all SFX ─────────────────────────
// Avoids hitting browser limits (max ~6 simultaneous contexts)
let sfxAc: AudioContext | null = null;
function sfx(): AudioContext {
  if (!sfxAc || sfxAc.state === "closed") {
    sfxAc = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (sfxAc.state === "suspended") sfxAc.resume().catch(() => {});
  return sfxAc;
}

// ─── Pentatonic scale for slide notes (432 Hz, C major pentatonic) ───
// C D E G A — two octaves for variety
const SLIDE_NOTES = [
  hz(261.63), hz(293.66), hz(329.63), hz(392.00), hz(440.00),
  hz(523.25), hz(587.33), hz(659.25), hz(783.99), hz(880.00),
];
let slideIdx = 0;

// ─── Soft harp / marimba pluck on every tile move ────────────
export function playSlide() {
  try {
    const ac  = sfx();
    const now = ac.currentTime;

    // Pick next note from pentatonic scale
    const freq = SLIDE_NOTES[slideIdx % SLIDE_NOTES.length];
    slideIdx++;

    // Main tone: sine (warm body)
    const sine = ac.createOscillator();
    sine.type = "sine";
    sine.frequency.setValueAtTime(freq, now);
    // Tiny downward bend for a plucked-string feel
    sine.frequency.exponentialRampToValueAtTime(freq * 0.985, now + 0.22);

    // Overtone: triangle one octave up (gives a marimba-like shimmer)
    const over = ac.createOscillator();
    over.type = "triangle";
    over.frequency.value = freq * 2;

    const gMain = ac.createGain();
    gMain.gain.setValueAtTime(0, now);
    gMain.gain.linearRampToValueAtTime(0.10, now + 0.007);
    gMain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    const gOver = ac.createGain();
    gOver.gain.setValueAtTime(0, now);
    gOver.gain.linearRampToValueAtTime(0.030, now + 0.005);
    gOver.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    // Gentle low-pass so it never sounds harsh
    const lpf = ac.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = 3500;

    sine.connect(gMain); gMain.connect(lpf);
    over.connect(gOver); gOver.connect(lpf);
    lpf.connect(ac.destination);

    sine.start(now); sine.stop(now + 0.30);
    over.start(now); over.stop(now + 0.16);
  } catch (_) {}
}

// ─── Soundtrack Synthesizer (Dynamic Chords) ─────────────────
// Chords mapping for columns 0, 1, 2, 3:
// Column 0: C Major (C4, E4, G4, C5)
// Column 1: F Major (F4, A4, C5, F5)
// Column 2: G Major (G4, B4, D5, G5)
// Column 3: A Minor (A4, C5, E5, A5)
const CHORDS = [
  [261.63, 329.63, 392.00, 523.25].map(f => f * TUNE), // C Major
  [349.23, 440.00, 523.25, 698.46].map(f => f * TUNE), // F Major
  [392.00, 493.88, 587.33, 783.99].map(f => f * TUNE), // G Major
  [440.00, 523.25, 659.25, 880.00].map(f => f * TUNE)  // A Minor
];

export function playChord(columnIndex: number) {
  try {
    const ac = sfx();
    const now = ac.currentTime;
    const chord = CHORDS[columnIndex % CHORDS.length];

    const compressor = ac.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, now);
    compressor.knee.setValueAtTime(30, now);
    compressor.ratio.setValueAtTime(12, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.25, now);
    compressor.connect(ac.destination);

    chord.forEach((freq) => {
      const osc = ac.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;

      const g = ac.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.04, now + 0.15); // soft pad attack
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      const lpf = ac.createBiquadFilter();
      lpf.type = "lowpass";
      lpf.frequency.value = 1000;

      osc.connect(lpf);
      lpf.connect(g);
      g.connect(compressor);

      osc.start(now);
      osc.stop(now + 2.0);
    });
  } catch (_) {}
}

// ─── Bell chime on tile merge — pitch rises with tile value ──
// Notes mapped to C major scale: 2→C4, 4→D4, 8→E4, 16→G4 …
const MERGE_SCALE = [
  hz(261.63), hz(293.66), hz(329.63), hz(392.00),
  hz(440.00), hz(523.25), hz(587.33), hz(659.25), hz(783.99),
];

export function playMerge(value: number, columns?: number[]) {
  try {
    // Play synthesizer chord pads if columns are provided
    if (columns && columns.length > 0) {
      const uniqueCols = Array.from(new Set(columns));
      uniqueCols.forEach((col) => playChord(col));
    }

    const ac  = sfx();
    const now = ac.currentTime;

    const idx  = Math.min(Math.floor(Math.log2(value) - 1), MERGE_SCALE.length - 1);
    const freq = MERGE_SCALE[Math.max(0, idx)];

    // Stack of harmonic sine waves — pure bell, no noise
    const harmonics = [1, 2.005, 3.010];
    const vols      = [0.16, 0.07, 0.025];
    const durs      = [0.60, 0.38, 0.22];

    harmonics.forEach((mult, h) => {
      const osc = ac.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * mult;

      const g = ac.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vols[h], now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, now + durs[h]);

      osc.connect(g); g.connect(ac.destination);
      osc.start(now); osc.stop(now + durs[h] + 0.02);
    });
  } catch (_) {}
}

// ─── Triumphant ascending arpeggio on win ────────────────────
export function playWin() {
  try {
    const ac = sfx();
    [hz(523.25), hz(659.25), hz(783.99), hz(1046.5)].forEach((freq, i) => {
      const t = ac.currentTime + i * 0.11;
      [1, 2.005].forEach((mult, h) => {
        const osc = ac.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * mult;
        const g = ac.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(h === 0 ? 0.22 : 0.08, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
        osc.connect(g); g.connect(ac.destination);
        osc.start(t); osc.stop(t + 0.78);
      });
    });
  } catch (_) {}
}

// ─── "Fhaaa" fail horn on game over ──────────────────────────
// Sawtooth buzz + lowpass filter sweep + big pitch slide down
export function playGameOver() {
  try {
    const ac  = sfx();
    const now = ac.currentTime;

    // Two slightly detuned sawtooth oscillators → thick brass tone
    const osc1 = ac.createOscillator(); osc1.type = "sawtooth";
    const osc2 = ac.createOscillator(); osc2.type = "sawtooth";

    // Pitch envelope: starts at ~360 Hz, droops to ~62 Hz ("fhaaa")
    osc1.frequency.setValueAtTime(360, now);
    osc1.frequency.setValueAtTime(340, now + 0.06);
    osc1.frequency.exponentialRampToValueAtTime(62, now + 1.05);

    osc2.frequency.setValueAtTime(356, now);          // slight detune for width
    osc2.frequency.setValueAtTime(336, now + 0.06);
    osc2.frequency.exponentialRampToValueAtTime(60, now + 1.05);

    // Lowpass filter: opens wide then narrows as pitch falls (wah feel)
    const lpf = ac.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.setValueAtTime(200, now);
    lpf.frequency.linearRampToValueAtTime(2400, now + 0.08);
    lpf.frequency.exponentialRampToValueAtTime(180, now + 1.05);
    lpf.Q.value = 3.5;

    // Gain envelope: soft "fh" attack → full sustain → fade
    const g = ac.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.0, now + 0.01);   // tiny breath gap
    g.gain.linearRampToValueAtTime(0.30, now + 0.07);  // swell open
    g.gain.setValueAtTime(0.30, now + 0.55);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.10);

    osc1.connect(lpf); osc2.connect(lpf);
    lpf.connect(g);    g.connect(ac.destination);

    osc1.start(now); osc1.stop(now + 1.12);
    osc2.start(now); osc2.stop(now + 1.12);
  } catch (_) {}
}

export function useSounds() {
  const slide = useCallback(playSlide, []);
  const merge = useCallback((v: number, columns?: number[]) => playMerge(v, columns), []);
  const win   = useCallback(playWin, []);
  const over  = useCallback(playGameOver, []);
  return { slide, merge, win, over };
}
