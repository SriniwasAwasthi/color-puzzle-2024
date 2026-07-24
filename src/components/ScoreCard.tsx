import { useTheme } from "../context/ThemeContext";

interface ScoreCardProps {
  label: string;
  value: number;
  accent?: string;
}

export function ScoreCard({ label, value, accent }: ScoreCardProps) {
  const { isDark } = useTheme();
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl px-4 py-2 min-w-[82px]"
      style={{
        background: isDark ? "#1e1d30" : "#ffffff",
        border: isDark
          ? "1px solid rgba(100,90,180,0.25)"
          : "1px solid rgba(200,195,230,0.7)",
        boxShadow: isDark
          ? "0 1px 3px rgba(0,0,0,0.3), 0 4px 14px rgba(0,0,0,0.2)"
          : "0 1px 3px rgba(0,0,0,0.05), 0 4px 14px rgba(120,100,200,0.10)",
      }}
    >
      <span
        className="text-[10px] font-extrabold uppercase tracking-[0.14em] mb-0.5"
        style={{ color: isDark ? "#6b6490" : "#9e99c0" }}
      >
        {label}
      </span>
      <span
        className="text-xl sm:text-2xl font-black tabular-nums leading-tight"
        style={{ color: accent ?? (isDark ? "#e8e4ff" : "#2d2b55") }}
      >
        {value.toLocaleString()}
      </span>
    </div>
  );
}
