import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import type { Habit, Check } from "../domain/types";
import { garden, dateKey, WIN_THRESHOLD, type GardenMonth } from "../domain/logic";
import { loadEarned, saveEarned } from "../domain/earned";
import { LottieTree } from "../ui/LottieTree";
import { Trunk } from "../ui/Trunk";
import { cap, pct } from "../ui/format";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useUI } from "../ui/uiContext";
import { THEMES } from "../hooks/useTheme";
import { IconSparkles } from "../ui/icons";

interface Props {
  habits: Habit[];
  checks: Check[];
  now: Date;
}

export function Garden({ habits, checks, now }: Props) {
  const { theme } = useUI();
  const t = THEMES.find((x) => x.id === theme)!;
  const earned = useMemo(() => loadEarned(), []);
  // Recalcula solo cuando cambia el día o los datos, no en cada tic del reloj.
  const months = useMemo(
    () => garden(habits, checks, now, earned),
    [habits, checks, dateKey(now), earned]
  );
  // "Fija" los árboles ganados: una vez ganado un mes, queda registrado para siempre.
  useEffect(() => {
    let changed = false;
    for (const m of months) {
      if (m.won && !earned.has(m.key)) {
        earned.add(m.key);
        changed = true;
      }
    }
    if (changed) saveEarned(earned);
  }, [months, earned]);
  const current = months.find((m) => m.isCurrent)!;
  const past = months.filter((m) => !m.isCurrent).reverse();
  const wonCount = months.filter((m) => m.won).length;
  const remaining = Math.max(0, WIN_THRESHOLD - current.rate);

  return (
    <div className="screen">
      <div className="eyebrow">Tu jardín</div>
      <div className="row between">
        <h1 className="h1">Jardín</h1>
        <span className="chip">
          🌳 {wonCount} {wonCount === 1 ? "árbol" : "árboles"}
        </span>
      </div>

      {/* Árbol del mes en progreso */}
      <div className="card mt16" style={{ padding: "22px 20px", overflow: "hidden" }}>
        <div className="stack" style={{ alignItems: "center", gap: 8 }}>
          <motion.div
            key={current.stage + theme}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <LottieTree
              stage={current.stage}
              size={170}
              loop
              accent={t.accent}
              accentDeep={t.accentDeep}
              ink={t.ink}
            />
          </motion.div>

          <div className="h2">Árbol de {cap(format(current.date, "MMMM", { locale: es }))}</div>

          {current.rate >= WIN_THRESHOLD ? (
            <div className="row gap8 chip perfect" style={{ marginTop: 2 }}>
              <IconSparkles size={14} /> ¡Ganado! Se plantará el 1º del próximo mes
            </div>
          ) : (
            <div className="dim" style={{ fontSize: 13, textAlign: "center" }}>
              Te falta <b style={{ color: "var(--accent)" }}>{pct(remaining)}</b> para ganar este árbol
            </div>
          )}

          <div className="bar" style={{ width: "100%", maxWidth: 240, marginTop: 6 }}>
            <motion.i
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(1, current.rate / WIN_THRESHOLD) * 100}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="dim" style={{ fontSize: 11.5 }}>
            {pct(current.rate)} de {pct(WIN_THRESHOLD)} necesario
          </div>
        </div>
      </div>

      {/* Historial del jardín */}
      <div className="row between mt24" style={{ marginBottom: 12 }}>
        <h2 className="h2">Tu jardín mes a mes</h2>
      </div>

      {past.length === 0 ? (
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 30 }}>🌱</div>
          <div className="dim mt8" style={{ fontSize: 13.5 }}>
            Completá este mes y tu primer árbol echará raíces aquí.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {past.map((m, i) => (
            <GardenPlot key={m.key} m={m} index={i} accent={t.accent} accentDeep={t.accentDeep} ink={t.ink} />
          ))}
        </div>
      )}
    </div>
  );
}

function GardenPlot({
  m,
  index,
  accent,
  accentDeep,
  ink,
}: {
  m: GardenMonth;
  index: number;
  accent: string;
  accentDeep: string;
  ink: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="card stack"
      style={{
        padding: "12px 6px 10px",
        alignItems: "center",
        gap: 4,
        border: m.won ? `1px solid ${accent}44` : "1px solid var(--border)",
      }}
    >
      <div style={{ height: 78, display: "grid", placeItems: "center" }}>
        {m.won ? (
          <LottieTree stage="tree" size={78} accent={accent} accentDeep={accentDeep} ink={ink} />
        ) : (
          <Trunk size={70} />
        )}
      </div>
      <div style={{ fontWeight: 700, fontSize: 12.5 }}>
        {cap(format(m.date, "MMM", { locale: es }))} {format(m.date, "yy")}
      </div>
      <div className="dim" style={{ fontSize: 10.5 }}>
        {m.won ? "Ganado" : `${pct(m.rate)}`}
      </div>
    </motion.div>
  );
}
