import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  done: boolean;
  color?: string;
  onToggle: () => void;
  size?: number;
}

/**
 * Checkbox custom con física de resorte: pop de escala, tilde con spring
 * y anillo expansivo al marcar — el micro-feedback que engancha.
 * El burst solo se dispara en la transición real (no al montar la pantalla).
 */
export function Checkbox({ done, color = "var(--accent)", onToggle, size = 30 }: Props) {
  const [burst, setBurst] = useState(false);
  const prev = useRef(done);
  useEffect(() => {
    const was = prev.current;
    prev.current = done;
    if (done && !was) {
      setBurst(true);
      const t = setTimeout(() => setBurst(false), 650);
      return () => clearTimeout(t);
    }
  }, [done]);

  return (
    <motion.button
      type="button"
      aria-pressed={done}
      onClick={onToggle}
      whileTap={{ scale: 0.78 }}
      animate={burst ? { scale: [1, 1.22, 1] } : { scale: 1 }}
      transition={{ duration: 0.38, times: [0, 0.4, 1], ease: [0.22, 1, 0.36, 1] }}
      className={"check" + (done ? " done" : "")}
      style={{
        width: size,
        height: size,
        background: done ? color : "var(--surface-2)",
        position: "relative",
      }}
    >
      <AnimatePresence>
        {burst && (
          <motion.span
            key="burst"
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 2.1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: -2,
              borderRadius: 12,
              border: `2.5px solid ${color}`,
              pointerEvents: "none",
            }}
          />
        )}
        {done && (
          <motion.svg
            key="c"
            viewBox="0 0 24 24"
            initial={{ scale: 0, opacity: 0, rotate: -18 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 650, damping: 20 }}
            style={{ width: size * 0.6, height: size * 0.6 }}
          >
            <motion.path
              d="M4 12l5 5L20 6"
              fill="none"
              stroke="var(--accent-ink)"
              strokeWidth={3.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.28, delay: 0.05 }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
