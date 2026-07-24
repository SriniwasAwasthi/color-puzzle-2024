import { useState, useCallback, useEffect } from "react";
import {
  Grid,
  Direction,
  initGame,
  initGameLevel,
  addRandomTile,
  clearAnimations,
  move,
  checkWin,
  checkGameOver,
  getHighestTile,
  applyMagnetPull
} from "../game/logic";

export type { Grid };

export type GameStatus = "playing" | "won" | "over" | "won-continue";

export type ScorePopup = {
  id: string;
  value: number;
  text?: string;
  x: number;
  y: number;
};

export type SoundCallbacks = {
  slide: () => void;
  merge: (value: number, columns?: number[]) => void;
  win: () => void;
  over: () => void;
};

const WIN_TARGET = 2024;
const STORAGE_KEY = "puzzle2024-best";
const COINS_KEY = "puzzle2024-coins";
const POWERUPS_KEY = "puzzle2024-powerups";

function getBest(): number {
  try { return parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10) || 0; }
  catch { return 0; }
}
function saveBest(score: number) {
  try { localStorage.setItem(STORAGE_KEY, String(score)); } catch {}
}

function getStoredCoins(): number {
  try { return parseInt(localStorage.getItem(COINS_KEY) ?? "200", 10) || 200; }
  catch { return 200; }
}

interface StoredPowerups {
  hammer: number;
  swapper: number;
  thaw: number;
}
function getStoredPowerups(): StoredPowerups {
  try {
    const raw = localStorage.getItem(POWERUPS_KEY);
    return raw ? JSON.parse(raw) : { hammer: 2, swapper: 2, thaw: 1 };
  } catch {
    return { hammer: 2, swapper: 2, thaw: 1 };
  }
}

const noopSounds: SoundCallbacks = {
  slide: () => {},
  merge: () => {},
  win: () => {},
  over: () => {},
};

const copyGrid = (g: Grid): Grid => g.map((row) => row.map((cell) => cell ? { ...cell } : null));

