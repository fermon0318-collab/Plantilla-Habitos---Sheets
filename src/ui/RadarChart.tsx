interface Props {
  values: number[]; // uno por eje
  labels: string[];
  size?: number;
}

/** Radar / araña temático (usa var(--accent)). "Ritmo semanal". */
export function RadarChart({ values, labels, size = 240 }: Props) {
  const n = values.length;
  const cx = size / 2;
  const cy = size / 2;
  const pad = 34;
  const R = size / 2 - pad;
  const max = Math.max(1, ...values);
  const rings = [0.25, 0.5, 0.75, 1];

  // ángulo: arranca arriba (-90°) y va en sentido horario
  const angle = (i: number) => (-Math.PI / 2) + (i / n) * Math.PI * 2;
  const pt = (i: number, r: number) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];

  const poly = values.map((v, i) => pt(i, (v / max) * R).join(",")).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ display: "block", maxWidth: size, margin: "0 auto" }}>
      {/* anillos */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={Array.from({ length: n }, (_, i) => pt(i, R * ring).join(",")).join(" ")}
          fill="none"
          stroke="var(--border-hi)"
          strokeWidth="1"
        />
      ))}
      {/* radios */}
      {values.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />;
      })}
      {/* área */}
      <polygon points={poly} fill="var(--accent)" fillOpacity="0.22" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
      {/* vértices */}
      {values.map((v, i) => {
        const [x, y] = pt(i, (v / max) * R);
        return <circle key={i} cx={x} cy={y} r="3.5" fill="var(--accent)" stroke="var(--bg-2)" strokeWidth="1.5" />;
      })}
      {/* etiquetas */}
      {labels.map((lbl, i) => {
        const [x, y] = pt(i, R + 16);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="700"
            fill="var(--text-3)"
          >
            {lbl}
          </text>
        );
      })}
    </svg>
  );
}
