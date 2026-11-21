/* Graba el video de demostración: docs/video/mash-check-demo.mp4
 *
 * Uso:  node tools/video.js
 * Necesita Playwright, ffmpeg y pdftoppm (poppler-utils). Recorre la app en un celular con los
 * datos de ejemplo de tools/ejemplo.js (inventados): cargar un botiquín, un tablero con Bien/Mal,
 * el reporte del día, el PDF del día y el de una sola planilla, compartir el resumen, armar una
 * planilla propia, empresa y respaldo, y el uso sin señal. Lleva carteles que explican cada paso,
 * un círculo en cada toque, visores para el PDF y el resumen, y placas de apertura y cierre.
 * Volver a correrlo cada vez que cambie algo visible de la app o del reporte.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { grabarVideo } = require('./grabador');
const Ejemplo = require('./ejemplo');

// PDF del reporte: se imprime en OTRA pestaña con los mismos datos (así la grabación no ve el
// cambio a modo impresión) y se muestra en el visor. solo = texto del botón de una planilla.
async function verPDF(h, solo, recorrido) {
  const { page, ctx, url, carpeta, espera } = h;
  const p2 = await ctx.newPage();
  await p2.goto(url);
  await p2.click('[data-act="reporte"]');
  if (solo) await p2.click('[data-act="imprimir-uno"]:has-text("' + solo + '")');
  await p2.emulateMedia({ media: 'print' });
  const pdf = path.join(carpeta, 'r' + Date.now() + '.pdf');
  await p2.pdf({ path: pdf, format: 'A4', preferCSSPageSize: true });
  await p2.close();
  const total = +/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [pdf]).toString())[1];
  const html = Array.from({ length: Math.min(total, 3) }, (_, i) => {
    const base = path.join(carpeta, 'pg' + i);
    execFileSync('pdftoppm', ['-r', '110', '-jpeg', '-singlefile', '-f', String(i + 1), '-l', String(i + 1), pdf, base]);
    return '<img src="data:image/jpeg;base64,' + fs.readFileSync(base + '.jpg').toString('base64') + '" alt="">';
  }).join('');
  await page.evaluate(h => window.vVisor(h), html);
  await espera(2000);
  for (const [y, ms] of recorrido) { await page.evaluate(v => window.vScroll(v, 900, document.getElementById('v-visor')), y); await espera(ms); }
  await page.evaluate(() => window.vVisor(null));
  await espera(600);
}

grabarVideo('mash-check-demo.mp4', async (h) => {
  const { page, ctx, espera, cartel, placa, ver, tocar, tipear, elegir, arriba, opcion, titulo } = h;

  // ── Apertura ──
  await placa(titulo + '<p>Los controles de Seguridad e Higiene desde el celular, con el reporte del día listo para mandar.</p><p><b>Gratis, sin cuenta y sin señal.</b></p>', 5500);
  await placa('', 900);
  await cartel('Tus planillas y lo que cargaste hoy', 'Botiquines, tableros, absorbentes… y las que armes', 1000);
  await ver('h2:has-text("Registros del día")', 'start');
  await espera(2200);
  await arriba();

  // ── 1 · Cargar un botiquín ──
  await cartel('1 · Tocá la planilla que vas a controlar', 'Un registro por puesto de botiquín', 800);
  await tocar('[data-act="nueva"][data-id="botiquines"]', 900);
  await elegir('select[data-k="puesto"]', Ejemplo.NUEVO.puesto);
  await cartel('Tu nombre se completa solo', 'Queda el último que usaste', 600);
  await ver('input[data-k="reviso"]');
  await espera(1600);
  await cartel('Botones grandes: se usan con guantes', 'Rojo = hay que atenderlo', 600);
  const filas = await page.locator('.fila-titulo').allTextContents();
  for (const [i, f] of filas.entries()) {
    const no = Ejemplo.NUEVO.faltan.includes('r' + (i + 1));
    await tocar(opcion(f, no ? 'no' : 'si'), no ? 700 : 220);
    if (no) {
      await page.locator('.fila').nth(i).locator('input[data-campo="datos"]').click();
      await page.keyboard.type(Ejemplo.NUEVO.observacion, { delay: 70 });
      await espera(500);
    }
  }
  await cartel('Guardar está siempre a mano', 'Abajo de todo, aunque la planilla sea larga', 600);
  await page.click('[data-act="guardar"]');
  await espera(1200);
  await ver('.tarjeta:has-text("Portería")');
  await espera(1600);

  // ── 2 · Tablero: Bien / Mal ──
  await cartel('2 · En los tableros: Bien o Mal', 'Con la acción a realizar y el responsable', 800);
  await tocar('.tarjeta:has-text("Tableros") [data-act="editar"]', 900);
  await ver('.fila:has-text("Riesgo eléctrico")');
  await espera(2400);
  await ver('.fila:has-text("cerrarse fácilmente")');
  await espera(2000);
  await page.click('[data-act="cancelar"]');
  await espera(900);

  // ── 3 · Reporte del día ──
  await cartel('3 · Ver reporte del día', 'Arriba, todo lo que hay que atender', 600);
  await tocar('[data-act="reporte"]', 900);
  await ver('.r-alerta', 'start');
  await espera(2600);
  await ver('.r-pend');
  await cartel('Y lo que quedó sin responder', 'Para que no se escape ninguna casilla', 2600);
  await arriba();

  // ── 4 · PDF del día y de una sola planilla ──
  await cartel('4 · Exportar PDF del día', 'En el celular: “Guardar como PDF”', 600);
  await tocar('[data-act="imprimir"]', 300);
  await verPDF(h, null, [[560, 2400], [1150, 2200]]);
  await cartel('¿Muchas planillas? Sacá el PDF de una sola', 'Con sus propios ítems a atender', 600);
  await ver('.solo-una');
  await espera(1400);
  await tocar('[data-act="imprimir-uno"]:has-text("Tableros")', 900);
  await verPDF(h, 'Tableros', [[420, 2600]]);
  await cartel('El archivo sale con la planilla y la fecha', 'Ej.: MASH Control de Tableros Eléctricos … 11-11-2026', 2600);
  await tocar('[data-act="ver-todo"]', 900);

  // ── 5 · Compartir ──
  await cartel('5 · Compartir resumen', 'Un texto corto para WhatsApp o mail', 600);
  await ver('[data-act="compartir"]');
  const texto = await page.evaluate(() => Report.texto(Store.hoy(), Store.registrosDelDia(Store.hoy())));
  await page.locator('[data-act="compartir"]').click();
  await espera(500);
  await page.evaluate(t => window.vVisor('<div class="burbuja">' + t.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</div>'), texto);
  await espera(2400);
  await page.evaluate(() => window.vScroll(700, 2000, document.getElementById('v-visor')));
  await espera(2200);
  await page.evaluate(() => window.vVisor(null));
  await espera(500);
  await tocar('[data-act="volver"]', 900);

  // ── 6 · Planilla propia ──
  const P = Ejemplo.PLANILLA_NUEVA;
  await cartel('6 · Armá tus propias planillas', 'O editá y duplicá las que vienen', 600);
  await tocar('[data-act="pl-nueva"]', 900);
  await tipear('[data-bcampo="titulo"]', P.titulo);
  await tipear('[data-bcampo="codigo"]', P.codigo);
  await tipear('[data-lista="secciones"][data-prop="titulo"]', P.seccion);
  await tipear('[data-lista="columnas"][data-prop="label"]', P.columnas[0][0]);
  await cartel('Elegís qué respuesta es un problema', 'En "Carga vigente", el No', 600);
  await ver('select[data-prop="problema"]');
  await espera(1800);
  await tocar('[data-act="b-agrega"][data-lista="columnas"]', 700);
  await tipear('[data-lista="columnas"][data-prop="label"] >> nth=1', P.columnas[1][0]);
  await cartel('Los ítems van en el cuadro de abajo', 'Uno por línea. "+ Agregar columna" suma otra pregunta, no un ítem', 400);
  await ver('[data-prop="filasTexto"]');
  await page.locator('[data-prop="filasTexto"]').click();
  await page.keyboard.type(P.items, { delay: 45 });
  await espera(700);
  await page.click('[data-act="pl-guardar"]');
  await espera(900);
  await cartel('Lista para usar', '', 600);
  await ver('.planilla:has-text("Matafuegos")');
  await espera(2000);

  // ── 7 · Empresa y respaldo ──
  await cartel('7 · Tu empresa, tu logo y la copia de seguridad', 'Los datos quedan solo en tu celular: descargá un respaldo seguido', 600);
  await ver('h2:has-text("Copia de seguridad")', 'start');
  await espera(3200);

  // ── Sin señal ──
  await arriba();
  await ctx.setOffline(true);
  await cartel('¿Sin señal en planta? Funciona igual', 'Después de abrirla una vez con internet', 3000);
  await ctx.setOffline(false);
  await cartel('', '', 300);

  // ── Cierre ──
  await placa(titulo + '<p>Usala gratis en</p><p><b>roca-byte.github.io/mash-check</b></p><p>Instalala en el celular desde el navegador</p>', 4800);

}).catch(e => { console.error('✗', e.message); process.exit(1); });
