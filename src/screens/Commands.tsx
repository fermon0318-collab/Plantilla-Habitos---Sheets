import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { BottomSheet } from "../ui/Sheet";
import { copyPreviousMonth, clearMonth, clearHabitMonth, reorderHabits, haptic } from "../domain/actions";
import { fmtMonthYear, scheduleLabel } from "../ui/format";
import type { Habit } from "../domain/types";
import { THEMES, type ThemeId } from "../hooks/useTheme";
import { useUI } from "../ui/uiContext";
import {
  IconBolt,
  IconChevron,
  IconPlus,
  IconSettings,
  IconCopy,
  IconUndo,
  IconTrash,
  IconPalette,
  IconCheck,
} from "../ui/icons";

interface Props {
  open: boolean;
  onClose: () => void;
  month: Date;
  habits: Habit[];
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  onEdit: (h: Habit) => void;
  onAdd: () => void;
}

export function Commands({ open, onClose, month, habits, theme, setTheme, onEdit, onAdd }: Props) {
  const ui = useUI();
  const [uncheckMode, setUncheckMode] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= habits.length) return;
    haptic(8);
    const next = [...habits];
    [next[index], next[j]] = [next[j], next[index]];
    reorderHabits(next);
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ maxHeight: "72vh", overflowY: "auto", paddingBottom: 4 }}>
        <div className="row gap8" style={{ marginBottom: 12 }}>
          <IconBolt size={20} className="streak" />
          <h2 className="h2">Comandos rápidos</h2>
        </div>

        {!uncheckMode ? (
          <div className="stack" style={{ gap: 10 }}>
            {/* ——— Apariencia ——— */}
            <div className="row gap8" style={{ margin: "2px 2px 0" }}>
              <IconPalette size={16} className="dim" />
              <span className="eyebrow">Apariencia</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {THEMES.map((t) => {
                const on = theme === t.id;
                return (
                  <motion.button
                    key={t.id}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      haptic(8);
                      setTheme(t.id);
                    }}
                    className="card stack"
                    style={{
                      padding: "10px 6px",
                      alignItems: "center",
                      gap: 7,
                      border: on ? `2px solid ${t.accent}` : "1px solid var(--border)",
                    }}
                  >
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: t.bg,
                        border: `3px solid ${t.accent}`,
                        display: "grid",
                        placeItems: "center",
                        boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.08)",
                      }}
                    >
                      {on && <IconCheck size={15} style={{ color: t.accent }} />}
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 700 }}>{t.name}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* ——— Comandos ——— */}
            <CmdRow
              icon={<IconCopy size={19} />}
              title="Copiar datos del mes anterior"
              sub="Replica las marcas del mes previo"
              onClick={async () => {
                if (
                  await ui.confirm({
                    title: "¿Copiar el mes anterior?",
                    message: `Se replicarán las marcas del mes previo sobre ${fmtMonthYear(month)}.`,
                    confirmLabel: "Copiar",
                  })
                )
                  run(() => copyPreviousMonth(month));
              }}
              disabled={busy}
            />
            <CmdRow
              icon={<IconUndo size={19} />}
              title="Desmarcar casillas de un hábito"
              sub={`En ${fmtMonthYear(month)}`}
              onClick={() => setUncheckMode(true)}
              disabled={busy}
            />
            <CmdRow
              icon={<IconTrash size={19} />}
              title="Limpiar toda la plantilla"
              sub={`Borra las marcas de ${fmtMonthYear(month)}`}
              danger
              onClick={async () => {
                if (
                  await ui.confirm({
                    title: "¿Limpiar toda la plantilla?",
                    message: `Se borrarán todas las marcas de ${fmtMonthYear(month)}. No se puede deshacer.`,
                    confirmLabel: "Borrar",
                    danger: true,
                  })
                )
                  run(() => clearMonth(month));
              }}
              disabled={busy}
            />

            <div className="row between mt16" style={{ marginBottom: 4 }}>
              <span className="eyebrow">Tus hábitos ({habits.length})</span>
              <button className="chip" onClick={onAdd}>
                <IconPlus size={14} /> Nuevo
              </button>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              {habits.map((h, i) => (
                <div key={h.id} className="card row gap8" style={{ padding: "8px 8px 8px 14px", alignItems: "center" }}>
                  <div className="stack" style={{ gap: 2 }}>
                    <button
                      className="btn ghost dim"
                      style={{ padding: 3, opacity: i === 0 ? 0.3 : 1 }}
                      disabled={i === 0}
                      aria-label={`Subir ${h.name}`}
                      onClick={() => move(i, -1)}
                    >
                      <IconChevron size={14} style={{ transform: "rotate(-90deg)" }} />
                    </button>
                    <button
                      className="btn ghost dim"
                      style={{ padding: 3, opacity: i === habits.length - 1 ? 0.3 : 1 }}
                      disabled={i === habits.length - 1}
                      aria-label={`Bajar ${h.name}`}
                      onClick={() => move(i, 1)}
                    >
                      <IconChevron size={14} style={{ transform: "rotate(90deg)" }} />
                    </button>
                  </div>
                  <button
                    className="row gap12 grow"
                    style={{ minWidth: 0, textAlign: "left" }}
                    onClick={() => onEdit(h)}
                  >
                    <span style={{ fontSize: 20 }}>{h.emoji}</span>
                    <span className="grow ellipsis" style={{ fontWeight: 600 }}>
                      {h.name}
                    </span>
                  </button>
                  <span className="row gap8">
                    <span className="chip">{scheduleLabel(h)}</span>
                    <IconSettings size={16} className="dim" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            <button className="chip" style={{ alignSelf: "flex-start" }} onClick={() => setUncheckMode(false)}>
              ← Volver
            </button>
            <p className="muted" style={{ margin: "4px 2px 8px", fontSize: 14 }}>
              Elegí el hábito a desmarcar en {fmtMonthYear(month)}:
            </p>
            {habits.map((h) => (
              <button
                key={h.id}
                className="card row between"
                style={{ padding: "12px 14px" }}
                onClick={async () => {
                  if (
                    await ui.confirm({
                      title: `¿Desmarcar "${h.name}"?`,
                      message: `Se quitarán sus marcas de ${fmtMonthYear(month)}.`,
                      confirmLabel: "Desmarcar",
                      danger: true,
                    })
                  )
                    run(async () => {
                      await clearHabitMonth(h.id, month);
                      setUncheckMode(false);
                    });
                }}
              >
                <span className="row gap12">
                  <span style={{ fontSize: 20 }}>{h.emoji}</span>
                  <span style={{ fontWeight: 600 }}>{h.name}</span>
                </span>
                <IconChevron size={16} className="dim" />
              </button>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

function CmdRow({
  icon,
  title,
  sub,
  onClick,
  danger,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      className="card row gap12"
      style={{ padding: "14px 16px", opacity: disabled ? 0.5 : 1, alignItems: "center" }}
      onClick={onClick}
      disabled={disabled}
    >
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          flex: "none",
          background: "var(--surface-hi)",
          color: danger ? "var(--danger)" : "var(--accent)",
        }}
      >
        {icon}
      </span>
      <span className="stack grow" style={{ textAlign: "left", minWidth: 0 }}>
        <span style={{ fontWeight: 700, color: danger ? "var(--danger)" : "var(--text)" }}>{title}</span>
        <span className="dim" style={{ fontSize: 12.5 }}>
          {sub}
        </span>
      </span>
      <IconChevron size={18} className="dim" />
    </button>
  );
}
