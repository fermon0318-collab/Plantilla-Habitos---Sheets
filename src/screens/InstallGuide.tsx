import { useState } from "react";
import { BottomSheet } from "../ui/Sheet";
import type { InstallPlatform } from "../hooks/useInstallPrompt";

interface Props {
  open: boolean;
  onClose: () => void;
  initialPlatform: InstallPlatform;
}

const TABS: { id: "ios" | "android" | "desktop"; label: string }[] = [
  { id: "ios", label: "iPhone" },
  { id: "android", label: "Android" },
  { id: "desktop", label: "Compu" },
];

export function InstallGuide({ open, onClose, initialPlatform }: Props) {
  const [tab, setTab] = useState<"ios" | "android" | "desktop">(
    initialPlatform === "ios" || initialPlatform === "android" ? initialPlatform : "desktop"
  );

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="h2" style={{ marginBottom: 4 }}>
        Instalar la app
      </h2>
      <p className="muted" style={{ fontSize: 13.5, margin: "0 0 14px" }}>
        Elegí tu dispositivo para ver los pasos.
      </p>

      <div className="seg" style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ios" && (
        <Steps
          items={[
            <>
              Abrí <b>habit-day.netlify.app</b> en <b>Safari</b> (tiene que ser Safari, no funciona desde Chrome en iPhone).
            </>,
            <>
              Tocá el botón <b>Compartir</b> (el cuadrado con la flecha hacia arriba), en la barra inferior.
            </>,
            <>
              Deslizá la lista de opciones y elegí <b>"Agregar a inicio"</b> (Add to Home Screen).
            </>,
            <>
              Confirmá el nombre y tocá <b>"Agregar"</b> arriba a la derecha.
            </>,
            <>Listo — el ícono queda en tu pantalla de inicio, se abre a pantalla completa y funciona sin internet.</>,
          ]}
        />
      )}

      {tab === "android" && (
        <Steps
          items={[
            <>
              Abrí <b>habit-day.netlify.app</b> en <b>Chrome</b>.
            </>,
            <>
              Tocá el botón <b>Instalar app</b> más abajo — Chrome te va a mostrar un cartel para confirmar.
            </>,
            <>
              Si no aparece el cartel, tocá los <b>tres puntos</b> (⋮) arriba a la derecha y elegí <b>"Instalar app"</b> o <b>"Añadir a pantalla de inicio"</b>.
            </>,
            <>Confirmá tocando "Instalar".</>,
            <>Listo — queda como una app más, con su propio ícono y sin la barra del navegador.</>,
          ]}
        />
      )}

      {tab === "desktop" && (
        <Steps
          items={[
            <>
              Abrí <b>habit-day.netlify.app</b> en <b>Chrome</b> o <b>Edge</b>.
            </>,
            <>
              Buscá el ícono de instalar (una pantalla con una flecha) en la <b>barra de direcciones</b>, a la derecha.
            </>,
            <>
              Si no lo ves, abrí el menú <b>⋮</b> y elegí <b>"Instalar Hábitos Personales…"</b>.
            </>,
            <>Confirmá en el cartel que aparece.</>,
            <>Listo — se abre en su propia ventana, como un programa instalado.</>,
          ]}
        />
      )}
    </BottomSheet>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} className="card row gap12" style={{ padding: "12px 14px", alignItems: "flex-start" }}>
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "var(--accent)",
              color: "var(--accent-ink)",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              fontWeight: 800,
              flex: "none",
              marginTop: 1,
            }}
          >
            {i + 1}
          </span>
          <span style={{ fontSize: 14, lineHeight: 1.45 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}
