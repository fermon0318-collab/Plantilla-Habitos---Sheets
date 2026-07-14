import { Suspense, lazy, useState } from "react";
import { motion } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./domain/db";
import { useNow } from "./hooks/useNow";
import { useTheme } from "./hooks/useTheme";
import { Today } from "./screens/Today";
import { Week } from "./screens/Week";
import { Month } from "./screens/Month";
import { Stats } from "./screens/Stats";

// El jardín arrastra lottie-web + los assets; se carga solo al abrir su pestaña.
const Garden = lazy(() => import("./screens/Garden").then((m) => ({ default: m.Garden })));
import { IconToday, IconWeek, IconMonth, IconStats, IconGarden } from "./ui/icons";
import { UIProvider } from "./ui/uiContext";
import type { Habit, Check, Task } from "./domain/types";

type Tab = "hoy" | "semana" | "mes" | "jardin" | "stats";

const TABS: { id: Tab; label: string; Icon: typeof IconToday }[] = [
  { id: "hoy", label: "Hoy", Icon: IconToday },
  { id: "semana", label: "Semana", Icon: IconWeek },
  { id: "mes", label: "Mes", Icon: IconMonth },
  { id: "jardin", label: "Jardín", Icon: IconGarden },
  { id: "stats", label: "Análisis", Icon: IconStats },
];

export function App() {
  const [tab, setTab] = useState<Tab>("hoy");
  // El reloj vivo (segundos) vive en un componente aparte; aquí solo necesitamos
  // la fecha, que cambia como mucho una vez por minuto → menos recálculos.
  const now = useNow(60000);
  const { theme, setTheme } = useTheme();

  const habits = useLiveQuery(
    () => db.habits.orderBy("order").toArray(),
    []
  ) as Habit[] | undefined;
  const checks = useLiveQuery(() => db.checks.toArray(), []) as Check[] | undefined;
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) as Task[] | undefined;

  const ready = habits && checks && tasks;

  if (!ready) {
    return (
      <div className="app">
        <div className="screen" style={{ opacity: 0.5 }}>
          Cargando…
        </div>
      </div>
    );
  }

  return (
    <UIProvider habits={habits!} month={now} theme={theme} setTheme={setTheme}>
    <div className="app">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === "hoy" ? (
            <Today habits={habits!} checks={checks!} tasks={tasks!} now={now} />
          ) : tab === "semana" ? (
            <Week habits={habits!} checks={checks!} now={now} />
          ) : tab === "mes" ? (
            <Month habits={habits!} checks={checks!} now={now} />
          ) : tab === "jardin" ? (
            <Suspense
              fallback={
                <div className="screen" style={{ opacity: 0.5 }}>
                  Cargando tu jardín…
                </div>
              }
            >
              <Garden habits={habits!} checks={checks!} now={now} />
            </Suspense>
          ) : (
            <Stats habits={habits!} checks={checks!} now={now} />
          )}
        </motion.div>

      <nav className="tabbar">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {tab === id && (
              <motion.span layoutId="tabdot" className="tab-dot" transition={{ duration: 0.3 }} />
            )}
            <motion.span
              animate={{ scale: tab === id ? 1.15 : 1, y: tab === id ? -2 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              style={{ display: "grid", placeItems: "center" }}
            >
              <Icon className="tab-ico" />
            </motion.span>
            {label}
          </button>
        ))}
      </nav>
    </div>
    </UIProvider>
  );
}
