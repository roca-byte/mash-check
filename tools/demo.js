/* Genera las capturas de la guía (docs/img/*.png) y el recorrido animado (docs/img/demo.gif).
 *
 * Uso:  node tools/demo.js
 * Necesita Playwright, ffmpeg y pdftoppm (poppler-utils). Carga en el navegador los datos de
 * ejemplo de tools/ejemplo.js, que son inventados: no hay datos de ninguna empresa real.
 * Las páginas del PDF salen de imprimir el reporte de la app (page.pdf con su @media print).
 * Volver a correrlo cada vez que cambie algo visible de la app o del reporte.
 */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { servidor, RAIZ } = require('./servidor');
const Ejemplo = require('./ejemplo');

const SALIDA = path.join(RAIZ, 'docs', 'img');
const CELULAR = { width: 390, height: 844 };
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mash-demo-'));

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const srv = servidor().listen(0);
  const url = 'http://127.0.0.1:' + srv.address().port + '/';
  // --lang: los campos de fecha toman el idioma del navegador (dd/mm/aaaa).
  const browser = await chromium.launch({ args: ['--lang=es-AR'] });
  const capturas = [];

  async function contexto(opciones) {
    const ctx = await browser.newContext(Object.assign({
      viewport: CELULAR, deviceScaleFactor: 2, serviceWorkers: 'block', colorScheme: 'light',
      locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires', isMobile: true, hasTouch: true
    }, opciones || {}));
    const page = await ctx.newPage();
    // Reloj fijo en el 11/11 (se lee igual en dd/mm y mm/dd): la app abre en "hoy".
    await page.clock.setFixedTime(new Date(Ejemplo.HOY + 'T10:30:00-03:00'));
    page.on('dialog', d => d.accept());
    page.on('pageerror', e => { throw e; });
    // Sin ventana de impresión: "Exportar PDF" no hace nada acá (el PDF se saca con page.pdf).
    await page.addInitScript(() => { window.print = () => {}; });
    // La app arranca vacía: se cargan los ejemplos en su localStorage y se recarga.
    await page.goto(url);
    await page.waitForFunction(() => typeof PLANILLAS_BASE !== 'undefined');
    await page.evaluate(Ejemplo.cargarEnPagina, Ejemplo.paquete());
    await page.reload();
    await page.waitForSelector('.tarjeta');
    return { ctx, page };
  }

  // Pantalla visible; con "desde" (y "hasta"), el bloque entre esos dos elementos; con "alto",
  // ese bloque recortado a esa altura. La barra de Guardar es fija: se suelta para la foto.
  async function foto(page, nombre, desde, hasta, alto) {
    await page.waitForTimeout(350);
    const destino = path.join(SALIDA, nombre + '.png');
    const estilo = await page.addStyleTag({ content: '.barra-guardar { position: static !important; }' });
    if (!desde) await page.screenshot({ path: destino });
    else {
      const caja = sel => page.locator(sel).first().evaluate(e => { const r = e.getBoundingClientRect(); return { y: r.top + scrollY, fin: r.bottom + scrollY }; });
      const a = await caja(desde), b = hasta ? await caja(hasta) : a;
      const alto2 = alto || (b.fin - a.y + 12);
      await page.screenshot({ path: destino, fullPage: true, clip: { x: 0, y: Math.max(0, a.y - 10), width: CELULAR.width, height: alto2 + 10 } });
    }
    await estilo.evaluate(e => e.remove());
    capturas.push(nombre);
  }
  // Imprime el reporte que está en pantalla y pasa las páginas pedidas a PNG
  async function paginasPDF(page, paginas) {
    const pdf = path.join(TMP, 'r' + Date.now() + '.pdf');
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: pdf, format: 'A4', preferCSSPageSize: true });
    await page.emulateMedia({ media: 'screen' });
    paginas.forEach(([n, nombre]) => {
      const base = path.join(TMP, 'p');
      execFileSync('pdftoppm', ['-r', '100', '-png', '-singlefile', '-f', String(n), '-l', String(n), pdf, base]);
      fs.copyFileSync(base + '.png', path.join(SALIDA, nombre + '.png'));
    });
    return +/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [pdf]).toString())[1];
  }
  const opcion = (fila, valor) => `.fila:has(.fila-titulo:text-is("${fila}")) .opc[data-v="${valor}"]`;

  // ── Inicio ──
  let { ctx, page } = await contexto();
  await foto(page, '01-inicio');
  await foto(page, '02-registros', 'h2:has-text("Registros del día")', '[data-act="reporte"]');

  // ── Formulario: un botiquín nuevo a medio cargar ──
  await page.click('[data-act="nueva"][data-id="botiquines"]');
  await page.selectOption('select[data-k="puesto"]', Ejemplo.NUEVO.puesto);
  const filas = await page.locator('.fila-titulo').allTextContents();
  for (const [i, f] of filas.slice(0, 8).entries()) await page.click(opcion(f, i === 4 ? 'no' : 'si'));
  await page.locator('.fila').nth(4).locator('input[data-campo="datos"]').fill(Ejemplo.NUEVO.observacion);
  await foto(page, '03-formulario', 'h2', null, 1300);
  await page.click('[data-act="cancelar"]');

  // ── Tablero: Bien / Mal con acción y responsable ──
  await page.click('.tarjeta:has-text("Tableros") [data-act="editar"]');
  await foto(page, '04-tablero', 'h3:has-text("Estado general")', null, 1050);
  await page.click('[data-act="cancelar"]');

  // ── Reporte del día ──
  await page.click('[data-act="reporte"]');
  await foto(page, '05-reporte', '.no-print', null, 1500);
  const total = await paginasPDF(page, [[1, '07-pdf-dia']]);
  // PDF de una sola planilla
  await page.click('[data-act="imprimir-uno"]:has-text("Tableros")');
  await foto(page, '08-solo-una', '.no-print', '.r-registro h3');
  await paginasPDF(page, [[1, '09-pdf-una']]);
  await page.click('[data-act="ver-todo"]');
  await page.click('[data-act="volver"]');

  // ── Constructor de planillas ──
  const P = Ejemplo.PLANILLA_NUEVA;
  await page.click('[data-act="pl-nueva"]');
  await page.fill('[data-bcampo="titulo"]', P.titulo);
  await page.fill('[data-bcampo="codigo"]', P.codigo);
  await page.fill('[data-lista="secciones"][data-prop="titulo"]', P.seccion);
  await page.fill('[data-lista="columnas"][data-prop="label"]', P.columnas[0][0]);
  await page.click('[data-act="b-agrega"][data-lista="columnas"]');
  await page.locator('[data-lista="columnas"][data-prop="label"]').nth(1).fill(P.columnas[1][0]);
  await page.fill('[data-lista="secciones"][data-prop="filasTexto"]', P.items);
  await foto(page, '10-editor', 'h2', null, 1700);
  await page.click('[data-act="pl-guardar"]');
  await foto(page, '11-empresa-respaldo', 'h2:has-text("Copia de seguridad")', '.marca-logo');
  await ctx.close();

  // ── Recorrido animado: cargar un botiquín y ver el reporte ──
  const carpetaVideo = path.join(TMP, 'gif');
  ({ ctx, page } = await contexto({ deviceScaleFactor: 1, recordVideo: { dir: carpetaVideo, size: CELULAR } }));
  await page.waitForTimeout(800);
  await page.click('[data-act="nueva"][data-id="botiquines"]');
  await page.waitForTimeout(600);
  await page.selectOption('select[data-k="puesto"]', Ejemplo.NUEVO.puesto);
  await page.waitForTimeout(500);
  const filasGif = await page.locator('.fila-titulo').allTextContents();
  for (const [i, f] of filasGif.slice(0, 7).entries()) {
    await page.locator(opcion(f, i === 4 ? 'no' : 'si')).scrollIntoViewIfNeeded();
    await page.click(opcion(f, i === 4 ? 'no' : 'si'));
    await page.waitForTimeout(260);
  }
  await page.waitForTimeout(500);
  await page.click('[data-act="guardar"]');
  await page.waitForTimeout(900);
  await page.click('[data-act="reporte"]');
  await page.waitForTimeout(1200);
  await page.locator('.r-alerta').evaluate(e => e.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  await page.waitForTimeout(2200);
  const video = await page.video().path();
  await ctx.close();
  await browser.close();
  srv.close();

  // webm → GIF liviano (6 cuadros por segundo, 320 px; solo se guarda lo que cambia).
  const gif = path.join(SALIDA, 'demo.gif');
  const filtro = 'fps=6,scale=320:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle';
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-vf', filtro, gif]);
  fs.rmSync(TMP, { recursive: true, force: true });

  console.log('Capturas:', capturas.join(', '), '+ 2 páginas de PDF (el del día tiene ' + total + ')');
  console.log('GIF:', path.relative(RAIZ, gif), Math.round(fs.statSync(gif).size / 1024) + ' KB');
})().catch(e => { console.error('✗', e.message); process.exit(1); });
