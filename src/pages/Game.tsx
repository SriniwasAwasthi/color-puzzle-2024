import { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { useGame, SoundCallbacks } from "../hooks/useGame";
import { useKeyboard } from "../hooks/useSwipe";
import { useMusic, TRACKS, TrackId } from "../hooks/useMusic";
import { useSounds } from "../hooks/useSounds";
import { useTheme } from "../context/ThemeContext";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { useDailyChallenge } from "../hooks/useDailyChallenge";
import { Board } from "../components/Board";
import { ScoreCard } from "../components/ScoreCard";
import { GameOverlay } from "../components/GameOverlay";
import { HowToPlay } from "../components/HowToPlay";
import { Leaderboard } from "../components/Leaderboard";
import { Confetti } from "../components/Confetti";
import { initGameSeeded } from "../game/logic";
import { makeRng, getDailySeed, getDailyDateKey } from "../utils/seededRandom";
import { Direction } from "../game/logic";
import { CampaignMap } from "../components/CampaignMap";
import { ShopPanel } from "../components/ShopPanel";
import { useQuests } from "../hooks/useQuests";
import { CAMPAIGN_LEVELS } from "../game/levels";
import { fetchUserData, syncUserData } from "../lib/database";

const AMBIENT_COLOR = "#8b7fd4";
type Mode = "free" | "daily" | "campaign";

export function Game() {
  const { isDark, toggle: toggleTheme } = useTheme();
  const [showMusicMenu,   setShowMusicMenu]   = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [mode,            setMode]            = useState<Mode>("free");
  const [gridSize,        setGridSize]        = useState(4);
  const [obstacleCount,   setObstacleCount]   = useState(0);
  const [gameMode,        setGameMode]        = useState<"classic" | "time-attack">("classic");
  const menuRef = useRef<HTMLDivElement>(null);

  // Campaign & RPG custom states
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [showMap,         setShowMap]         = useState(false);
  const [showShop,        setShowShop]        = useState(false);
  const [activePowerUp,   setActivePowerUp]   = useState<"hammer" | "swapper" | null>(null);
  const [firstSelectedCell, setFirstSelectedCell] = useState<{ r: number; c: number } | null>(null);

  // ── Seeded daily grid — stable for the whole day ──────────
  const dailyGrid = useMemo(() => initGameSeeded(makeRng(getDailySeed())), []);

  // ── All hooks ─────────────────────────────────────────────

  // 1. Sound effects
  const { slide, merge, win, over } = useSounds();
  const onSlide = useCallback(() => slide(), [slide]);
  const onMerge = useCallback(
    (v: number) => {
      merge(v);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([15, 30, 15]);
      }
    },
    [merge]
  );
  const onWin   = useCallback(() => win(), [win]);
  const onOver  = useCallback(() => over(), [over]);

  // 2. Game logic
  const selectedLevel = useMemo(() => {
    if (mode !== "campaign" || selectedLevelId === null) return undefined;
    return CAMPAIGN_LEVELS.find((l) => l.id === selectedLevelId);
  }, [mode, selectedLevelId]);

  const sounds: SoundCallbacks = { slide: onSlide, merge: onMerge, win: onWin, over: onOver };
  const {
    grid, score, best, status, shaking,
    scorePopups, moveCount, highestTile, historyLength,
    handleMove, resetGame, continueGame, undo, spawnTile, WIN_TARGET,
    coins, powerups, doubleScoreTurns, movesRemaining,
    buyPowerup, useHammer, useSwapper, useThaw, addCoins,
  } = useGame(
    sounds,
    mode === "daily" ? 4 : (selectedLevel ? selectedLevel.gridSize : gridSize),
    mode === "daily" ? 0 : (selectedLevel ? selectedLevel.obstacleCount : obstacleCount),
    selectedLevel
  );

  // Daily Quests
  const { quest, claimReward } = useQuests(score, moveCount, highestTile, addCoins);

  // 3. Music
  const { muted, toggle: toggleMusic, trackId, selectTrack } = useMusic({ score, best, moveCount });

  // 4. Leaderboard
  const { entries, addEntry, clearAll } = useLeaderboard();

  // 5. Daily challenge
  const { record: dailyRecord, isCompleted: dailyDone, saveResult: saveDailyResult } = useDailyChallenge();

  // 6. Controls
  const isActive = (status === "playing" || status === "won-continue") && !activePowerUp;
  const onMove   = useCallback((dir: Direction) => handleMove(dir), [handleMove]);
  useKeyboard(onMove, isActive);

  // Load completed levels on mount
  useEffect(() => {
    fetchUserData().then((data) => {
      setCompletedLevels(data.completedLevels || []);
    });
  }, []);

  // Sync user progress (best, coins, levels)
  useEffect(() => {
    if (coins > 0) {
      syncUserData({
        highScore: best,
        coins,
        completedLevels
      });
    }
  }, [coins, completedLevels, best]);

  // Campaign win state hook
  useEffect(() => {
    if (status === "won" && mode === "campaign" && selectedLevelId) {
      if (!completedLevels.includes(selectedLevelId)) {
        setCompletedLevels((prev) => [...prev, selectedLevelId]);
      }
    }
  }, [status, mode, selectedLevelId, completedLevels]);

  const handleSelectLevel = useCallback((levelId: number) => {
    setMode("campaign");
    setSelectedLevelId(levelId);
    setShowMap(false);
  }, []);

  // 7. Keyboard Undo Shortcut (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    const handleUndoKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", handleUndoKey);
    return () => window.removeEventListener("keydown", handleUndoKey);
  }, [undo]);

  // ── Auto-save leaderboard on game end ─────────────────────
  const savedRef = useRef(false);
  useEffect(() => {
    if ((status === "over" || status === "won") && !savedRef.current && score > 0) {
      savedRef.current = true;
      addEntry(score, moveCount, highestTile, status === "won");
      if (mode === "daily" && !dailyDone) {
        saveDailyResult(score, moveCount, highestTile, status === "won");
      }
    }
    if (status === "playing") savedRef.current = false;
  }, [status, score, moveCount, highestTile, addEntry, mode, dailyDone, saveDailyResult]);

  // ── Daily mode toggle ─────────────────────────────────────
  const handleDailyToggle = useCallback(() => {
    if (mode === "daily") {
      setMode("free");
      resetGame();
    } else {
      setMode("daily");
      if (!dailyDone) {
        resetGame(dailyGrid);
      }
    }
  }, [mode, dailyDone, dailyGrid, resetGame]);

  // Close music menu on outside click
  useEffect(() => {
    if (!showMusicMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMusicMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMusicMenu]);

  // ── Time Attack timer ─────────────────────────────────────
  const [timeAttackProgress, setTimeAttackProgress] = useState(0);
  useEffect(() => {
    if (mode !== "free" || gameMode !== "time-attack" || status !== "playing") {
      setTimeAttackProgress(0);
      return;
    }

    const intervalTime = 100;
    const totalDuration = 6000; // 6 seconds per tile drop
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += intervalTime;
      setTimeAttackProgress((elapsed / totalDuration) * 100);

      if (elapsed >= totalDuration) {
        elapsed = 0;
        spawnTile();
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [mode, gameMode, status, spawnTile]);

  // ── Power-Up Click Handler ──────────────────────────────────
  const handleCellClick = useCallback((r: number, c: number) => {
    if (!activePowerUp) return;

    if (activePowerUp === "hammer") {
      if (powerups.hammer > 0) {
        useHammer(r, c);
        setActivePowerUp(null);
      }
    } else if (activePowerUp === "swapper") {
      if (powerups.swapper > 0) {
        if (firstSelectedCell === null) {
          setFirstSelectedCell({ r, c });
        } else {
          if (firstSelectedCell.r !== r || firstSelectedCell.c !== c) {
            useSwapper(firstSelectedCell.r, firstSelectedCell.c, r, c);
          }
          setFirstSelectedCell(null);
          setActivePowerUp(null);
        }
      }
    }
  }, [activePowerUp, powerups.hammer, powerups.swapper, firstSelectedCell, useHammer, useSwapper]);

  const togglePowerUp = useCallback((type: "hammer" | "swapper") => {
    setActivePowerUp((current) => {
      if (current === type) {
        setFirstSelectedCell(null);
        return null;
      }
      setFirstSelectedCell(null);
      return type;
    });
  }, []);

  const currentTrack = TRACKS[trackId];
  const isDaily      = mode === "daily";

  // ── Theme shorthands ──────────────────────────────────────
  const textMuted    = isDark ? "#6b6490" : "#b0a8d0";
  const textAccent   = isDark ? "#c4bcff" : "#4a3fa0";
  const bannerBg     = isDark ? "rgba(26,25,48,0.92)" : "rgba(255,255,255,0.85)";
  const bannerBorder = isDark ? "rgba(80,74,150,0.35)" : "rgba(200,195,230,0.7)";
  const menuBg       = isDark ? "#1a1930" : "#ffffff";
  const menuBorder   = isDark ? "rgba(100,90,180,0.3)" : "rgba(200,195,230,0.8)";
  const pageBg       = isDark
    ? "radial-gradient(ellipse at 15% 0%, #1e1a3a 0%, transparent 45%), " +
      "radial-gradient(ellipse at 85% 5%, #2a1535 0%, transparent 40%), " +
      "radial-gradient(ellipse at 50% 100%, #121226 0%, transparent 50%), " +
      "#0d0c1a"
    : "radial-gradient(ellipse at 15% 0%,  #ede9fe 0%, transparent 45%), " +
      "radial-gradient(ellipse at 85% 5%,  #fce7f3 0%, transparent 40%), " +
      "radial-gradient(ellipse at 50% 100%, #e0f2fe 0%, transparent 50%), " +
      "#fafafa";

  // ── Render ────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start px-4 pt-6 pb-12"
      style={{ background: pageBg }}
    >
      {/* Score popups */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {scorePopups.map((p) => (
          <div
            key={p.id}
            className="score-popup absolute font-black text-lg text-center"
            style={{ left: `${p.x}%`, top: `${p.y}%`, color: "#f59e0b",
              textShadow: "0 1px 8px rgba(245,158,11,0.5)" }}
          >
            {p.text ?? `+${p.value.toLocaleString()}`}
          </div>
        ))}
      </div>

      {/* Win confetti */}
      <Confetti active={status === "won"} />

      {/* Leaderboard modal */}
      {showLeaderboard && (
        <Leaderboard
          entries={entries}
          onClose={() => setShowLeaderboard(false)}
          onClear={clearAll}
        />
      )}

      {/* Campaign Map modal */}
      {showMap && (
        <CampaignMap
          completedLevels={completedLevels}
          onSelectLevel={handleSelectLevel}
          onClose={() => setShowMap(false)}
        />
      )}

      {/* Shop modal */}
      {showShop && (
        <ShopPanel
          coins={coins}
          powerups={powerups}
          buyPowerup={buyPowerup}
          onClose={() => setShowShop(false)}
        />
      )}

      {/* Header */}
      <div className="w-full max-w-md mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="text-4xl sm:text-5xl font-black leading-none tracking-tight"
              style={{
                background: "linear-gradient(135deg, #6C63FF 0%, #EC4899 55%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              2024
            </h1>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: textMuted }}>
              Number Puzzle
            </p>
          </div>
          <div className="flex gap-2">
            <ScoreCard label="Score" value={score} />
            <ScoreCard label="Best"  value={best}  accent="#f59e0b" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 relative flex-wrap">

            {/* Mode Specific Buttons */}
            {mode === "campaign" ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMap(true)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    boxShadow: "0 2px 10px rgba(16,185,129,0.28)"
                  }}
                >
                  🗺️ Map
                </button>
                <button
                  onClick={() => { setMode("free"); resetGame(); }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: isDark ? "rgba(100,90,180,0.22)" : "rgba(108,99,255,0.12)",
                    color: isDark ? "#c4bcff" : "#4a3fa0",
                    border: `1px solid ${isDark ? "rgba(108,99,255,0.4)" : "rgba(108,99,255,0.28)"}`
                  }}
                >
                  Exit Lvl
                </button>
                <button
                  disabled={historyLength === 0}
                  onClick={undo}
                  title="Undo last move"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:active:scale-100"
                  style={{
                    background: isDark ? "rgba(108,99,255,0.18)" : "rgba(108,99,255,0.08)",
                    color: isDark ? "#c4bcff" : "#4a3fa0",
                    border: `1px solid ${isDark ? "rgba(108,99,255,0.3)" : "rgba(108,99,255,0.2)"}`
                  }}
                >
                  ⟲ Undo
                </button>
              </div>
            ) : mode === "daily" ? (
              <button
                onClick={() => { setMode("free"); resetGame(); }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: isDark ? "rgba(100,90,180,0.22)" : "rgba(108,99,255,0.12)",
                  color: isDark ? "#c4bcff" : "#4a3fa0",
                  border: `1px solid ${isDark ? "rgba(108,99,255,0.4)" : "rgba(108,99,255,0.28)"}`
                }}
              >
                ← Free Play
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => resetGame()}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #6C63FF, #9b59b6)",
                    color: "#fff",
                    boxShadow: "0 2px 10px rgba(108,99,255,0.28)"
                  }}
                >
                  New Game
                </button>
                <button
                  disabled={historyLength === 0}
                  onClick={undo}
                  title="Undo last move"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:active:scale-100"
                  style={{
                    background: isDark ? "rgba(108,99,255,0.18)" : "rgba(108,99,255,0.08)",
                    color: isDark ? "#c4bcff" : "#4a3fa0",
                    border: `1px solid ${isDark ? "rgba(108,99,255,0.3)" : "rgba(108,99,255,0.2)"}`
                  }}
                >
                  ⟲ Undo
                </button>
              </div>
            )}

            {/* Daily challenge button */}
            <button
              onClick={handleDailyToggle}
              title={isDaily ? "Exit daily challenge" : "Play today's daily challenge"}
              className="h-8 px-2.5 rounded-xl flex items-center gap-1 text-[11px] font-bold
                         transition-all hover:scale-105 active:scale-95"
              style={{
                background: isDaily
                  ? "linear-gradient(135deg,#ffd700,#f59e0b)"
                  : isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.12)",
                border: `1px solid ${isDaily
                  ? "#f59e0b"
                  : isDark ? "rgba(245,158,11,0.35)" : "rgba(245,158,11,0.3)"}`,
                color: isDaily ? "#1a1200" : isDark ? "#ffd700" : "#b45309",
                boxShadow: isDaily ? "0 2px 10px rgba(245,158,11,0.35)" : "none",
              }}
            >
              <span>📅</span>
              <span className="hidden sm:inline">Daily</span>
              {dailyDone && <span className="text-[9px]">{dailyRecord?.won ? "✓" : "✗"}</span>}
            </button>

            {/* Leaderboard trophy */}
            <button
              onClick={() => setShowLeaderboard(true)}
              title="Leaderboard"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm
                         transition-all hover:scale-110 active:scale-90"
              style={{
                background: isDark ? "rgba(245,158,11,0.18)" : "rgba(245,158,11,0.12)",
                border: `1px solid ${isDark ? "rgba(245,158,11,0.35)" : "rgba(245,158,11,0.3)"}`,
              }}
            >
              🏆
            </button>

            {/* Mute toggle */}
            <button
              onClick={toggleMusic}
              title={muted ? "Unmute music" : "Mute music"}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm
                         transition-all hover:scale-110 active:scale-90"
              style={{
                background: muted
                  ? isDark ? "rgba(80,75,130,0.25)" : "rgba(200,195,225,0.3)"
                  : isDark ? "rgba(108,99,255,0.2)"  : "rgba(108,99,255,0.12)",
                border: `1px solid ${muted
                  ? isDark ? "rgba(100,95,160,0.35)" : "rgba(180,175,210,0.4)"
                  : isDark ? "rgba(108,99,255,0.4)"  : "rgba(108,99,255,0.3)"}`,
                color: muted ? textMuted : "#6C63FF",
              }}
            >
              {muted ? "🔇" : "🔊"}
            </button>

            {/* Music track picker */}
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setShowMusicMenu((v) => !v)}
                title="Choose music track"
                className="h-8 px-2.5 rounded-xl flex items-center gap-1.5 text-sm font-semibold
                           transition-all hover:scale-105 active:scale-95"
                style={{
                  background: showMusicMenu
                    ? isDark ? "rgba(108,99,255,0.3)" : "rgba(108,99,255,0.18)"
                    : isDark ? "rgba(108,99,255,0.15)" : "rgba(108,99,255,0.08)",
                  border: `1px solid ${isDark ? "rgba(108,99,255,0.4)" : "rgba(108,99,255,0.28)"}`,
                  color: isDark ? "#c4bcff" : "#6C63FF",
                }}
              >
                <span>{currentTrack.emoji}</span>
                <span className="text-[11px] hidden sm:inline">{currentTrack.name}</span>
                <span className="text-[10px] opacity-60">{showMusicMenu ? "▲" : "▼"}</span>
              </button>

              {/* Track dropdown */}
              {showMusicMenu && (
                <div
                  className="absolute left-0 top-10 z-40 rounded-2xl overflow-hidden"
                  style={{
                    background: menuBg,
                    border: `1px solid ${menuBorder}`,
                    boxShadow: isDark
                      ? "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)"
                      : "0 8px 32px rgba(100,80,200,0.18), 0 2px 8px rgba(0,0,0,0.06)",
                    minWidth: 200,
                  }}
                >
                  <div className="px-3 pt-2.5 pb-1">
                    <span
                      className="text-[10px] font-extrabold uppercase tracking-widest"
                      style={{ color: isDark ? "#6b6490" : "#b0a8d0" }}
                    >
                      Choose a Track
                    </span>
                  </div>
                  {TRACKS.map((track) => {
                    const isCurrent = track.id === trackId;
                    return (
                      <button
                        key={track.id}
                        onClick={() => { selectTrack(track.id as TrackId); setShowMusicMenu(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left"
                        style={{
                          background: isCurrent
                            ? isDark ? "rgba(108,99,255,0.2)" : "rgba(108,99,255,0.1)"
                            : "transparent",
                          borderLeft: isCurrent ? "3px solid #6C63FF" : "3px solid transparent",
                        }}
                      >
                        <span className="text-xl leading-none">{track.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold"
                            style={{ color: isCurrent
                              ? isDark ? "#c4bcff" : "#4a3fa0"
                              : isDark ? "#a09ab8" : "#6b6490" }}>
                            {track.name}
                          </div>
                          <div className="text-[10px]"
                            style={{ color: isDark ? "#504c6a" : "#c4bce0" }}>
                            {track.desc} · {track.bpm} BPM
                          </div>
                        </div>
                        {isCurrent && <span style={{ color: "#6C63FF", fontSize: 12 }}>♪</span>}
                      </button>
                    );
                  })}
                  <div className="h-2" />
                </div>
              )}
            </div>

            {/* Dark / Light mode toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm
                         transition-all hover:scale-110 active:scale-90"
              style={{
                background: isDark ? "rgba(255,220,80,0.15)" : "rgba(30,28,60,0.08)",
                border: `1px solid ${isDark ? "rgba(255,220,80,0.3)" : "rgba(80,70,140,0.2)"}`,
                color: isDark ? "#ffd700" : "#4a3fa0",
              }}
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
          <HowToPlay />
        </div>
      </div>

      {/* RPG Sub-header */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xl">🪙</span>
          <span className="text-sm font-black text-amber-500">{coins.toLocaleString()}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowShop(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
            style={{
              background: isDark ? "rgba(108,99,255,0.18)" : "rgba(108,99,255,0.08)",
              color: isDark ? "#c4bcff" : "#4a3fa0",
              border: `1px solid ${isDark ? "rgba(108,99,255,0.3)" : "rgba(108,99,255,0.2)"}`
            }}
          >
            🛒 Shop
          </button>
          <button
            onClick={() => setShowMap(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
            style={{
              background: isDark ? "rgba(236,72,153,0.18)" : "rgba(236,72,153,0.08)",
              color: isDark ? "#f9a8d4" : "#be185d",
              border: `1px solid ${isDark ? "rgba(236,72,153,0.3)" : "rgba(236,72,153,0.2)"}`
            }}
          >
            🗺️ Campaign
          </button>
        </div>
      </div>

      {/* Daily challenge banner */}
      {isDaily && (
        <div
          className="w-full max-w-md mb-3 px-4 py-2.5 rounded-2xl flex items-center gap-3"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(255,107,107,0.08))"
              : "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(255,215,0,0.08))",
            border: `1px solid ${isDark ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.35)"}`,
          }}
        >
          <span className="text-xl">📅</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black" style={{ color: isDark ? "#ffd700" : "#b45309" }}>
              Daily Challenge
            </div>
            <div className="text-[10px]" style={{ color: textMuted }}>
              {getDailyDateKey().replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")}
              {dailyDone
                ? dailyRecord?.won
                  ? " · 🌟 Completed — You won!"
                  : ` · Completed — Score ${dailyRecord?.score.toLocaleString()}`
                : " · Same board for everyone today"}
            </div>
          </div>
        </div>
      )}

      {/* Info / Campaign banner */}
      <div
        className="w-full max-w-md mb-4 px-4 py-2.5 rounded-2xl flex items-center gap-3 shrink-0"
        style={{
          background: bannerBg,
          border: `1px solid ${bannerBorder}`,
          boxShadow: isDark
            ? "0 2px 10px rgba(0,0,0,0.3)"
            : "0 2px 10px rgba(120,100,200,0.08)",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[11px] text-white shrink-0"
          style={{
            background: mode === "campaign"
              ? "linear-gradient(135deg, #10b981, #3b82f6)"
              : "linear-gradient(135deg, #ffd700, #ff6b6b, #9b59b6)",
            boxShadow: mode === "campaign"
              ? "0 3px 10px rgba(16,185,129,0.35)"
              : "0 3px 10px rgba(200,100,255,0.35)"
          }}
        >
          {mode === "campaign" ? `Lvl ${selectedLevelId}` : WIN_TARGET}
        </div>

        <div className="flex-1 min-w-0">
          {mode === "campaign" && selectedLevel ? (
            <>
              <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: textAccent }}>
                {selectedLevel.name}
              </div>
              <div className="text-[10px] mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: textMuted }}>
                <span>Target: <strong className="text-amber-500">{selectedLevel.targetTile}</strong> tile or <strong className="text-amber-500">{selectedLevel.targetScore.toLocaleString()}</strong> score</span>
                {movesRemaining !== null && (
                  <>
                    <span>·</span>
                    <span style={{ color: movesRemaining < 10 ? "#ef4444" : textAccent, fontWeight: 700 }}>
                      {movesRemaining} moves left
                    </span>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: textAccent }}>
                Reach <span style={{ color: "#f59e0b" }}>{WIN_TARGET}</span> to win!
              </div>
              <div className="text-[10px] mt-0.5 flex items-center gap-1.5" style={{ color: textMuted }}>
                <span>{moveCount} moves</span>
                <span>·</span>
                {muted ? (
                  <span>Music muted</span>
                ) : (
                  <span style={{ color: AMBIENT_COLOR, fontWeight: 600 }}>
                    {currentTrack.emoji} {currentTrack.name}
                  </span>
                )}
                {entries.length > 0 && (
                  <>
                    <span>·</span>
                    <button
                      onClick={() => setShowLeaderboard(true)}
                      className="font-semibold hover:underline underline-offset-2 transition-all"
                      style={{ color: "#f59e0b" }}
                    >
                      #{entries.findIndex(e => e.score === best) + 1 || "—"} best
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {doubleScoreTurns > 0 && (
          <div className="text-xs font-black text-amber-500 animate-pulse bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30 shrink-0">
            ✨ 2x ({doubleScoreTurns}t)
          </div>
        )}

        {mode !== "campaign" && !muted && (
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: AMBIENT_COLOR, boxShadow: `0 0 6px ${AMBIENT_COLOR}` }}
          />
        )}
      </div>

      {/* Settings Panel (Only in Free Play mode) */}
      {mode === "free" && (
        <div
          className="w-full max-w-md mb-4 p-3.5 rounded-2xl flex flex-col gap-3"
          style={{
            background: bannerBg,
            border: `1px solid ${bannerBorder}`,
            boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.2)" : "0 2px 10px rgba(120,100,200,0.05)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider" style={{ color: textAccent }}>
              Game Settings
            </span>
            <button
              onClick={() => setGameMode((g) => (g === "classic" ? "time-attack" : "classic"))}
              className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
              style={{
                background: gameMode === "time-attack"
                  ? "linear-gradient(135deg, #ef4444, #f97316)"
                  : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                color: gameMode === "time-attack" ? "#fff" : isDark ? "#c4bcff" : "#4a3fa0",
                boxShadow: gameMode === "time-attack" ? "0 2px 8px rgba(239,68,68,0.3)" : "none",
              }}
            >
              ⏱️ {gameMode === "time-attack" ? "Time Attack" : "Classic Mode"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1.5" style={{ color: textMuted }}>
                Grid Size
              </span>
              <div className="flex gap-1">
                {([3, 4, 5, 6] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => {
                      setGridSize(sz);
                      // Clear obstacles if they exceed grid cells
                      if (sz === 3 && obstacleCount > 1) {
                        setObstacleCount(1);
                      }
                    }}
                    className="flex-1 py-1 rounded-lg text-xs font-black transition-all hover:scale-105"
                    style={{
                      background: gridSize === sz
                        ? "linear-gradient(135deg, #6C63FF, #9b59b6)"
                        : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                      color: gridSize === sz ? "#fff" : isDark ? "#a09ab8" : "#6b6490",
                    }}
                  >
                    {sz}x{sz}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1.5" style={{ color: textMuted }}>
                Obstacles
              </span>
              <div className="flex gap-1">
                {([0, 1, 2, 3] as const).map((obs) => {
                  const disabled = gridSize === 3 && obs > 1;
                  return (
                    <button
                      key={obs}
                      disabled={disabled}
                      onClick={() => setObstacleCount(obs)}
                      className="flex-1 py-1 rounded-lg text-xs font-black transition-all hover:scale-105 disabled:opacity-20 disabled:pointer-events-none"
                      style={{
                        background: obstacleCount === obs
                          ? "linear-gradient(135deg, #ef4444, #f97316)"
                          : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                        color: obstacleCount === obs ? "#fff" : isDark ? "#a09ab8" : "#6b6490",
                      }}
                    >
                      {obs}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Attack progress bar */}
      {gameMode === "time-attack" && !isDaily && status === "playing" && (
        <div className="w-full max-w-md mb-3 bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-yellow-500 transition-all duration-100"
            style={{ width: `${timeAttackProgress}%` }}
          />
        </div>
      )}

      {/* Power-up Guide Tooltip */}
      {activePowerUp && (
        <div className="w-full max-w-md mb-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-[11px] font-black text-center text-yellow-500 animate-pulse shrink-0">
          {activePowerUp === "hammer"
            ? "🔨 Hammer Active: Click a normal tile on the board to smash it!"
            : firstSelectedCell
              ? "🧲 Swapper Active: Click another normal tile to complete the swap!"
              : "🧲 Swapper Active: Click the first tile to swap!"}
          {" "}
          <button
            onClick={() => { setActivePowerUp(null); setFirstSelectedCell(null); }}
            className="underline ml-1 cursor-pointer font-extrabold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Board */}
      <div className="w-full max-w-md relative animate-fade-in">
        <Board
          grid={grid}
          onMove={onMove}
          shaking={shaking}
          active={isActive}
          onCellClick={handleCellClick}
          activePowerUp={activePowerUp}
          selectedCell={firstSelectedCell}
        />

        {/* Daily already-done overlay (before game started in daily mode) */}
        {isDaily && dailyDone && status === "playing" && (
          <div
            className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center z-50 gap-4 px-6 text-center"
            style={{
              background: isDark ? "rgba(26,24,48,0.97)" : "rgba(240,238,255,0.97)",
              backdropFilter: "blur(10px)",
              border: isDark ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(245,158,11,0.35)",
            }}
          >
            <div className="text-5xl">{dailyRecord?.won ? "🌟" : "📅"}</div>
            <div className="font-black text-lg" style={{ color: isDark ? "#ffd700" : "#b45309" }}>
              {dailyRecord?.won ? "You won today!" : "You played today!"}
            </div>
            <div className="text-sm" style={{ color: isDark ? "#c4bcff" : "#4a3fa0" }}>
              Score:{" "}
              <span className="font-black">{dailyRecord?.score.toLocaleString()}</span>
              {"  ·  "}
              Moves:{" "}
              <span className="font-black">{dailyRecord?.moves}</span>
              {"  ·  "}
              Top:{" "}
              <span className="font-black">{dailyRecord?.highestTile}</span>
            </div>
            <div className="text-[11px]" style={{ color: textMuted }}>
              Come back tomorrow for a new challenge!
            </div>
            <button
              onClick={() => { setMode("free"); resetGame(); }}
              className="mt-1 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                background: isDark ? "rgba(108,99,255,0.2)" : "rgba(108,99,255,0.12)",
                border: `1px solid ${isDark ? "rgba(108,99,255,0.4)" : "rgba(108,99,255,0.28)"}`,
                color: isDark ? "#c4bcff" : "#4a3fa0",
              }}
            >
              Play Free Mode
            </button>
          </div>
        )}

        <GameOverlay
          status={status}
          score={score}
          moveCount={moveCount}
          highestTile={highestTile}
          trackEmoji={currentTrack.emoji}
          trackName={currentTrack.name}
          isDaily={isDaily}
          isCampaign={mode === "campaign"}
          onNextLevel={
            mode === "campaign" && selectedLevelId && selectedLevelId < 50
              ? () => {
                  setSelectedLevelId(selectedLevelId + 1);
                  resetGame();
                }
              : undefined
          }
          onBackToMap={() => {
            setShowMap(true);
          }}
          onRestart={
            mode === "daily" && dailyDone
              ? () => { setMode("free"); resetGame(); }
              : () => resetGame()
          }
          onContinue={continueGame}
        />
      </div>

      {/* Power-up Inventory Bar */}
      <div
        className="w-full max-w-md mt-4 p-3 rounded-2xl flex items-center justify-around gap-2 shrink-0"
        style={{
          background: bannerBg,
          border: `1px solid ${bannerBorder}`,
          boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.2)" : "0 2px 10px rgba(120,100,200,0.05)",
        }}
      >
        <div className="text-[10px] font-black uppercase tracking-wider shrink-0" style={{ color: textAccent }}>
          Tools:
        </div>
        
        <button
          disabled={powerups.hammer <= 0}
          onClick={() => togglePowerUp("hammer")}
          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1 disabled:opacity-30 disabled:hover:scale-100 disabled:active:scale-100"
          style={{
            background: activePowerUp === "hammer"
              ? "linear-gradient(135deg, #ef4444, #f97316)"
              : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            color: activePowerUp === "hammer" ? "#fff" : isDark ? "#c4bcff" : "#4a3fa0",
            border: activePowerUp === "hammer" ? "none" : `1px solid ${isDark ? "rgba(108,99,255,0.2)" : "rgba(108,99,255,0.1)"}`,
          }}
        >
          🔨 Hammer ({powerups.hammer})
        </button>

        <button
          disabled={powerups.swapper <= 0}
          onClick={() => togglePowerUp("swapper")}
          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1 disabled:opacity-30 disabled:hover:scale-100 disabled:active:scale-100"
          style={{
            background: activePowerUp === "swapper"
              ? "linear-gradient(135deg, #3b82f6, #6366f1)"
              : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            color: activePowerUp === "swapper" ? "#fff" : isDark ? "#c4bcff" : "#4a3fa0",
            border: activePowerUp === "swapper" ? "none" : `1px solid ${isDark ? "rgba(108,99,255,0.2)" : "rgba(108,99,255,0.1)"}`,
          }}
        >
          🧲 Swapper ({powerups.swapper})
        </button>

        <button
          disabled={powerups.thaw <= 0}
          onClick={() => {
            useThaw();
            setActivePowerUp(null);
            setFirstSelectedCell(null);
          }}
          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1 disabled:opacity-30 disabled:hover:scale-100 disabled:active:scale-100"
          style={{
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            color: isDark ? "#c4bcff" : "#4a3fa0",
            border: `1px solid ${isDark ? "rgba(108,99,255,0.2)" : "rgba(108,99,255,0.1)"}`,
          }}
        >
          🔥 Thaw ({powerups.thaw})
        </button>
      </div>

      {/* Daily Quest Card */}
      {quest && (
        <div
          className="w-full max-w-md mt-4 p-4 rounded-2xl flex flex-col gap-2 shrink-0 animate-fade-in"
          style={{
            background: bannerBg,
            border: `1px solid ${bannerBorder}`,
            boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.2)" : "0 2px 10px rgba(120,100,200,0.05)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1">
              🎯 Daily Quest
            </span>
            {quest.completed && !quest.claimed && (
              <button
                onClick={claimReward}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase rounded-lg transition-all animate-bounce"
              >
                Claim 🪙{quest.reward}
              </button>
            )}
            {quest.claimed && (
              <span className="text-[10px] font-black text-green-500 uppercase">
                Claimed ✓
              </span>
            )}
          </div>
          <div className="text-xs font-bold mt-1" style={{ color: isDark ? "#e8e4ff" : "#2d2b55" }}>
            {quest.text}
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden mt-1 relative">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300"
              style={{ width: `${Math.min(100, (quest.current / quest.target) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] opacity-75 mt-0.5" style={{ color: textMuted }}>
            <span>Progress: {quest.current.toLocaleString()} / {quest.target.toLocaleString()}</span>
            <span>Reward: 🪙 {quest.reward}</span>
          </div>
        </div>
      )}

      {/* Mobile d-pad */}
      <div className="mt-6 flex flex-col items-center gap-1.5 sm:hidden">
        <button onClick={() => handleMove("up")} className="dpad-btn">▲</button>
        <div className="flex gap-1.5">
          {(["left","down","right"] as const).map((d) => (
            <button key={d} onClick={() => handleMove(d)} className="dpad-btn">
              {d === "left" ? "◀" : d === "down" ? "▼" : "▶"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center text-[10px]" style={{ color: isDark ? "#3e3860" : "#ccc8e0" }}>
        Arrow keys · WASD · Swipe
        {!muted && ` · 432 Hz · ${currentTrack.name}`}
        {mode === "campaign" ? " · Campaign Mode" : mode === "daily" ? " · Daily Challenge" : " · Free Play"}
      </div>
    </div>
  );
}
