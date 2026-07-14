import { useState } from "react";
import { motion } from "framer-motion";
import { addMonths } from "date-fns";
import type { Habit, Check } from "../domain/types";
import {
  monthSummary,
  LEVEL_META,
  progressToNextLevel,
  achievements,
  perfectDaysInMonth,
  toDoneSet,
} from "../domain/logic";
import { fmtMonthYear, pct } from "../ui/format";
import { IconChevron, IconFlame, IconTrophy } from "../ui/icons";
import { LottieTree } from "../ui/LottieTree";
import { treeStage } from "../domain/logic";
import { useUI } from "../ui/uiContext";
import { THEMES } from "../hooks/useTheme";

interface Props {
  habits: Habit[];
  checks: Check[];
  now: Date;
}

export function Stats({ habits, checks, now }: Props) {
  const { theme } = useUI();
  const t = THEMES.find((x) => x.id === theme)!;
  const [offset, setOffset] = useState(0);
  const month = addMonths(now, offset);
  const s = monthSummary(habits, checks, month, now);
  const lvl = LEVEL_META[s.level];
  const ranked = [...s.perHabit].sort((a, b) => b.rate - a.rate);
  const bestStreakStat = [...s.perHabit].sort((a, b) => b.currentStreak - a.currentStreak)[0];
  const perfectDays = perfectDaysInMonth(habits, toDoneSet(checks), month, now);
  const medals = achievements(habits, checks, now);
  const unlockedCount = medals.filter((m) => m.unlocked).length;

  return (
    <div className="screen">
      <div className="eyebrow">Resumen del mes</div>
      <div className="row between">
        <h1 className="h1">Análisis</h1>
        <div className="row gap8">
          <button className="chip" onClick={() => setOffset((o) => o - 1)}>
            <IconChevron size={16} className="dim" style={{ transform: "rotate(180deg)" }} />
          </button>
          <button className="chip" onClick={() => setOffset(0)}>
            Hoy
          </button>
          <button className="chip" onClick={() => setOffset((o) => o + 1)}>
            <IconChevron size={16} className="dim" />
          </button>
        </div>
      </div>
      <div className="muted mt8" style={{ fontSize: 13, fontWeight: 600 }}>
        {fmtMonthYear(month)}
      </div>

      {/* Tiles */}
      <div className="row gap8 mt16">
        <Tile label="Progreso" value={pct(s.monthlyRate)} />
        <Tile label="Constancia" value={pct(s.averageConstancy)} />
        <Tile label="Días ⭐" value={String(perfectDays)} />
        <Tile label="Nivel" value={String(s.level)} />
      </div>

      {/* Nivel + siguiente */}
      <div className="card mt16" style={{ padding: 18 }}>
        <div className="row between">
          <div className="stack" style={{ gap: 2 }}>
            <span style={{ fontWeight: 800, fontSize: 17 }}>
              Nivel {s.level} · {lvl.name}
            </span>
            <span className="dim" style={{ fontSize: 13 }}>
              {lvl.blurb}
            </span>
          </div>
          <LottieTree
            key={`${theme}-${offset}-${treeStage(s.monthlyRate)}`}
            stage={treeStage(s.monthlyRate)}
            size={60}
            accent={t.accent}
            accentDeep={t.accentDeep}
            ink={t.ink}
          />
        </div>
        <div className="bar mt16">
          <motion.i
            initial={{ width: 0 }}
            animate={{
              width: `${(s.level === 5 ? 1 : progressToNextLevel(s.monthlyRate)) * 100}%`,
            }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="dim mt8" style={{ fontSize: 12 }}>
          {s.level === 5
            ? "¡Nivel máximo alcanzado!"
            : `Siguiente nivel en ${pct(1 - progressToNextLevel(s.monthlyRate))}`}
        </div>
      </div>

      {/* Más / menos constante */}
      <div className="row gap8 mt16" style={{ alignItems: "stretch" }}>
        <Highlight
          title="Más constante"
          habit={s.mostConstant?.habit}
          rate={s.mostConstant?.rate}
          accent="var(--accent)"
        />
        <Highlight
          title="Menos constante"
          habit={s.leastConstant?.habit}
          rate={s.leastConstant?.rate}
          accent="var(--danger)"
        />
      </div>

      {/* Racha destacada */}
      {bestStreakStat && bestStreakStat.currentStreak > 0 && (
        <div
          className="card mt16 row gap12"
          style={{
            padding: 16,
            alignItems: "center",
            border: "1px solid rgba(255, 212, 121, 0.25)",
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              display: "grid",
              placeItems: "center",
              background: "rgba(255, 212, 121, 0.12)",
            }}
          >
            <IconFlame size={24} className="streak" />
          </div>
          <div className="grow">
            <div style={{ fontWeight: 700 }}>Mejor racha actual</div>
            <div className="dim" style={{ fontSize: 13 }}>
              {bestStreakStat.habit.emoji} {bestStreakStat.habit.name}
            </div>
          </div>
          <div className="stack" style={{ alignItems: "flex-end" }}>
            <span className="streak" style={{ fontSize: 26, fontWeight: 800 }}>
              {bestStreakStat.currentStreak}
            </span>
            <span className="dim" style={{ fontSize: 11 }}>
              días
            </span>
          </div>
        </div>
      )}

      {/* Logros */}
      <div className="row between mt24" style={{ marginBottom: 12 }}>
        <span className="row gap8">
          <IconTrophy size={19} className="streak" />
          <h2 className="h2">Logros</h2>
        </span>
        <span className="dim" style={{ fontSize: 13, fontWeight: 600 }}>
          {unlockedCount}/{medals.length}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {medals.map((m, i) => (
          <motion.div
            key={m.id}
            className="card stack"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 22 }}
            style={{
              padding: "12px 6px",
              alignItems: "center",
              gap: 4,
              textAlign: "center",
              filter: m.unlocked ? "none" : "grayscale(1)",
              opacity: m.unlocked ? 1 : 0.4,
              border: m.unlocked ? `1px solid ${t.accent}4d` : undefined,
            }}
            title={m.desc}
          >
            <span style={{ fontSize: 24 }}>{m.emoji}</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, lineHeight: 1.15 }}>{m.name}</span>
          </motion.div>
        ))}
      </div>

      {/* Ranking por hábito */}
      <h2 className="h2 mt24" style={{ marginBottom: 12 }}>
        Constancia por hábito
      </h2>
      <div className="stack" style={{ gap: 12 }}>
        {ranked.map((st, i) => (
          <div key={st.habit.id}>
            <div className="row between" style={{ marginBottom: 6 }}>
              <span className="row gap8 grow" style={{ minWidth: 0 }}>
                <span style={{ fontSize: 17 }}>{st.habit.emoji}</span>
                <span className="ellipsis" style={{ fontWeight: 600, fontSize: 14 }}>
                  {st.habit.name}
                </span>
              </span>
              <span className="row gap8">
                {st.currentStreak > 0 && (
                  <span className="row streak" style={{ gap: 2, fontSize: 12, fontWeight: 700 }}>
                    <IconFlame size={12} /> {st.currentStreak}
                  </span>
                )}
                <span className="dim" style={{ fontSize: 12.5, fontWeight: 700 }}>
                  {st.completed}/{st.monthlyTarget}
                </span>
              </span>
            </div>
            <div className="bar">
              <motion.i
                initial={{ width: 0 }}
                animate={{ width: `${st.rate * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: `linear-gradient(90deg, ${st.habit.color}aa, ${st.habit.color})`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card grow" style={{ padding: "14px 12px" }}>
      <div style={{ fontWeight: 800, fontSize: 19 }}>{value}</div>
      <div className="dim" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>
        {label.toUpperCase()}
      </div>
    </div>
  );
}

function Highlight({
  title,
  habit,
  rate,
  accent,
}: {
  title: string;
  habit?: Habit;
  rate?: number;
  accent: string;
}) {
  return (
    <div className="card grow" style={{ padding: 16 }}>
      <div className="eyebrow" style={{ color: accent }}>
        {title}
      </div>
      {habit ? (
        <>
          <div style={{ fontSize: 26, marginTop: 6 }}>{habit.emoji}</div>
          <div className="ellipsis mt8" style={{ fontWeight: 700, fontSize: 14 }}>
            {habit.name}
          </div>
          <div className="dim" style={{ fontSize: 13 }}>
            {pct(rate ?? 0)} constancia
          </div>
        </>
      ) : (
        <div className="dim mt8" style={{ fontSize: 13 }}>
          Sin datos
        </div>
      )}
    </div>
  );
}
