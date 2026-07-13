import { createContext, useContext, useState, type ReactNode } from "react";
import { HabitEditor } from "../screens/HabitEditor";
import { Commands } from "../screens/Commands";
import type { Habit } from "../domain/types";

interface UICtx {
  addHabit: () => void;
  editHabit: (h: Habit) => void;
  openCommands: () => void;
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
  children,
}: {
  habits: Habit[];
  month: Date;
  children: ReactNode;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [commandsOpen, setCommandsOpen] = useState(false);

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
        onAdd={() => {
          setCommandsOpen(false);
          api.addHabit();
        }}
        onEdit={(h) => {
          setCommandsOpen(false);
          api.editHabit(h);
        }}
      />
    </Ctx.Provider>
  );
}
