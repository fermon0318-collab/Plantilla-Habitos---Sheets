const KEY = "habitos-earned-months";

/** Meses (YYYY-MM) cuyo árbol ya se ganó. Una vez ganado, no se pierde. */
export function loadEarned(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function saveEarned(set: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    /* almacenamiento no disponible */
  }
}
