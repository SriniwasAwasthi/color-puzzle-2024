import { useRef, useState } from "react";
import { Grid, Direction } from "../game/logic";
import { Tile } from "./Tile";
import { useSwipe } from "../hooks/useSwipe";
import { useTheme } from "../context/ThemeContext";

interface BoardProps {
  grid: Grid;
  onMove: (dir: Direction) => void;
  shaking: boolean;
  active: boolean;
  onCellClick?: (r: number, c: number) => void;
  activePowerUp?: "hammer" | "swapper" | null;
  selectedCell?: { r: number; c: number } | null;
}

export function Board({
  grid,
  onMove,
  shaking,
  active,
  onCellClick,
  activePowerUp,
  selectedCell
}: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  useSwipe(boardRef, onMove, active && !activePowerUp);

  const size = grid.length;

  // ─── 3D Perspective Tilt ───────────────────────────────────
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16; 
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={boardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`game-board w-full select-none ${shaking ? "board-shake" : ""}`}
      style={{
        maxWidth: 480,
        margin: "0 auto",
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: "transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="rounded-3xl p-3"
        style={{
          background: isDark ? "#1a1930" : "#ffffff",
          boxShadow: isDark
            ? "0 1px 3px rgba(0,0,0,0.3), 0 12px 40px rgba(0,0,0,0.5), 0 32px 80px rgba(0,0,0,0.35)"
            : "0 1px 3px rgba(0,0,0,0.06), 0 12px 40px rgba(100,100,140,0.18), 0 32px 80px rgba(100,100,160,0.12)",
          border: isDark ? "1px solid rgba(100,90,180,0.25)" : "1px solid rgba(220,220,240,0.8)",
          transform: "translateZ(20px)",
        }}
      >
        <div
          className="rounded-2xl p-2"
          style={{
            background: isDark
              ? "linear-gradient(160deg, #13112a 0%, #0f0e22 100%)"
              : "linear-gradient(160deg, #f1f0f8 0%, #eceaf6 100%)",
            boxShadow: isDark
              ? "inset 0 2px 8px rgba(0,0,0,0.4)"
              : "inset 0 2px 8px rgba(120,100,200,0.10)",
          }}
        >
          <div
            className="grid gap-2 sm:gap-[10px]"
            style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
          >
            {grid.flat().map((cell, i) => {
              const r = Math.floor(i / size);
              const c = i % size;
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;

              // Visual indicators for active power-ups
              const isClickable = activePowerUp && cell && !cell.isObstacle;
              
              return (
                <div
                  key={i}
                  onClick={() => onCellClick?.(r, c)}
                  className={`rounded-xl aspect-square relative transition-all duration-200
                             ${isClickable ? "cursor-crosshair hover:scale-105 hover:brightness-125" : ""}
                             ${isSelected ? "ring-4 ring-yellow-400 ring-offset-2 ring-offset-neutral-900" : ""}`}
                  style={{
                    background: isDark
                      ? "rgba(50,44,110,0.35)"
                      : "rgba(180,175,210,0.22)",
                    boxShadow: isDark
                      ? "inset 0 2px 4px rgba(0,0,0,0.3)"
                      : "inset 0 2px 4px rgba(100,80,180,0.10)",
                    minHeight: 60,
                    transform: isSelected ? "translateZ(30px)" : "translateZ(10px)",
                  }}
                >
                  {cell && <Tile cell={cell} />}
                  
                  {/* Hammer targeting overlays */}
                  {activePowerUp === "hammer" && cell && !cell.isObstacle && (
                    <div className="absolute inset-0 bg-red-500/20 rounded-xl flex items-center justify-center text-lg pointer-events-none animate-pulse">
                      🔨
                    </div>
                  )}

                  {/* Swapper targeting overlays */}
                  {activePowerUp === "swapper" && cell && !cell.isObstacle && !isSelected && (
                    <div className="absolute inset-0 bg-blue-500/20 rounded-xl flex items-center justify-center text-lg pointer-events-none hover:bg-blue-500/40">
                      🧲
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
