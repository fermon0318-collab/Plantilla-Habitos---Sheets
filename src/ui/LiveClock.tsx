import { useNow } from "../hooks/useNow";
import { fmtTime } from "./format";

/**
 * Reloj vivo aislado: se re-renderiza cada segundo por su cuenta, sin arrastrar
 * al resto de la app (que solo se actualiza por minuto).
 */
export function LiveClock() {
  const now = useNow(1000);
  return (
    <div className="chip" style={{ fontVariantNumeric: "tabular-nums" }}>
      {fmtTime(now)}
    </div>
  );
}
