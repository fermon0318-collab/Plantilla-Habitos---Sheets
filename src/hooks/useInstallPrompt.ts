import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallPlatform = "ios" | "android" | "desktop" | "other";

function detectPlatform(): InstallPlatform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Macintosh|Windows|Linux/.test(ua)) return "desktop";
  return "other";
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

/**
 * Captura el evento nativo de instalación (Android/Chrome/Edge/Desktop) y expone
 * el estado de plataforma para mostrar instrucciones manuales donde no existe ese
 * evento (iOS Safari nunca lo dispara: ahí solo queda Compartir → Agregar a inicio).
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [platform] = useState<InstallPlatform>(detectPlatform);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return choice.outcome;
  }, [deferred]);

  return {
    platform,
    installed,
    /** true cuando el navegador soporta el diálogo nativo (Android/Chrome/Edge/Desktop). */
    canPrompt: !!deferred,
    promptInstall,
  };
}
