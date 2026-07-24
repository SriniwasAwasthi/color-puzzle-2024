import { useState } from "react";
import { GameStatus } from "../hooks/useGame";
import { useTheme } from "../context/ThemeContext";

interface GameOverlayProps {
  status: GameStatus;
  score: number;
  moveCount: number;
  highestTile: number;
  trackEmoji: string;
  trackName: string;
  isDaily?: boolean;
  onRestart: () => void;
  onContinue: () => void;
  isCampaign?: boolean;
  onNextLevel?: () => void;
  onBackToMap?: () => void;
}

function buildShareText(
  isWon: boolean,
  score: number,
  moveCount: number,
  highestTile: number,
  trackEmoji: string,
  trackName: string,
) {
  const url = window.location.href.split("?")[0];
  if (isWon) {
    return (
      `🎉 I reached 2024 in the Number Puzzle!\n` +
      `🏆 Score: ${score.toLocaleString()} · ${moveCount} moves\n` +
      `🎵 Listening to: ${trackEmoji} ${trackName}\n` +
      `Can you beat me? → ${url}`
    );
  }
  return (
    `🎮 2024 Number Puzzle\n` +
    `📊 Score: ${score.toLocaleString()} · ${moveCount} moves · Top tile: ${highestTile}\n` +
    `🎵 ${trackEmoji} ${trackName}\n` +
    `Play at → ${url}`
  );
}

