import { useState } from "react";
import { BottomSheet } from "../ui/Sheet";
import {
  copyPreviousMonth,
  clearMonth,
  clearHabitMonth,
  exportData,
} from "../domain/actions";
import { fmtMonthYear, scheduleLabel } from "../ui/format";
import type { Habit } from "../domain/types";
import { IconBolt, IconChevron, IconPlus, IconSettings } from "../ui/icons";

interface Props {
  open: boolean;
  onClose: () => void;
  month: Date;
  habits: Habit[];
  onEdit: (h: Habit) => void;
  onAdd: () => void;
}

export function Commands({ open, onClose, month, habits, onEdit, onAdd }: Props) {
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

  const doExport = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habitos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="row gap8" style={{ marginBottom: 12 }}>
        <IconBolt size={20} className="streak" />
        <h2 className="h2">Comandos rápidos</h2>
      </div>

      {!uncheckMode ? (
        <div className="stack" style={{ gap: 10 }}>
          <CmdRow
            title="Copiar datos del mes anterior"
            sub="Replica las marcas del mes previo"
            onClick={() => run(() => copyPreviousMonth(month))}
            disabled={busy}
          />
          <CmdRow
            title="Desmarcar casillas de un hábito"
            sub={`En ${fmtMonthYear(month)}`}
            onClick={() => setUncheckMode(true)}
            disabled={busy}
          />
          <CmdRow
            title="Limpiar toda la plantilla"
            sub={`Borra las marcas de ${fmtMonthYear(month)}`}
            danger
            onClick={() =>
              window.confirm(`¿Borrar todas las marcas de ${fmtMonthYear(month)}?`) &&
              run(() => clearMonth(month))
            }
            disabled={busy}
          />
          <CmdRow title="Exportar respaldo (JSON)" sub="Descarga todos tus datos" onClick={doExport} />

          <div className="row between mt16" style={{ marginBottom: 4 }}>
            <span className="eyebrow">Tus hábitos ({habits.length})</span>
            <button className="chip" onClick={onAdd}>
              <IconPlus size={14} /> Nuevo
            </button>
          </div>
          <div className="stack" style={{ gap: 8, maxHeight: 260, overflowY: "auto" }}>
            {habits.map((h) => (
              <button
                key={h.id}
                className="card row between"
                style={{ padding: "12px 14px" }}
                onClick={() => onEdit(h)}
              >
                <span className="row gap12 grow" style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 20 }}>{h.emoji}</span>
                  <span className="grow ellipsis" style={{ textAlign: "left", fontWeight: 600 }}>
                    {h.name}
                  </span>
                </span>
                <span className="row gap8">
                  <span className="chip">{scheduleLabel(h)}</span>
                  <IconSettings size={16} className="dim" />
                </span>
              </button>
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
              onClick={() =>
                window.confirm(`¿Desmarcar "${h.name}" en ${fmtMonthYear(month)}?`) &&
                run(async () => {
                  await clearHabitMonth(h.id, month);
                  setUncheckMode(false);
                })
              }
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
    </BottomSheet>
  );
}

function CmdRow({
  title,
  sub,
  onClick,
  danger,
  disabled,
}: {
  title: string;
  sub: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      className="card row between"
      style={{ padding: "14px 16px", opacity: disabled ? 0.5 : 1 }}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="stack" style={{ textAlign: "left" }}>
        <span style={{ fontWeight: 700, color: danger ? "var(--danger)" : "var(--text)" }}>
          {title}
        </span>
        <span className="dim" style={{ fontSize: 12.5 }}>
          {sub}
        </span>
      </span>
      <IconChevron size={18} className="dim" />
    </button>
  );
}
