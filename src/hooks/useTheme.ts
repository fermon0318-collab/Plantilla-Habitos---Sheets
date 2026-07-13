import { useEffect, useState } from "react";

export type ThemeId = "verde" | "rosa" | "lila" | "morado";

export const THEMES: {
  id: ThemeId;
  name: string;
  bg: string;
  accent: string;
  accentDeep: string;
  /** Color de las líneas "neutras" del icono (negro original en claros, claro en oscuros). */
  ink: string;
  dark: boolean;
}[] = [
  { id: "verde", name: "Bosque", bg: "#0e1013", accent: "#b0ea81", accentDeep: "#7bc95a", ink: "#eef1f4", dark: true },
  { id: "rosa", name: "Pétalo", bg: "#fbf3f6", accent: "#f48fb1", accentDeep: "#ec6f9d", ink: "#2a1c24", dark: false },
  { id: "lila", name: "Lavanda", bg: "#f7f5fd", accent: "#a78bfa", accentDeep: "#8b6cf0", ink: "#221b34", dark: false },
  { id: "morado", name: "Nocturno", bg: "#0d0a16", accent: "#a78bfa", accentDeep: "#8b5cf6", ink: "#efecf7", dark: true },
];

const KEY = "habitos-theme";

/** Tema visual persistido en el dispositivo; aplica data-theme y el color de la barra del sistema. */
export function useTheme() {
  const [theme, setTheme] = useState<ThemeId>(() => {
    const saved = localStorage.getItem(KEY) as ThemeId | null;
    return saved && THEMES.some((t) => t.id === saved) ? saved : "verde";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "verde") delete root.dataset.theme;
    else root.dataset.theme = theme;
    localStorage.setItem(KEY, theme);
    const meta = THEMES.find((t) => t.id === theme)!;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", meta.bg);
  }, [theme]);

  return { theme, setTheme };
}
