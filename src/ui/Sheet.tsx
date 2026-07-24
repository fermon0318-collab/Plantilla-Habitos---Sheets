import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useDismissable } from "../hooks/useDismissable";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

const EXIT_MS = 380;

/**
 * Bottom sheet reutilizable con scrim y arrastre de cierre.
 * Maneja el montaje/desmontaje a mano (sin AnimatePresence): con Fragment +
 * múltiples motion.div sin key individual, AnimatePresence puede no completar
 * nunca la animación de salida y dejar el panel "trabado" en pantalla aunque
 * el estado `open` ya sea false (bug reproducido con clic real en el scrim).
 */
export function BottomSheet({ open, onClose, children }: Props) {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(open);
  const timer = useRef<number | null>(null);

  useDismissable(open, onClose);

  useEffect(() => {
    if (open) {
      if (timer.current) window.clearTimeout(timer.current);
      setRendered(true);
      // siguiente frame, para que la transición de entrada corra desde el estado cerrado
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      timer.current = window.setTimeout(() => setRendered(false), EXIT_MS);
    }
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [open]);

  if (!rendered) return null;

  return (
    <>
      <motion.div
        className="scrim"
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="sheet"
        animate={{ y: visible ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120) onClose();
        }}
      >
        <div className="grabber" />
        {children}
      </motion.div>
    </>
  );
}
