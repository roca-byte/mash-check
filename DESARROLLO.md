# Desarrollo — MASH Check

Información técnica para quien quiera modificar o publicar la app. Para usarla, ver el
[README](README.md). El contexto para agentes de IA y las decisiones tomadas están en
[CLAUDE.md](CLAUDE.md) y [DIAGNOSTICO.md](DIAGNOSTICO.md).

## Tecnologías

HTML + CSS + JavaScript puro, **sin frameworks, sin npm y sin paso de build**. Scripts clásicos (sin módulos), un objeto global por archivo. Datos en `localStorage` (clave `mashCheck.v1`). Sin login ni backend.

## Estructura

```
├── index.html              # Estructura mínima: barra superior + <main id="vista">
├── manifest.json           # Datos de instalación PWA
├── sw.js                   # Service worker (red primero, caché sin conexión)
├── css/
│   └── styles.css          # Estilos mobile first e impresión
├── js/
│   ├── planillas-base.js   # Las planillas de fábrica como datos (PLANILLAS_BASE)
│   ├── store.js            # Capa de datos, constructor de planillas y respaldo (Store)
│   ├── marca.js            # Empresa y logo configurables (Marca)
│   ├── report.js           # Reporte del día y texto para compartir (Report)
│   └── app.js              # Pantallas y eventos
├── icons/                  # Íconos de la app
├── docs/
│   ├── GUIA.md             # Guía de uso con capturas
│   ├── img/                # Capturas y demo.gif (las genera tools/demo.js)
│   └── video/              # Video de demostración (lo genera tools/video.js)
├── tools/                  # Scripts de la guía y el video (no los carga la app)
├── GUIA-PUBLICACION.md     # Cómo publicar y actualizar en GitHub Pages
├── DIAGNOSTICO.md          # Análisis previo y decisiones
└── CLAUDE.md               # Contexto para agentes de IA
```

Orden de carga de los scripts: `planillas-base` → `store` → `marca` → `report` → `app`.

## Probar en la compu

Con `file://` el service worker no funciona: hay que servir la carpeta.

```bash
python3 -m http.server 8000
```

Abrir `http://localhost:8000`.

## Guía, GIF y video

Las capturas de `docs/img`, el GIF del README y el video de `docs/video` se generan con
Playwright sobre la app real, con datos de ejemplo **inventados** (`tools/ejemplo.js`: empresa
"Planta Demo" y personas ficticias, con las planillas de fábrica). Las páginas del PDF salen
de imprimir el reporte de la app. Volver a generarlos cada vez que cambie algo visible.

Hace falta Node, Playwright, ffmpeg y poppler-utils (`pdftoppm`):

```bash
npm i -g playwright && npx playwright install chromium
export NODE_PATH=$(npm root -g)   # el repo no tiene package.json
node tools/demo.js                # capturas y GIF (unos 20 s)
node tools/video.js               # video (unos 3 min)
```

- `tools/servidor.js`: sirve la app desde el repo en un puerto libre.
- `tools/ejemplo.js`: datos de ejemplo y cómo se cargan en el `localStorage` del navegador
  de la grabación. La app no los incluye: arranca vacía.
- `tools/video.js` graba con capturas seguidas a resolución doble, hace el scroll paso a paso
  desde JavaScript y descarta los cuadros que salen corridos (una marca fija de 3 px en la
  esquina lo delata).

## Publicación

Se publica en GitHub Pages, en un subdirectorio, por eso **todas las rutas son relativas** (`./archivo`). Paso a paso en [GUIA-PUBLICACION.md](GUIA-PUBLICACION.md).

## Notas de mantenimiento

- Al cambiar cualquier archivo de la app, subir `VERSION` en `sw.js` y volver a subir también `sw.js`; si no, los celulares siguen con la versión vieja.
- Si se agrega un archivo a la app, sumarlo también a `ARCHIVOS` en `sw.js`.
- Las fechas se calculan en hora local con `Store.hoy()` (nunca `toISOString()`, que usa UTC y rompe el turno tarde).
- Los datos viven en el dispositivo: hacer backup JSON con regularidad, porque borrar los datos del navegador los elimina.
