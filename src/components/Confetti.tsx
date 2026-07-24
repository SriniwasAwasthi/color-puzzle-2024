import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  rotSpeed: number;
  size: number;
  color: string;
  shape: "rect" | "circle" | "ribbon";
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

const COLORS = [
  "#6C63FF", "#EC4899", "#f59e0b", "#ffd700",
  "#a78bfa", "#f472b6", "#34d399", "#60a5fa",
  "#fb923c", "#e879f9",
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function makeParticle(canvasW: number): Particle {
  return {
    x: rand(canvasW * 0.2, canvasW * 0.8),
    y: rand(-20, 0),
    vx: rand(-3.5, 3.5),
    vy: rand(2.5, 6.5),
    rot: rand(0, Math.PI * 2),
    rotSpeed: rand(-0.12, 0.12),
    size: rand(6, 14),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: (["rect", "rect", "circle", "ribbon"] as const)[Math.floor(Math.random() * 4)],
    opacity: 1,
    wobble: rand(0, Math.PI * 2),
    wobbleSpeed: rand(0.03, 0.08),
  };
}

export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const particles = useRef<Particle[]>([]);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Spawn particles in two bursts
    const N = 110;
    particles.current = Array.from({ length: N }, () => makeParticle(canvas.width));
    // Second burst slightly delayed in y
    for (let i = 0; i < 30; i++) {
      const p = makeParticle(canvas.width);
      p.x  = rand(canvas.width * 0.05, canvas.width * 0.95);
      p.y  = rand(-60, -20);
      p.vy = rand(1.5, 4.5);
      particles.current.push(p);
    }

    startTime.current = performance.now();
    const DURATION = 4200; // ms until fade-out begins
    const FADE_DURATION = 1000;

    const tick = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = now - startTime.current;

      let alive = false;

      for (const p of particles.current) {
        // Physics
        p.vy += 0.12;          // gravity
        p.vx *= 0.995;         // air drag
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 0.6;
        p.y += p.vy;
        p.rot += p.rotSpeed;

        // Fade after duration
        if (elapsed > DURATION) {
          p.opacity -= 1 / (FADE_DURATION / 16);
        }
        if (p.opacity <= 0 || p.y > canvas.height + 20) continue;
        alive = true;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "ribbon") {
          ctx.fillRect(-p.size / 2, -p.size * 0.15, p.size, p.size * 0.3);
        } else {
          // rect / square
          const s = p.size * 0.72;
          ctx.fillRect(-s / 2, -s / 2, s, s);
        }

        ctx.restore();
      }

      if (alive) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 200 }}
    />
  );
}
