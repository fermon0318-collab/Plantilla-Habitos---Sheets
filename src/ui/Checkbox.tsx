import { motion, AnimatePresence } from "framer-motion";

interface Props {
  done: boolean;
  color?: string;
  onToggle: () => void;
  size?: number;
}

/** Checkbox custom con microanimación de resorte al marcar (nada de checkboxes cuadrados default). */
export function Checkbox({ done, color = "var(--accent)", onToggle, size = 30 }: Props) {
  return (
    <motion.button
      type="button"
      aria-pressed={done}
      onClick={onToggle}
      whileTap={{ scale: 0.82 }}
      className={"check" + (done ? " done" : "")}
      style={{
        width: size,
        height: size,
        background: done ? color : "var(--surface-2)",
      }}
    >
      <AnimatePresence>
        {done && (
          <motion.svg
            key="c"
            viewBox="0 0 24 24"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 22 }}
            style={{ width: size * 0.6, height: size * 0.6 }}
          >
            <path
              d="M4 12l5 5L20 6"
              fill="none"
              stroke="var(--accent-ink)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
