# Hábitos Personales — PWA

App de seguimiento de hábitos convertida desde la plantilla Google Sheets
"HÁBITOS PERSONALES INTERACTIVO". Mobile-first, local-first (IndexedDB),
instalable como app en el celular, sin cuenta ni servidor.

## Stack
Vite · React 18 · TypeScript · Dexie (IndexedDB) · Framer Motion · date-fns · vite-plugin-pwa

## Correr en desarrollo
```bash
npm install
npm run dev        # http://localhost:5173
```

## Build de producción
```bash
npm run build      # genera dist/ (incluye service worker PWA)
npm run preview    # sirve dist/ localmente
```

## Instalar en el celular (PWA)
1. Desplegá `dist/` en cualquier hosting con HTTPS (Vercel, Netlify, GitHub Pages).
2. Abrí la URL en el teléfono:
   - **Android (Chrome):** menú ⋮ → "Instalar app" / "Añadir a pantalla de inicio".
   - **iPhone (Safari):** botón Compartir → "Añadir a pantalla de inicio".
3. Se instala con ícono propio, abre a pantalla completa y funciona offline.

## Funcionalidades
- **Hoy**: reloj/fecha del dispositivo, anillo de progreso mensual, nivel con árbol
  que crece (🌱→🌲), checkboxes con microanimación y háptica, rachas 🔥, tareas con
  cuenta regresiva, confetti al lograr un **día perfecto** ⭐.
- **Semana**: matriz editable Lun–Dom con meta semanal; los días no programados
  de cada hábito se ven atenuados.
- **Mes**: calendario con heatmap de cumplimiento; editor por día.
- **Estadísticas**: hábito más/menos constante, promedio, días perfectos,
  **8 logros desbloqueables**, ranking por hábito.
- **Comandos rápidos** (heredados del Sheet): copiar mes anterior, desmarcar un
  hábito, limpiar mes, exportar respaldo JSON, gestión de hábitos.
- **Programación por hábito**: flexible (N días/semana) o **días fijos** (L·X·V…);
  la racha y el % respetan el calendario de cada hábito.

## Lógica de negocio (origen: el Sheet)
- Niveles 1–5 con umbrales 20/40/60/85 % (celda `AE3` del Sheet original).
- % mensual ponderado por meta de frecuencia (decisión de producto sobre el Sheet,
  que usaba 28 días fijos).
- Análisis más/menos constante (`AX35/AX36`) y promedio (`AX37`) replicados.
- Se arreglaron las fórmulas rotas del Sheet (`#REF!` del resumen diario, árbol de
  productividad vacío, referencias desalineadas de DATOS ANUALES).
