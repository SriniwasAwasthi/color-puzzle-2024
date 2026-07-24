import { useState, useEffect, useCallback } from "react";
import { getDailyDateKey } from "../utils/seededRandom";

export interface Quest {
  id: string;
  text: string;
  type: "score" | "moves" | "tile" | "merges";
  target: number;
  current: number;
  reward: number;
  completed: boolean;
  claimed: boolean;
}

const QUESTS_LIST: Omit<Quest, "current" | "completed" | "claimed">[] = [
  { id: "quest-1", text: "Reach a score of 1,500 in Free Play", type: "score", target: 1500, reward: 120 },
  { id: "quest-2", text: "Make 80 moves in a single game", type: "moves", target: 80, reward: 100 },
  { id: "quest-3", text: "Reach the 256 tile", type: "tile", target: 256, reward: 150 },
  { id: "quest-4", text: "Reach a score of 3,000 in Free Play", type: "score", target: 3000, reward: 200 },
  { id: "quest-5", text: "Make 150 moves in a single game", type: "moves", target: 150, reward: 180 }
];

const STORAGE_KEY = "puzzle2024-daily-quest";

export function useQuests(
  score: number,
  moves: number,
  highestTile: number,
  addCoins: (amount: number) => void
) {
  const [quest, setQuest] = useState<Quest | null>(null);

  // Initialize today's quest based on date key
  useEffect(() => {
    try {
      const dateKey = getDailyDateKey();
      const stored = localStorage.getItem(STORAGE_KEY);
      let parsed = stored ? JSON.parse(stored) : null;

      // If no stored quest, or it's from a previous day, generate a new one
      if (!parsed || parsed.dateKey !== dateKey) {
        const hash = dateKey.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const questTemplate = QUESTS_LIST[hash % QUESTS_LIST.length];
        
        parsed = {
          ...questTemplate,
          current: 0,
          completed: false,
          claimed: false,
          dateKey
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }

      setQuest(parsed);
    } catch {
      // Fallback in case of storage failure
      setQuest({
        id: "quest-1",
        text: "Reach a score of 1,500 in Free Play",
        type: "score",
        target: 1500,
        current: 0,
        reward: 120,
        completed: false,
        claimed: false
      });
    }
  }, []);

  // Sync game progress with quest
  useEffect(() => {
    if (!quest || quest.claimed) return;

    let updatedVal = quest.current;
    if (quest.type === "score") {
      updatedVal = Math.max(quest.current, score);
    } else if (quest.type === "moves") {
      updatedVal = Math.max(quest.current, moves);
    } else if (quest.type === "tile") {
      updatedVal = Math.max(quest.current, highestTile);
    }

    const isCompleted = updatedVal >= quest.target;

    if (updatedVal !== quest.current || isCompleted !== quest.completed) {
      setQuest((prev) => {
        if (!prev) return null;
        const next = {
          ...prev,
          current: updatedVal,
          completed: isCompleted
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, dateKey: getDailyDateKey() }));
        return next;
      });
    }
  }, [score, moves, highestTile, quest]);

  const claimReward = useCallback(() => {
    if (!quest || !quest.completed || quest.claimed) return;
    addCoins(quest.reward);
    setQuest((prev) => {
      if (!prev) return null;
      const next = { ...prev, claimed: true };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, dateKey: getDailyDateKey() }));
      return next;
    });
  }, [quest, addCoins]);

  return {
    quest,
    claimReward
  };
}
