import { useEffect, useState } from "react";

/**
 * Reloj sincronizado con el dispositivo. Se actualiza cada `intervalMs`
 * y también al volver a la pestaña (visibilitychange) para que la hora/fecha
 * nunca se quede congelada. Reemplaza la hora fija escrita a mano en el Sheet.
 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, intervalMs);
    const onVis = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", tick);
    };
  }, [intervalMs]);
  return now;
}
