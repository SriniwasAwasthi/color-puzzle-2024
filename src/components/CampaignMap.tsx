import { CAMPAIGN_LEVELS } from "../game/levels";
import { useTheme } from "../context/ThemeContext";

interface CampaignMapProps {
  completedLevels: number[];
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export function CampaignMap({ completedLevels, onSelectLevel, onClose }: CampaignMapProps) {
  const { isDark } = useTheme();

  // A level is unlocked if it's Level 1 OR if the previous level is completed
  const isLevelUnlocked = (id: number) => {
    if (id === 1) return true;
    return completedLevels.includes(id - 1);
  };

  const containerBg = isDark
    ? "radial-gradient(circle at center, #1b163d 0%, #0d0c1a 100%)"
    : "radial-gradient(circle at center, #f5f3ff 0%, #ffffff 100%)";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto"
      style={{ background: containerBg }}
    >
      {/* Header bar */}
      <div className="w-full max-w-lg flex items-center justify-between mb-8 mt-2 shrink-0">
        <div>
          <h2
            className="text-2xl sm:text-3xl font-black tracking-tight"
            style={{
              background: "linear-gradient(135deg, #6C63FF 0%, #EC4899 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Campaign Mode
          </h2>
          <p className="text-xs font-semibold" style={{ color: isDark ? "#6b6490" : "#b0a8d0" }}>
            Unlock levels, earn coins, and reach the final sanctuary!
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg transition-all hover:scale-110 active:scale-90"
          style={{
            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
            color: isDark ? "#fff" : "#333",
          }}
        >
          ✕
        </button>
      </div>

      {/* Map Nodes List */}
      <div className="w-full max-w-lg flex flex-col items-center relative gap-6 pb-20">
        {/* Draw a connecting line in the background */}
        <div
          className="absolute top-8 bottom-20 w-1.5 rounded-full opacity-30"
          style={{
            background: "linear-gradient(to bottom, #6C63FF, #EC4899, #f59e0b)",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />

        {CAMPAIGN_LEVELS.map((lvl) => {
          const unlocked = isLevelUnlocked(lvl.id);
          const completed = completedLevels.includes(lvl.id);
          
          // Zig-zag offset class
          const isLeft = lvl.id % 2 === 0;
          const offsetClass = isLeft ? "sm:mr-32 sm:self-start" : "sm:ml-32 sm:self-end";

          return (
            <div
              key={lvl.id}
              className={`flex flex-col items-center w-full max-w-[280px] z-10 transition-all ${offsetClass}`}
            >
              <button
                disabled={!unlocked}
                onClick={() => onSelectLevel(lvl.id)}
                className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-xl transition-all relative
                           ${unlocked ? "hover:scale-110 active:scale-95 cursor-pointer shadow-lg" : "cursor-not-allowed opacity-50"}`}
                style={{
                  background: completed
                    ? "linear-gradient(135deg, #10b981, #059669)"
                    : unlocked
                      ? "linear-gradient(135deg, #6C63FF, #EC4899)"
                      : isDark ? "#2a2842" : "#e2e8f0",
                  color: unlocked ? "#fff" : isDark ? "#504c72" : "#94a3b8",
                  border: `3px solid ${
                    completed
                      ? "#34d399"
                      : unlocked
                        ? "#ffd700"
                        : isDark ? "#1e1c31" : "#cbd5e1"
                  }`,
                  boxShadow: unlocked
                    ? "0 4px 14px rgba(108,99,255,0.4)"
                    : "none",
                }}
              >
                {completed ? "⭐" : lvl.id}
                
                {/* Lock icon overlay for locked levels */}
                {!unlocked && (
                  <span className="absolute -top-1 -right-1 text-xs bg-neutral-800 p-0.5 rounded-full border border-neutral-700">
                    🔒
                  </span>
                )}
              </button>

              <div className="text-center mt-2">
                <span
                  className="block text-xs font-black"
                  style={{ color: unlocked ? (isDark ? "#c4bcff" : "#4a3fa0") : "#7b7b7b" }}
                >
                  {lvl.name}
                </span>
                <span className="block text-[10px] opacity-75 mt-0.5" style={{ color: isDark ? "#6b6490" : "#9e97bd" }}>
                  Target: {lvl.targetTile === 4096 ? "4096" : lvl.targetTile} ({lvl.gridSize}x{lvl.gridSize})
                  {lvl.movesLimit ? ` · ${lvl.movesLimit} moves` : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
