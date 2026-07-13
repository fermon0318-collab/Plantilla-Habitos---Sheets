import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const COLORS = ["#b0ea81", "#ffd479", "#7cd7ff", "#ff9ec4", "#c4a5ff", "#ffb27a"];

interface Piece {
  x: number;
  delay: number;
  rot: number;
  color: string;
  size: number;
  drift: number;
}

/**
 * Celebración de "día perfecto": lluvia de confetti liviana (sin canvas ni deps).
 * Se desmonta sola al terminar.
 */
export function Confetti({ onDone }: { onDone: () => void }) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: 36 }, () => ({
        x: Math.random() * 100,
        delay: Math.random() * 0.35,
        rot: (Math.random() - 0.5) * 720,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 7,
        drift: (Math.random() - 0.5) * 120,
      })),
    []
  );

  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 90,
        overflow: "hidden",
      }}
      aria-hidden
    >
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ y: -30, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: "105vh", x: p.drift, opacity: [1, 1, 0.9, 0.7], rotate: p.rot }}
          transition={{ duration: 1.7 + Math.random() * 0.5, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 0.45,
            borderRadius: 2,
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}
