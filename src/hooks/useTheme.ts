import { useEffect, useState } from "react";

export type ThemeId = "verde" | "rosa" | "lila" | "morado";

export const THEMES: { id: ThemeId; name: string; bg: string; accent: string; dark: boolean }[] = [
  { id: "verde", name: "Bosque", bg: "#0e1013", accent: "#b0ea81", dark: true },
  { id: "rosa", name: "Pétalo", bg: "#fbf3f6", accent: "#f48fb1", dark: false },
  { id: "lila", name: "Lavanda", bg: "#f7f5fd", accent: "#a78bfa", dark: false },
  { id: "morado", name: "Nocturno", bg: "#0d0a16", accent: "#8b5cf6", dark: true },
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
