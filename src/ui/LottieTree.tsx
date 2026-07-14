import { useEffect, useMemo, useRef } from "react";
import lottie, { type AnimationItem } from "lottie-web";
import seed from "../assets/trees/seed.json";
import sprout from "../assets/trees/sprout.json";
import plant from "../assets/trees/plant.json";
import tree from "../assets/trees/tree.json";

export type TreeStage = "seed" | "sprout" | "plant" | "tree";

const SOURCES: Record<TreeStage, unknown> = { seed, sprout, plant, tree };

/** El teal de marca original de los assets; lo mapeamos al acento del tema. */
const BRAND: [number, number, number] = [0.2, 0.8, 0.8];
const BRAND2: [number, number, number] = [0.15, 0.64, 0.8];
const RED: [number, number, number] = [1, 0, 0]; // detalle de color → acento profundo
const BLACK: [number, number, number] = [0, 0, 0]; // líneas neutras → "ink" del tema

function near(a: number[], b: number[], t = 0.06) {
  return Math.abs(a[0] - b[0]) < t && Math.abs(a[1] - b[1]) < t && Math.abs(a[2] - b[2]) < t;
}

/** rgb() / #hex → [r,g,b] normalizado 0..1. */
export function cssToRgb(css: string): [number, number, number] {
  const s = css.trim();
  if (s.startsWith("#")) {
    const h = s.slice(1);
    const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return [parseInt(n.slice(0, 2), 16) / 255, parseInt(n.slice(2, 4), 16) / 255, parseInt(n.slice(4, 6), 16) / 255];
  }
  const m = s.match(/(\d+(\.\d+)?)/g);
  if (m && m.length >= 3) return [+m[0] / 255, +m[1] / 255, +m[2] / 255];
  return [0.2, 0.8, 0.8];
}

/**
 * Recolorea una animación Lottie respetando la lógica original del icono:
 * - línea de color (teal de marca) → acento del tema
 * - color secundario / detalle rojo → acento profundo
 * - líneas neutras (negro) → "ink" del tema (negro en temas claros, claro en oscuros,
 *   para que sigan siendo visibles sobre cualquier fondo)
 * - rellenos crema/blanco (maceta/tierra) → se dejan como el original
 */
function recolor(
  data: unknown,
  accent: [number, number, number],
  accentDeep: [number, number, number],
  ink: [number, number, number]
): unknown {
  const clone = JSON.parse(JSON.stringify(data));
  const apply = (k: number[]) => {
    if (k.length < 3 || typeof k[0] !== "number") return;
    if (near(k, BRAND)) [k[0], k[1], k[2]] = accent;
    else if (near(k, BRAND2) || near(k, RED)) [k[0], k[1], k[2]] = accentDeep;
    else if (near(k, BLACK)) [k[0], k[1], k[2]] = ink;
  };
  const walk = (o: any) => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === "object") {
      if ((o.ty === "st" || o.ty === "fl") && o.c && Array.isArray(o.c.k)) apply(o.c.k);
      if (o.ty === 2 && o.v && Array.isArray(o.v.k)) apply(o.v.k);
      Object.values(o).forEach(walk);
    }
  };
  walk(clone);
  return clone;
}

interface Props {
  stage: TreeStage;
  size?: number;
  loop?: boolean;
  autoplay?: boolean;
  accent: string;
  accentDeep: string;
  ink: string;
  /** Cambiar este valor vuelve a reproducir la animación desde el inicio (p. ej. al marcar un hábito). */
  replayKey?: string | number;
}

export function LottieTree({
  stage,
  size = 120,
  loop = false,
  autoplay = true,
  accent,
  accentDeep,
  ink,
  replayKey,
}: Props) {
  const box = useRef<HTMLDivElement>(null);
  const anim = useRef<AnimationItem | null>(null);

  const data = useMemo(
    () => recolor(SOURCES[stage], cssToRgb(accent), cssToRgb(accentDeep), cssToRgb(ink)),
    [stage, accent, accentDeep, ink]
  );

  useEffect(() => {
    if (!box.current) return;
    const item = lottie.loadAnimation({
      container: box.current,
      renderer: "svg",
      loop,
      autoplay,
      animationData: data as object,
    });
    anim.current = item;
    return () => {
      item.destroy();
      anim.current = null;
    };
  }, [data, loop, autoplay]);

  // Reproducir de nuevo SOLO cuando replayKey crece (al marcar, no al desmarcar).
  const prevKey = useRef<number | null>(null);
  useEffect(() => {
    const k = typeof replayKey === "number" ? replayKey : null;
    if (prevKey.current !== null && k !== null && k > prevKey.current) {
      anim.current?.goToAndPlay(0, true);
    }
    prevKey.current = k;
  }, [replayKey]);

  return <div ref={box} style={{ width: size, height: size }} aria-hidden />;
}
