import { useState } from "react";

export function HowToPlay() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs font-semibold transition-colors px-2 py-1 rounded-lg"
        style={{ color: "#b0a8d0" }}
      >
        How to play?
      </button>
      {open && (
        <div
          className="absolute top-9 right-0 rounded-2xl p-4 text-sm w-64 z-50"
          style={{
            background: "#fff",
            border: "1px solid rgba(200,195,230,0.8)",
            boxShadow: "0 8px 32px rgba(120,100,200,0.15), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div className="font-bold text-base mb-2" style={{ color: "#2d2b55" }}>
            How to Play
          </div>
          <ul className="space-y-1.5 text-xs leading-relaxed" style={{ color: "#7b72b8" }}>
            <li>
              Use <strong style={{ color: "#4a3fa0" }}>arrow keys</strong> or{" "}
              <strong style={{ color: "#4a3fa0" }}>WASD</strong> to move tiles.
            </li>
            <li>
              On mobile, <strong style={{ color: "#4a3fa0" }}>swipe</strong> in any direction.
            </li>
            <li>
              Tiles with the same number{" "}
              <strong style={{ color: "#4a3fa0" }}>merge</strong> when they collide.
            </li>
            <li>
              Reach the{" "}
              <strong
                style={{
                  background: "linear-gradient(135deg,#ffd700,#ff6b6b,#9b59b6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                2024
              </strong>{" "}
              tile to win!
            </li>
            <li>Game ends when no moves are left.</li>
            <li>
              Click <strong style={{ color: "#6C63FF" }}>🎵</strong> to toggle music.
            </li>
          </ul>
          <button
            onClick={() => setOpen(false)}
            className="mt-3 text-xs transition-colors"
            style={{ color: "#c4bce0" }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
