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
const RED: [number, number, number] = [1, 0, 0]; // detalle (semilla/fruto) → acento profundo

function near(a: number[], b: number[], t = 0.06) {
  return Math.abs(a[0] - b[0]) < t && Math.abs(a[1] - b[1]) < t && Math.abs(a[2] - b[2]) < t;
}

/** rgb() / #hex → [r,g,b] normalizado 0..1. */
export function cssToRgb(css: string): [number, number, number] {
  const m = css.match(/(\d+(\.\d+)?)/g);
  if (css.startsWith("#")) {
    const h = css.slice(1);
    const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return [parseInt(n.slice(0, 2), 16) / 255, parseInt(n.slice(2, 4), 16) / 255, parseInt(n.slice(4, 6), 16) / 255];
  }
  if (m && m.length >= 3) return [+m[0] / 255, +m[1] / 255, +m[2] / 255];
  return [0.2, 0.8, 0.8];
}

/**
 * Recolorea una animación Lottie al color del tema:
 * - la línea teal de marca (y negros de contorno) → acento
 * - color secundario → acento más profundo
 * Devuelve una copia; no muta el original importado.
 */
function recolor(
  data: unknown,
  accent: [number, number, number],
  accentDeep: [number, number, number]
): unknown {
  const clone = JSON.parse(JSON.stringify(data));
  const walk = (o: any) => {
    if (Array.isArray(o)) {
      o.forEach(walk);
      return;
    }
    if (o && typeof o === "object") {
      // Relleno / trazo sólido
      if ((o.ty === "st" || o.ty === "fl") && o.c && Array.isArray(o.c.k)) {
        const k = o.c.k;
        if (k.length >= 3 && typeof k[0] === "number") {
          if (near(k, BRAND) || near(k, [0, 0, 0])) [k[0], k[1], k[2]] = accent;
          else if (near(k, BRAND2) || near(k, RED)) [k[0], k[1], k[2]] = accentDeep;
        }
      }
      // Efecto de control de color
      if (o.ty === 2 && o.v && Array.isArray(o.v.k)) {
        const k = o.v.k;
        if (k.length >= 3 && typeof k[0] === "number") {
          if (near(k, BRAND) || near(k, [0, 0, 0])) [k[0], k[1], k[2]] = accent;
          else if (near(k, BRAND2)) [k[0], k[1], k[2]] = accentDeep;
        }
      }
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
  /** color acento (hex o rgb). Si se omite, lee --accent del tema. */
  accent?: string;
  accentDeep?: string;
  frozen?: boolean; // muestra el último frame sin animar
}

export function LottieTree({
  stage,
  size = 120,
  loop = true,
  autoplay = true,
  accent,
  accentDeep,
  frozen = false,
}: Props) {
  const box = useRef<HTMLDivElement>(null);
  const anim = useRef<AnimationItem | null>(null);

  const colors = useMemo(() => {
    const root = getComputedStyle(document.documentElement);
    const a = cssToRgb(accent ?? root.getPropertyValue("--accent").trim());
    const d = cssToRgb(accentDeep ?? root.getPropertyValue("--accent-deep").trim());
    return { a, d };
  }, [accent, accentDeep, stage]);

  const data = useMemo(
    () => recolor(SOURCES[stage], colors.a, colors.d),
    [stage, colors]
  );

  useEffect(() => {
    if (!box.current) return;
    const item = lottie.loadAnimation({
      container: box.current,
      renderer: "svg",
      loop,
      autoplay: autoplay && !frozen,
      animationData: data as object,
    });
    anim.current = item;
    if (frozen) {
      item.addEventListener("DOMLoaded", () => item.goToAndStop(item.totalFrames - 1, true));
    }
    return () => item.destroy();
  }, [data, loop, autoplay, frozen]);

  return <div ref={box} style={{ width: size, height: size }} aria-hidden />;
}
