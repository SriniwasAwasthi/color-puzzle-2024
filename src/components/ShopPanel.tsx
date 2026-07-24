import { useTheme } from "../context/ThemeContext";

interface ShopPanelProps {
  coins: number;
  powerups: {
    hammer: number;
    swapper: number;
    thaw: number;
  };
  buyPowerup: (type: "hammer" | "swapper" | "thaw", price: number) => boolean;
  onClose: () => void;
}

export function ShopPanel({ coins, powerups, buyPowerup, onClose }: ShopPanelProps) {
  const { isDark } = useTheme();

  const items = [
    {
      id: "hammer" as const,
      name: "Sledge Hammer",
      desc: "Smash and remove any single normal tile on the board.",
      price: 150,
      icon: "🔨",
      owned: powerups.hammer
    },
    {
      id: "swapper" as const,
      name: "Tile Swapper",
      desc: "Swap positions of any two tiles on the grid.",
      price: 200,
      icon: "🧲",
      owned: powerups.swapper
    },
    {
      id: "thaw" as const,
      name: "Glacier Thaw",
      desc: "Thaw and unlock all frozen ice tiles instantly.",
      price: 100,
      icon: "🔥",
      owned: powerups.thaw
    }
  ];

  const panelBg = isDark ? "#16152a" : "#ffffff";
  const borderCol = isDark ? "rgba(100,90,180,0.3)" : "rgba(200,195,230,0.8)";
  const cardBg = isDark ? "#1d1b38" : "#fbfbfe";
  const textCol = isDark ? "#c4bcff" : "#4a3fa0";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        style={{
          background: panelBg,
          border: `1.5px solid ${borderCol}`,
          boxShadow: isDark ? "0 20px 50px rgba(0,0,0,0.6)" : "0 20px 50px rgba(100,100,150,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-black uppercase tracking-wider" style={{ color: textCol }}>
              Power-Up Shop
            </h3>
            <span className="text-xs font-semibold opacity-70" style={{ color: isDark ? "#8b82cc" : "#6c63ff" }}>
              Spend coins to buy grid tools!
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all hover:scale-110 active:scale-90"
            style={{
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              color: isDark ? "#fff" : "#333",
            }}
          >
            ✕
          </button>
        </div>

        {/* Coins Balance Indicator */}
        <div
          className="p-3 rounded-2xl flex items-center justify-between shadow-inner shrink-0"
          style={{
            background: isDark ? "rgba(0,0,0,0.25)" : "rgba(108,99,255,0.05)",
            border: `1px dashed ${isDark ? "rgba(108,99,255,0.25)" : "rgba(108,99,255,0.18)"}`
          }}
        >
          <span className="text-xs font-black uppercase tracking-wider" style={{ color: isDark ? "#6b6490" : "#8e86b2" }}>
            Current Balance
          </span>
          <span className="text-lg font-black text-amber-500 flex items-center gap-1.5 filter drop-shadow-[0_2px_4px_rgba(245,158,11,0.25)]">
            🪙 {coins.toLocaleString()}
          </span>
        </div>

        {/* Items List */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          {items.map((item) => {
            const canAfford = coins >= item.price;
            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl flex items-center justify-between border transition-all"
                style={{
                  background: cardBg,
                  borderColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                }}
              >
                <div className="flex items-center gap-3.5 flex-1 pr-3">
                  <span className="text-3xl shrink-0 filter drop-shadow-md">{item.icon}</span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black" style={{ color: isDark ? "#e8e4ff" : "#2d2b55" }}>
                      {item.name}
                    </h4>
                    <p className="text-[11px] leading-tight opacity-75 mt-0.5" style={{ color: isDark ? "#8b82cc" : "#6b6490" }}>
                      {item.desc}
                    </p>
                    <span className="inline-block text-[10px] font-black uppercase mt-1 px-2 py-0.5 rounded-full"
                      style={{
                        background: isDark ? "rgba(108,99,255,0.12)" : "rgba(108,99,255,0.06)",
                        color: "#6c63ff"
                      }}>
                      Owned: {item.owned}
                    </span>
                  </div>
                </div>

                <button
                  disabled={!canAfford}
                  onClick={() => buyPowerup(item.id, item.price)}
                  className="px-4 py-2.5 rounded-xl text-xs font-black text-white shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 disabled:pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, #ffd700, #f59e0b)",
                    boxShadow: canAfford ? "0 4px 12px rgba(245,158,11,0.25)" : "none",
                  }}
                >
                  🪙 {item.price}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