export function GameOverlay({
  status, score, moveCount, highestTile,
  trackEmoji, trackName, isDaily, onRestart, onContinue,
  isCampaign, onNextLevel, onBackToMap,
}: GameOverlayProps) {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  if (status !== "won" && status !== "over") return null;

  const isWon = status === "won";

  const handleShare = async () => {
    const text = buildShareText(isWon, score, moveCount, highestTile, trackEmoji, trackName);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const shareBtn = (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm
                 transition-all hover:scale-105 active:scale-95"
      style={{
        background: copied
          ? isDark ? "rgba(74,222,128,0.18)" : "rgba(74,222,128,0.14)"
          : isDark ? "rgba(100,90,180,0.2)"  : "rgba(108,99,255,0.1)",
        border: `1px solid ${copied
          ? isDark ? "rgba(74,222,128,0.45)" : "rgba(74,222,128,0.4)"
          : isDark ? "rgba(100,90,180,0.4)"  : "rgba(108,99,255,0.28)"}`,
        color: copied
          ? isDark ? "#4ade80" : "#16a34a"
          : isDark ? "#c4bcff" : "#4a3fa0",
        minWidth: 112,
        justifyContent: "center",
      }}
    >
      {copied ? "✓ Copied!" : "📋 Share"}
    </button>
  );

  return (
    <div
      className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center z-50"
      style={{
        background: isWon
          ? isDark ? "rgba(30,28,60,0.95)" : "rgba(230,225,255,0.93)"
          : isDark ? "rgba(30,20,28,0.95)" : "rgba(255,245,245,0.93)",
        backdropFilter: "blur(10px)",
        border: isWon
          ? isDark ? "1px solid rgba(160,140,255,0.25)" : "1px solid rgba(160,140,255,0.4)"
          : isDark ? "1px solid rgba(255,100,100,0.2)"  : "1px solid rgba(255,160,160,0.3)",
      }}
    >
      <div className="win-overlay flex flex-col items-center gap-4 px-6 text-center">
        {/* Daily challenge badge */}
        {isDaily && (
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest"
            style={{
              background: isWon
                ? "linear-gradient(135deg,#ffd700,#f59e0b)"
                : "rgba(108,99,255,0.18)",
              color: isWon ? "#1a1200" : "#c4bcff",
              boxShadow: isWon ? "0 2px 12px rgba(245,158,11,0.4)" : "none",
            }}
          >
            <span>{isWon ? "🌟" : "📅"}</span>
            <span>Daily Challenge</span>
          </div>
        )}

        {/* Campaign level badge */}
        {isCampaign && (
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest"
            style={{
              background: isWon
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "rgba(239,68,68,0.18)",
              color: "#fff",
              boxShadow: isWon ? "0 2px 12px rgba(16,185,129,0.4)" : "none",
            }}
          >
            <span>{isWon ? "🏆" : "💀"}</span>
            <span>Campaign Level</span>
          </div>
        )}

        {isWon ? (
          <>
            <div
              className="text-6xl sm:text-7xl font-black mb-1"
              style={{
                background: "linear-gradient(135deg, #ffd700, #ff6b6b, #9b59b6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 2px 8px rgba(200,100,255,0.3))",
              }}
            >
              {isCampaign ? "Victory!" : "2024!"}
            </div>
            <div className="text-base sm:text-lg font-bold" style={{ color: isDark ? "#c4bcff" : "#4a3fa0" }}>
              {isCampaign ? "Level Objectives Complete!" : "You reached the target!"}
            </div>
            <div className="text-sm" style={{ color: isDark ? "#8b82cc" : "#7b72b8" }}>
              Score:{" "}
              <span className="font-black" style={{ color: isDark ? "#e8e4ff" : "#2d2b55" }}>
                {score.toLocaleString()}
              </span>
            </div>
            <div className="text-sm" style={{ color: isDark ? "#8b82cc" : "#7b72b8" }}>
              Moves:{" "}
              <span className="font-black" style={{ color: isDark ? "#e8e4ff" : "#2d2b55" }}>
                {moveCount}
              </span>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap justify-center">
              {shareBtn}
              
              {isCampaign ? (
                <>
                  <button
                    onClick={onBackToMap}
                    className="px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: isDark ? "rgba(120,100,220,0.18)" : "rgba(120,100,220,0.1)",
                      border: `1px solid ${isDark ? "rgba(120,100,220,0.4)" : "rgba(120,100,220,0.3)"}`,
                      color: isDark ? "#c4bcff" : "#4a3fa0",
                    }}
                  >
                    🗺️ Map
                  </button>
                  {onNextLevel && (
                    <button
                      onClick={onNextLevel}
                      className="px-5 py-2 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        boxShadow: "0 4px 16px rgba(16,185,129,0.35)",
                      }}
                    >
                      Next Level ➔
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={onContinue}
                    className="px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: isDark ? "rgba(120,100,220,0.18)" : "rgba(120,100,220,0.1)",
                      border: `1px solid ${isDark ? "rgba(120,100,220,0.4)" : "rgba(120,100,220,0.3)"}`,
                      color: isDark ? "#c4bcff" : "#4a3fa0",
                    }}
                  >
                    Keep Going
                  </button>
                  <button
                    onClick={onRestart}
                    className="px-5 py-2 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #ffd700, #ff6b6b)",
                      boxShadow: "0 4px 16px rgba(255,107,107,0.35)",
                    }}
                  >
                    New Game
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div
              className="text-5xl sm:text-6xl font-black mb-1"
              style={{ color: isDark ? "#ff8080" : "#c0392b" }}
            >
              Defeat
            </div>
            <div className="text-sm font-semibold" style={{ color: isDark ? "#8b82cc" : "#999" }}>
              Final Score
            </div>
            <div
              className="text-4xl font-black"
              style={{ color: isDark ? "#e8e4ff" : "#2d2b55" }}
            >
              {score.toLocaleString()}
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{
                background: isDark ? "rgba(100,90,180,0.18)" : "rgba(108,99,255,0.08)",
                border: `1px solid ${isDark ? "rgba(100,90,180,0.3)" : "rgba(108,99,255,0.18)"}`,
              }}
            >
              <span className="text-lg">🎮</span>
              <span className="text-sm font-semibold" style={{ color: isDark ? "#b0a8e0" : "#6C63FF" }}>
                {moveCount} moves · top tile {highestTile}
              </span>
            </div>
            <div className="flex gap-2 mt-1 flex-wrap justify-center">
              {shareBtn}
              {isCampaign && (
                <button
                  onClick={onBackToMap}
                  className="px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: isDark ? "rgba(120,100,220,0.18)" : "rgba(120,100,220,0.1)",
                    border: `1px solid ${isDark ? "rgba(120,100,220,0.4)" : "rgba(120,100,220,0.3)"}`,
                    color: isDark ? "#c4bcff" : "#4a3fa0",
                  }}
                >
                  🗺️ Map
                </button>
              )}
              <button
                onClick={onRestart}
                className="px-7 py-2.5 rounded-2xl font-bold text-white text-base transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #6C63FF, #EC4899)",
                  boxShadow: "0 4px 20px rgba(108,99,255,0.35)",
                }}
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
