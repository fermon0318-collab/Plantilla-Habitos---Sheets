import { useEffect, useRef } from "react";

/**
 * Cierra un panel/diálogo abierto con la tecla Escape o con el botón "atrás"
 * del navegador/Android (en vez de salir de la app).
 *
 * No intenta "limpiar" la entrada de historial que empuja al abrir llamando a
 * `history.back()` cuando el cierre viene de un botón/scrim: esa llamada resultó
 * bloqueando el hilo principal más de 1s en pruebas (probablemente por el viaje
 * de ida y vuelta del evento popstate), lo que congelaba brevemente la animación
 * de cierre. Es preferible que, en el caso raro de cerrar con un botón y después
 * tocar "atrás", el usuario deba tocarlo una vez más (patrón común en apps reales)
 * a que CADA cierre normal quede con este riesgo de traba.
 */
export function useDismissable(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    window.history.pushState({ __dismissable: true }, "");
    const onPopState = () => onCloseRef.current();
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPopState);
    };
  }, [open]);
}
