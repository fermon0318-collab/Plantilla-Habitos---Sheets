interface Props {
  values: number[]; // uno por día del mes
  height?: number;
}

/** Gráfico de área temático (var(--accent)). "Flujo de actividad diaria". */
export function ActivityChart({ values, height = 150 }: Props) {
  const W = 320;
  const H = height;
  const padL = 20;
  const padR = 8;
  const padT = 12;
  const padB = 22;
  const n = values.length;
  const maxV = Math.max(1, ...values);
  const yTicks = maxV <= 4 ? maxV : 4;

  const x = (i: number) => padL + (i / Math.max(1, n - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / maxV) * (H - padT - padB);

  const line = values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(n - 1).toFixed(1)} ${y(0)} L ${x(0).toFixed(1)} ${y(0)} Z`;

  const totalDone = values.reduce((a, b) => a + b, 0);
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block" }}
      role="img"
      aria-label={`Actividad diaria del mes: ${totalDone} marcas en total, máximo ${maxV} en un día`}
    >
      <defs>
        <linearGradient id="actFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.42" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* líneas guía horizontales */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = (maxV / yTicks) * i;
        const yy = y(v);
        return (
          <g key={i}>
            <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="var(--border)" strokeWidth="1" />
            <text x={padL - 4} y={yy + 3} textAnchor="end" fontSize="8" fill="var(--text-3)">
              {Math.round(v)}
            </text>
          </g>
        );
      })}

      <path d={area} fill="url(#actFill)" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />

      {/* puntos solo donde hay actividad, para no saturar */}
      {values.map((v, i) =>
        v > 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="2.6" fill="var(--accent)" stroke="var(--bg-2)" strokeWidth="1.2" /> : null
      )}

      {/* etiquetas de día cada ~5 */}
      {values.map((_, i) =>
        i === 0 || (i + 1) % 5 === 0 ? (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="var(--text-3)">
            {i + 1}
          </text>
        ) : null
      )}
    </svg>
  );
}
