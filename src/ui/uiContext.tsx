import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { HabitEditor } from "../screens/HabitEditor";
import { Commands } from "../screens/Commands";
import type { Habit } from "../domain/types";
import type { ThemeId } from "../hooks/useTheme";
import { useDismissable } from "../hooks/useDismissable";

interface ConfirmOpts {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface UICtx {
  addHabit: () => void;
  editHabit: (h: Habit) => void;
  openCommands: () => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
  theme: ThemeId;
}

const Ctx = createContext<UICtx | null>(null);
export const useUI = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUI outside provider");
  return c;
};

export function UIProvider({
  habits,
  month,
  theme,
  setTheme,
  children,
}: {
  habits: Habit[];
  month: Date;
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  children: ReactNode;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmOpts | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const closeConfirm = (v: boolean) => {
    resolver.current?.(v);
    resolver.current = null;
    setConfirmState(null);
  };

  useDismissable(!!confirmState, () => closeConfirm(false));

  const api: UICtx = {
    addHabit: () => {
      setEditing(null);
      setEditorOpen(true);
    },
    editHabit: (h) => {
      setEditing(h);
      setEditorOpen(true);
    },
    openCommands: () => setCommandsOpen(true),
    confirm: (opts) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setConfirmState(opts);
      }),
    theme,
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      <HabitEditor open={editorOpen} editing={editing} onClose={() => setEditorOpen(false)} />
      <Commands
        open={commandsOpen}
        onClose={() => setCommandsOpen(false)}
        month={month}
        habits={habits}
        theme={theme}
        setTheme={setTheme}
        onAdd={() => {
          setCommandsOpen(false);
          api.addHabit();
        }}
        onEdit={(h) => {
          setCommandsOpen(false);
          api.editHabit(h);
        }}
      />

      {confirmState && (
        <div className="confirm-overlay" onClick={() => closeConfirm(false)}>
          <motion.div
            className="confirm-dialog"
            initial={{ scale: 0.9, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            role="alertdialog"
            aria-label={confirmState.title}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="h2" style={{ marginBottom: 6 }}>
              {confirmState.title}
            </h2>
            {confirmState.message && (
              <p className="muted" style={{ fontSize: 14, margin: "0 0 18px", lineHeight: 1.4 }}>
                {confirmState.message}
              </p>
            )}
            <div className="row gap8" style={{ marginTop: confirmState.message ? 0 : 14 }}>
              <button className="btn ghost grow" onClick={() => closeConfirm(false)}>
                Cancelar
              </button>
              <button
                className={"btn grow " + (confirmState.danger ? "danger-solid" : "primary")}
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Ctx.Provider>
  );
}
