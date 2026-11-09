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

## Publicación

Se publica en GitHub Pages, en un subdirectorio, por eso **todas las rutas son relativas** (`./archivo`). Paso a paso en [GUIA-PUBLICACION.md](GUIA-PUBLICACION.md).

## Notas de mantenimiento

- Al cambiar cualquier archivo de la app, subir `VERSION` en `sw.js` y volver a subir también `sw.js`; si no, los celulares siguen con la versión vieja.
- Si se agrega un archivo a la app, sumarlo también a `ARCHIVOS` en `sw.js`.
- Las fechas se calculan en hora local con `Store.hoy()` (nunca `toISOString()`, que usa UTC y rompe el turno tarde).
- Los datos viven en el dispositivo: hacer backup JSON con regularidad, porque borrar los datos del navegador los elimina.
