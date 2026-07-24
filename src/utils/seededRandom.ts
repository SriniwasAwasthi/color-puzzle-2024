/** mulberry32 — fast, good quality 32-bit PRNG */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** "YYYYMMDD" string for today in local time */
export function getDailyDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/** Numeric seed derived from today's date */
export function getDailySeed(): number {
  return parseInt(getDailyDateKey(), 10);
}

/** Returns a seeded RNG function for the given seed */
export function makeRng(seed: number): () => number {
  return mulberry32(seed);
}
