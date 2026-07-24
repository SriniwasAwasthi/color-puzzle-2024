import { useState, useCallback } from "react";
import { getDailyDateKey } from "../utils/seededRandom";

export interface DailyRecord {
  date: string;
  completed: boolean;
  won: boolean;
  score: number;
  moves: number;
  highestTile: number;
}

const KEY = "puzzle2024_daily";

function loadRecord(): DailyRecord | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw) as DailyRecord;
    return rec.date === getDailyDateKey() ? rec : null;
  } catch {
    return null;
  }
}

function saveRecord(rec: DailyRecord) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rec));
  } catch {}
}

export function useDailyChallenge() {
  const [record, setRecord] = useState<DailyRecord | null>(loadRecord);

  const isCompleted = record?.completed ?? false;

  const saveResult = useCallback(
    (score: number, moves: number, highestTile: number, won: boolean) => {
      const rec: DailyRecord = {
        date: getDailyDateKey(),
        completed: true,
        won,
        score,
        moves,
        highestTile,
      };
      saveRecord(rec);
      setRecord(rec);
    },
    []
  );

  return { record, isCompleted, saveResult };
}
