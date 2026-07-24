import React from "react";
import { Cell } from "../game/logic";

interface TileProps {
  cell: Cell;
}

function getTileClass(value: number, isObstacle?: boolean): string {
  if (isObstacle) return "tile tile-obstacle bg-gradient-to-br from-neutral-600 to-neutral-800 dark:from-neutral-800 dark:to-neutral-950 border-2 border-neutral-500 shadow-[0_4px_0_#262626]";
  if (value >= 4096) return "tile tile-4096";
  if (value >= 2024) return "tile tile-2024";
  if (value >= 1024) return "tile tile-1024";
  if (value >= 512)  return "tile tile-512";
  if (value >= 256)  return "tile tile-256";
  if (value >= 128)  return "tile tile-128";
  if (value >= 64)   return "tile tile-64";
  if (value >= 32)   return "tile tile-32";
  if (value >= 16)   return "tile tile-16";
  if (value >= 8)    return "tile tile-8";
  if (value >= 4)    return "tile tile-4";
  return "tile tile-2";
}

function getFontSize(value: number): string {
  const d = String(value).length;
  if (d >= 5) return "text-[13px] sm:text-[15px] md:text-[19px] lg:text-[22px]";
  if (d === 4) return "text-[16px] sm:text-[19px] md:text-[25px] lg:text-[28px]";
  if (d === 3) return "text-[20px] sm:text-[23px] md:text-[30px] lg:text-[34px]";
  return "text-[26px] sm:text-[30px] md:text-[38px] lg:text-[42px]";
}

export const Tile = React.memo(function Tile({ cell }: TileProps) {
  const tileClass = getTileClass(cell.value, cell.isObstacle);
  const sizeClass = getFontSize(cell.value);
  const animClass = cell.isMerged ? "tile-merged" : cell.isNew ? "tile-new" : "";

  // Dynamic styles for special tile types
  let specialStyle: React.CSSProperties = {};
  if (cell.isFrozen) {
    specialStyle = {
      border: "3px solid #a5f3fc",
      boxShadow: "inset 0 0 15px rgba(165, 243, 252, 0.85), 0 4px 12px rgba(6, 182, 212, 0.4)",
    };
  } else if (cell.isMagnet) {
    specialStyle = {
      border: "3px dashed #f43f5e",
      boxShadow: "inset 0 0 12px rgba(244, 63, 94, 0.7), 0 4px 12px rgba(244, 63, 94, 0.35)",
    };
  } else if (cell.isDoubleScore) {
    specialStyle = {
      border: "3px solid #fbbf24",
      boxShadow: "inset 0 0 15px rgba(251, 191, 36, 0.9), 0 4px 15px rgba(245, 158, 11, 0.5)",
    };
  }

  return (
    <div
      className={`w-full h-full rounded-xl flex items-center justify-center font-black select-none tracking-tight ${tileClass} ${sizeClass} ${animClass}`}
      style={{
        textShadow: cell.isObstacle ? "none" : "0 1px 3px rgba(0,0,0,0.45), 0 0 8px rgba(0,0,0,0.2)",
        zIndex: cell.isMerged ? 10 : 1,
        ...specialStyle,
      }}
    >
      {cell.isObstacle ? "🪨" : cell.value}

      {/* Special Badge Overlays */}
      {cell.isFrozen && (
        <div className="absolute top-1 right-1 text-[10px] sm:text-xs select-none pointer-events-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] animate-pulse">
          ❄️
        </div>
      )}
      {cell.isMagnet && (
        <div className="absolute top-1 right-1 text-[10px] sm:text-xs select-none pointer-events-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          🧲
        </div>
      )}
      {cell.isDoubleScore && (
        <div className="absolute top-1 right-1 text-[10px] sm:text-xs select-none pointer-events-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] animate-bounce">
          ✨
        </div>
      )}
    </div>
  );
});
