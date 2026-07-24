import { useEffect, useRef } from "react";
import { Direction } from "../game/logic";

export function useKeyboard(onMove: (dir: Direction) => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
        W: "up",
        S: "down",
        A: "left",
        D: "right",
      };
      const dir = keyMap[e.key];
      if (dir) {
        e.preventDefault();
        onMove(dir);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onMove, active]);
}

export function useSwipe(
  ref: React.RefObject<HTMLElement | null>,
  onMove: (dir: Direction) => void,
  active: boolean
) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const threshold = 30;

      if (Math.max(absDx, absDy) < threshold) return;

      if (absDx > absDy) {
        onMove(dx > 0 ? "right" : "left");
      } else {
        onMove(dy > 0 ? "down" : "up");
      }
      touchStart.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ref, onMove, active]);
}
