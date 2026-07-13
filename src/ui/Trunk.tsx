interface Props {
  size?: number;
  /** Mes no ganado: tronco cortado, apagado. */
  color?: string;
}

/** Tronco desnudo para los meses no completados en el jardín. */
export function Trunk({ size = 80, color = "var(--text-3)" }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      {/* montículo de tierra */}
      <ellipse cx="50" cy="82" rx="26" ry="7" fill={color} opacity="0.18" />
      {/* tronco cortado */}
      <path
        d="M42 82 L44 50 Q44 46 47 46 L53 46 Q56 46 56 50 L58 82 Z"
        fill={color}
        opacity="0.55"
      />
      {/* anillos del corte */}
      <ellipse cx="50" cy="47" rx="6.5" ry="2.4" fill={color} opacity="0.8" />
      <ellipse cx="50" cy="47" rx="3.5" ry="1.3" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      {/* rama seca */}
      <path
        d="M55 58 Q64 54 66 47"
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