export function useGame(
  sounds: SoundCallbacks = noopSounds,
  size: number = 4,
  obstacleCount: number = 0,
  levelConfig?: {
    targetTile: number;
    targetScore: number;
    movesLimit?: number;
    frozenTilesCount?: number;
    magnetTilesCount?: number;
    doubleScoreTilesCount?: number;
    rewardCoins: number;
  }
) {
  const getInitialGrid = () => {
    if (levelConfig) {
      return initGameLevel(
        size,
        obstacleCount,
        levelConfig.frozenTilesCount ?? 0,
        levelConfig.magnetTilesCount ?? 0,
        levelConfig.doubleScoreTilesCount ?? 0
      );
    }
    return initGame(size, obstacleCount);
  };

  const [grid, setGrid]               = useState<Grid>(getInitialGrid);
  const [score, setScore]             = useState(0);
  const [best, setBest]               = useState(getBest);
  const [status, setStatus]           = useState<GameStatus>("playing");
  const [shaking, setShaking]         = useState(false);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [moveCount, setMoveCount]     = useState(0);
  const [history, setHistory]         = useState<{ grid: Grid; score: number }[]>([]);
  
  // RPG / Special State
  const [coins, setCoins]                         = useState(getStoredCoins);
  const [powerups, setPowerups]                   = useState<StoredPowerups>(getStoredPowerups);
  const [doubleScoreTurns, setDoubleScoreTurns]   = useState(0);
  const [movesRemaining, setMovesRemaining]       = useState<number | null>(null);

  const highestTile = getHighestTile(grid);
  const winTarget = levelConfig ? levelConfig.targetTile : WIN_TARGET;

  const resetGame = useCallback((gridOverride?: Grid) => {
    setGrid(gridOverride ?? getInitialGrid());
    setScore(0);
    setStatus("playing");
    setShaking(false);
    setScorePopups([]);
    setMoveCount(0);
    setHistory([]);
    setDoubleScoreTurns(0);
    setMovesRemaining(levelConfig?.movesLimit ?? null);
  }, [size, obstacleCount, levelConfig]);

  // Restart when config changes
  useEffect(() => {
    resetGame();
  }, [size, obstacleCount, levelConfig, resetGame]);

  // Save RPG items to storage
  useEffect(() => {
    localStorage.setItem(COINS_KEY, String(coins));
  }, [coins]);

  useEffect(() => {
    localStorage.setItem(POWERUPS_KEY, JSON.stringify(powerups));
  }, [powerups]);

  const continueGame = useCallback(() => setStatus("won-continue"), []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prevStates = [...h];
      const prevState = prevStates.pop();
      if (prevState) {
        setGrid(prevState.grid);
        setScore(prevState.score);
        setMoveCount((m) => Math.max(0, m - 1));
        if (movesRemaining !== null) {
          setMovesRemaining((m) => (m !== null ? m + 1 : null));
        }
        setStatus("playing");
      }
      return prevStates;
    });
  }, [movesRemaining]);

  const handleMove = useCallback(
    (direction: Direction) => {
      if (status === "over" || status === "won") return;

      setGrid((prev) => {
        const cleaned = clearAnimations(prev);
        const { grid: newGrid, score: gained, moved, mergedCount, doubleMerged } = move(cleaned, direction);

        if (!moved) {
          setShaking(true);
          setTimeout(() => setShaking(false), 350);
          return prev;
        }

        // Save history before moving
        setHistory((h) => [...h, { grid: copyGrid(prev), score: score }].slice(-10));

        sounds.slide();

        // Check if double score tile was merged
        if (doubleMerged) {
          setDoubleScoreTurns(5);
        }

        // Apply Double Score active multiplier
        const isDoubleActive = doubleScoreTurns > 0;
        const comboMultiplier = mergedCount > 1 ? mergedCount : 1;
        const finalGained = gained * comboMultiplier * (isDoubleActive ? 2 : 1);

        // Apply magnet pull post-move
        let processedGrid = applyMagnetPull(newGrid).grid;

        // Spawn a new tile
        const withNewTile = addRandomTile(processedGrid);

        // Merge sounds + popups
        if (gained > 0) {
          const mergedValues = newGrid.flat()
            .filter((c) => c?.isMerged)
            .map((c) => c!.value);
          const highestMerge = mergedValues.length > 0
            ? Math.max(...mergedValues)
            : gained;

          const mergedColumns: number[] = [];
          for (let r = 0; r < newGrid.length; r++) {
            for (let c = 0; c < newGrid[r].length; c++) {
              if (newGrid[r][c]?.isMerged) {
                mergedColumns.push(c);
              }
            }
          }
          sounds.merge(highestMerge, mergedColumns);

          const popId = `pop-${Date.now()}-${Math.random()}`;
          let popText = `+${finalGained}`;
          if (mergedCount > 1 && isDoubleActive) {
            popText = `+${finalGained} (x${mergedCount} Combo x2!)`;
          } else if (mergedCount > 1) {
            popText = `+${finalGained} (x${mergedCount} Combo!)`;
          } else if (isDoubleActive) {
            popText = `+${finalGained} (Double!)`;
          }

          setScorePopups((pops) => [
            ...pops.slice(-4),
            {
              id: popId,
              value: finalGained,
              text: popText,
              x: Math.random() * 55 + 20,
              y: Math.random() * 35 + 10,
            },
          ]);
          setTimeout(() => {
            setScorePopups((pops) => pops.filter((p) => p.id !== popId));
          }, 950);
        }

        setScore((s) => {
          const next = s + finalGained;
          if (next > getBest()) { setBest(next); saveBest(next); }
          return next;
        });

        setMoveCount((m) => m + 1);

        if (doubleScoreTurns > 0) {
          setDoubleScoreTurns((t) => Math.max(0, t - 1));
        }

        let isWon = false;
        let isOver = false;

        // Moves constraint
        let currentMovesRemaining = movesRemaining;
        if (movesRemaining !== null) {
          currentMovesRemaining = movesRemaining - 1;
          setMovesRemaining(currentMovesRemaining);
        }

        // Win check
        if (levelConfig) {
          if (highestTile >= levelConfig.targetTile || (score + finalGained) >= levelConfig.targetScore) {
            isWon = true;
          }
        } else {
          if (status !== "won-continue" && checkWin(withNewTile, WIN_TARGET)) {
            isWon = true;
          }
        }

        // Game Over check
        if (isWon) {
          setStatus("won");
          sounds.win();
          // Level reward coins
          if (levelConfig) {
            setCoins((c) => c + levelConfig.rewardCoins);
          }
        } else if (currentMovesRemaining !== null && currentMovesRemaining <= 0) {
          isOver = true;
        } else if (checkGameOver(withNewTile)) {
          isOver = true;
        }

        if (isOver) {
          setStatus("over");
          sounds.over();
        }

        return withNewTile;
      });
    },
    [status, sounds, score, doubleScoreTurns, movesRemaining, levelConfig, winTarget]
  );

  const spawnTile = useCallback(() => {
    setGrid((prev) => {
      const withNew = addRandomTile(prev);
      if (checkGameOver(withNew)) {
        setStatus("over");
        sounds.over();
      }
      return withNew;
    });
  }, [sounds]);

  // ── RPG Shop Actions ───────────────────────────────────────
  const buyPowerup = useCallback((type: "hammer" | "swapper" | "thaw", price: number) => {
    if (coins < price) return false;
    setCoins((c) => c - price);
    setPowerups((p) => ({ ...p, [type]: p[type] + 1 }));
    return true;
  }, [coins]);

  const useHammer = useCallback((r: number, c: number) => {
    if (powerups.hammer <= 0) return;
    setGrid((prev) => {
      if (prev[r][c] && !prev[r][c]?.isObstacle) {
        const next = prev.map(row => [...row]) as Grid;
        next[r][c] = null;
        setPowerups(p => ({ ...p, hammer: p.hammer - 1 }));
        return next;
      }
      return prev;
    });
  }, [powerups.hammer]);

  const useSwapper = useCallback((r1: number, c1: number, r2: number, c2: number) => {
    if (powerups.swapper <= 0) return;
    setGrid((prev) => {
      const next = prev.map(row => [...row]) as Grid;
      const temp = next[r1][c1];
      next[r1][c1] = next[r2][c2];
      next[r2][c2] = temp;
      setPowerups(p => ({ ...p, swapper: p.swapper - 1 }));
      return next;
    });
  }, [powerups.swapper]);

  const useThaw = useCallback(() => {
    if (powerups.thaw <= 0) return;
    setGrid((prev) => {
      const next = prev.map(row => row.map(cell => cell && cell.isFrozen ? { ...cell, isFrozen: false } : cell)) as Grid;
      setPowerups(p => ({ ...p, thaw: p.thaw - 1 }));
      return next;
    });
  }, [powerups.thaw]);

  const addCoins = useCallback((amount: number) => {
    setCoins(c => c + amount);
  }, []);

  return {
    grid,
    score,
    best,
    status,
    shaking,
    scorePopups,
    moveCount,
    highestTile,
    historyLength: history.length,
    coins,
    powerups,
    doubleScoreTurns,
    movesRemaining,
    handleMove,
    resetGame,
    continueGame,
    undo,
    spawnTile,
    buyPowerup,
    useHammer,
    useSwapper,
    useThaw,
    addCoins,
    WIN_TARGET: winTarget,
  };
}
