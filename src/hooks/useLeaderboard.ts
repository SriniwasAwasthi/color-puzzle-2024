import { useState, useCallback } from "react";

export interface LeaderboardEntry {
  score: number;
  moves: number;
  highestTile: number;
  won: boolean;
  date: string;
}

const KEY = "puzzle2024_leaderboard";
const MAX = 5;

function load(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

function save(entries: LeaderboardEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {}
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(load);

  const addEntry = useCallback(
    (score: number, moves: number, highestTile: number, won: boolean) => {
      if (score === 0) return;
      const newEntry: LeaderboardEntry = {
        score,
        moves,
        highestTile,
        won,
        date: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
      setEntries((prev) => {
        const merged = [...prev, newEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX);
        save(merged);
        return merged;
      });
    },
    []
  );

  const clearAll = useCallback(() => {
    save([]);
    setEntries([]);
  }, []);

  return { entries, addEntry, clearAll };
}
