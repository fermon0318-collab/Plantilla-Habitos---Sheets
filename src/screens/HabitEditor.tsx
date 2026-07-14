import { useEffect, useState } from "react";
import { BottomSheet } from "../ui/Sheet";
import { addHabit, updateHabit, deleteHabit, haptic } from "../domain/actions";
import type { Habit } from "../domain/types";
import { IconTrash } from "../ui/icons";
import { useUI } from "../ui/uiContext";

const EMOJIS = ["🌅","💪","📖","💧","🧠","🏃","🧘","🥗","😴","💰","📘","🎨","🎸","✍️","🧹","☀️","📵","🙏","🐕","☕"];
const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Habit | null;
}

export function HabitEditor({ open, onClose, editing }: Props) {
  const ui = useUI();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [frequency, setFrequency] = useState(5);
  const [mode, setMode] = useState<"flex" | "days">("flex");
  const [days, setDays] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setEmoji(editing?.emoji ?? "✨");
      setFrequency(editing?.frequency ?? 5);
      const hasDays = !!editing?.days && editing.days.length > 0;
      setMode(hasDays ? "days" : "flex");
      setDays(hasDays ? [...editing!.days!] : []);
    }
  }, [open, editing]);

  const valid = name.trim().length > 0 && (mode === "flex" || days.length > 0);

  const save = async () => {
    if (!valid) return;
    haptic();
    const payload = {
      name: name.trim(),
      emoji,
      frequency: mode === "days" ? days.length : frequency,
      days: mode === "days" ? [...days].sort() : null,
    };
    if (editing) await updateHabit(editing.id, payload);
    else await addHabit(payload);
    onClose();
  };

  const remove = async () => {
    if (!editing) return;
    const ok = await ui.confirm({
      title: `¿Eliminar "${editing.name}"?`,
      message: "Se borrará el hábito y todo su historial. No se puede deshacer.",
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;
    await deleteHabit(editing.id);
    onClose();
  };

  const toggleDay = (d: number) => {
    haptic(8);
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="row between" style={{ marginBottom: 4 }}>
        <h2 className="h2">{editing ? "Editar hábito" : "Nuevo hábito"}</h2>
        {editing && (
          <button className="btn ghost danger" onClick={remove} style={{ padding: 8 }}>
            <IconTrash size={18} />
          </button>
        )}
      </div>

      <label className="lbl">Ícono</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            className="pressable"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              fontSize: 20,
              background: emoji === e ? "var(--surface-hi)" : "var(--surface-2)",
              border: emoji === e ? "2px solid var(--accent)" : "1px solid var(--border)",
            }}
          >
            {e}
          </button>
        ))}
      </div>

      <label className="lbl">Nombre</label>
      <input
        className="field"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej. Meditar 10 minutos"
        autoFocus={!editing}
      />

      <label className="lbl">Programación</label>
      <div className="seg">
        <button className={mode === "flex" ? "on" : ""} onClick={() => setMode("flex")}>
          Flexible
        </button>
        <button className={mode === "days" ? "on" : ""} onClick={() => setMode("days")}>
          Días fijos
        </button>
      </div>

      {mode === "flex" ? (
        <>
          <div className="dim" style={{ fontSize: 12.5, margin: "10px 2px 7px" }}>
            {frequency} {frequency === 1 ? "día" : "días"} por semana, los que elijas sobre la marcha.
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5, 6, 7].map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className="pressable"
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: 11,
                  fontWeight: 700,
                  background: frequency === f ? "var(--accent)" : "var(--surface-2)",
                  color: frequency === f ? "var(--accent-ink)" : "var(--text-2)",
                  border: "1px solid var(--border)",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="dim" style={{ fontSize: 12.5, margin: "10px 2px 7px" }}>
            Solo estos días cuentan para la racha y el porcentaje.
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {DAY_LABELS.map((lbl, d) => (
              <button
                key={d}
                onClick={() => toggleDay(d)}
                className="pressable"
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: 11,
                  fontWeight: 700,
                  background: days.includes(d) ? "var(--accent)" : "var(--surface-2)",
                  color: days.includes(d) ? "var(--accent-ink)" : "var(--text-2)",
                  border: "1px solid var(--border)",
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
        </>
      )}

      <button className="btn primary block mt24" onClick={save} disabled={!valid} style={{ opacity: valid ? 1 : 0.5 }}>
        {editing ? "Guardar cambios" : "Crear hábito"}
      </button>
    </BottomSheet>
  );
}
