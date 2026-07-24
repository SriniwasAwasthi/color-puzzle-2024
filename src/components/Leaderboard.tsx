import { useTheme } from "../context/ThemeContext";
import { LeaderboardEntry } from "../hooks/useLeaderboard";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onClose: () => void;
  onClear: () => void;
}

const MEDALS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

export function Leaderboard({ entries, onClose, onClear }: LeaderboardProps) {
  const { isDark } = useTheme();

  const overlayBg  = isDark ? "rgba(8,7,20,0.82)"  : "rgba(60,50,100,0.45)";
  const cardBg     = isDark ? "#131224"             : "#ffffff";
  const cardBorder = isDark ? "rgba(100,90,200,0.3)" : "rgba(200,195,235,0.9)";
  const headColor  = isDark ? "#e8e4ff"             : "#2d2b55";
  const subColor   = isDark ? "#6b6490"             : "#b0a8d0";
  const rowEven    = isDark ? "rgba(100,90,180,0.08)" : "rgba(108,99,255,0.04)";
  const rowHover   = isDark ? "rgba(100,90,180,0.16)" : "rgba(108,99,255,0.09)";
  const divider    = isDark ? "rgba(80,75,140,0.22)" : "rgba(200,195,230,0.6)";
  const wonColor   = "#f59e0b";
  const lostColor  = isDark ? "#8b82cc" : "#9e99c0";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: overlayBg, backdropFilter: "blur(6px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          boxShadow: isDark
            ? "0 24px 64px rgba(0,0,0,0.65), 0 4px 16px rgba(0,0,0,0.4)"
            : "0 24px 64px rgba(80,60,180,0.22), 0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 pt-5 pb-4 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${divider}` }}
        >
          <div>
            <h2 className="text-xl font-black" style={{ color: headColor }}>
              🏆 Leaderboard
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: subColor }}>
              Top {entries.length > 0 ? entries.length : 0} of 5 games
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-lg
                       transition-all hover:scale-110 active:scale-90"
            style={{
              background: isDark ? "rgba(100,90,180,0.18)" : "rgba(108,99,255,0.1)",
              color: isDark ? "#9b8fd4" : "#6C63FF",
            }}
          >
            ✕
          </button>
        </div>

        {/* Entries */}
        <div className="px-3 py-3">
          {entries.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-4xl mb-3">🎮</div>
              <p className="text-sm font-semibold" style={{ color: subColor }}>
                No scores yet — play a game!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {/* Column headers */}
              <div
                className="grid px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest"
                style={{
                  gridTemplateColumns: "28px 1fr 60px 56px 56px",
                  color: subColor,
                }}
              >
                <span>#</span>
                <span>Score</span>
                <span className="text-center">Moves</span>
                <span className="text-center">Top Tile</span>
                <span className="text-right">Date</span>
              </div>

              {entries.map((e, i) => (
                <div
                  key={i}
                  className="grid items-center px-3 py-2.5 rounded-xl transition-colors"
                  style={{
                    gridTemplateColumns: "28px 1fr 60px 56px 56px",
                    background: i % 2 === 0 ? rowEven : "transparent",
                  }}
                  onMouseEnter={(el) => {
                    (el.currentTarget as HTMLDivElement).style.background = rowHover;
                  }}
                  onMouseLeave={(el) => {
                    (el.currentTarget as HTMLDivElement).style.background =
                      i % 2 === 0 ? rowEven : "transparent";
                  }}
                >
                  {/* Rank */}
                  <span className="text-base leading-none">{MEDALS[i]}</span>

                  {/* Score + won badge */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="text-sm font-black tabular-nums"
                      style={{ color: headColor }}
                    >
                      {e.score.toLocaleString()}
                    </span>
                    {e.won && (
                      <span
                        className="text-[9px] font-black px-1 py-0.5 rounded-md leading-none"
                        style={{ background: "rgba(245,158,11,0.15)", color: wonColor }}
                      >
                        WIN
                      </span>
                    )}
                  </div>

                  {/* Moves */}
                  <span
                    className="text-xs font-semibold tabular-nums text-center"
                    style={{ color: lostColor }}
                  >
                    {e.moves}
                  </span>

                  {/* Highest tile */}
                  <span
                    className="text-xs font-black tabular-nums text-center"
                    style={{ color: e.won ? wonColor : headColor }}
                  >
                    {e.highestTile}
                  </span>

                  {/* Date */}
                  <span
                    className="text-[10px] text-right"
                    style={{ color: subColor }}
                  >
                    {e.date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {entries.length > 0 && (
          <div
            className="px-6 pb-5 pt-2 flex justify-end"
            style={{ borderTop: `1px solid ${divider}` }}
          >
            <button
              onClick={onClear}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all
                         hover:scale-105 active:scale-95"
              style={{
                color: isDark ? "#6b6490" : "#c0bbd8",
                background: isDark ? "rgba(100,90,180,0.1)" : "rgba(180,175,210,0.15)",
                border: `1px solid ${isDark ? "rgba(100,90,180,0.2)" : "rgba(180,175,210,0.3)"}`,
              }}
            >
              Clear scores
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
