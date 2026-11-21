/* Graba el video corto "Cómo armar una planilla desde cero": docs/video/crear-planilla.mp4
 *
 * Uso:  node tools/video-planilla.js
 * Está pensado para mandárselo a quien arma planillas en planta: paso a paso, con un control de
 * matafuegos (tools/ejemplo.js, PLANILLA_NUEVA). Muestra título, datos de arriba, la diferencia
 * entre ítems y columnas (lo que más se confunde), los tipos de columna, guardar, cargar un
 * control con la planilla nueva y verlo en el reporte. Necesita Playwright y ffmpeg.
 * Volver a correrlo si cambia algo visible del editor de planillas.
 */
const { grabarVideo } = require('./grabador');
const Ejemplo = require('./ejemplo');

const P = Ejemplo.PLANILLA_NUEVA;
const C = Ejemplo.CONTROL_MATAFUEGOS;

// Lo que dice el cartel al elegir cada tipo de columna.
const EXPLICA_TIPO = {
  siNo: ['Sí / No', 'Elegís qué respuesta es un problema: sale en rojo en el reporte'],
  bienMal: ['Bien / Mal', '"Mal" siempre queda para atender'],
  texto: ['Texto', 'Para anotar lo que haga falta en cada ítem']
};

grabarVideo('crear-planilla.mp4', async (h) => {
  const { page, espera, cartel, placa, ver, tocar, tipear, elegir, titulo } = h;
  const lineas = (texto) => texto.split('\n');
  // En un cuadro de texto, Enter baja de línea: se tipea todo seguido.
  const tipearLineas = async (sel, texto) => {
    await ver(sel);
    await page.locator(sel).first().click();
    await page.keyboard.type(texto, { delay: 55 });
    await espera(600);
  };

  // ── Apertura ──
  await placa(titulo + '<p><b>Cómo armar una planilla desde cero</b></p><p>Ejemplo: control de matafuegos</p>', 4500);
  await placa('', 900);

  // ── 1 · Nueva planilla ──
  await cartel('1 · Tocá "+ Nueva planilla"', 'Está abajo de la lista de planillas', 800);
  await tocar('[data-act="pl-nueva"]', 1000);

  // ── 2 · Título ──
  await cartel('2 · Poné el título', 'El código es opcional', 500);
  await tipear('[data-bcampo="titulo"]', P.titulo);
  await tipear('[data-bcampo="codigo"]', P.codigo);
  await espera(600);

  // ── 3 · Datos de arriba ──
  await cartel('3 · Datos de arriba', 'Se completan una vez por control. "Revisó" ya viene y recuerda tu nombre', 2600);
  await tocar('[data-act="b-agrega"][data-lista="cabecera"]', 800);
  await tipear('input[data-lista="cabecera"][data-i="1"]', P.dato.label);
  await cartel('¿Se elige de una lista?', 'Cambiá a "Elegir de una lista" y escribí una opción por línea', 600);
  await elegir('select[data-lista="cabecera"][data-i="1"]', 'opciones');
  await tipearLineas('textarea[data-lista="cabecera"][data-i="1"]', P.dato.opciones);
  await espera(800);

  // ── 4 · La sección: ítems y columnas ──
  await cartel('4 · La sección es la tabla de la planilla', 'Ítems = renglones (cada matafuego) · Columnas = lo que se responde', 600);
  await ver('h3:has-text("Secciones")', 'start');
  await espera(3800);
  await tipear('[data-lista="secciones"][data-prop="titulo"]', P.seccion);

  // ── 5 · Columnas ──
  await cartel('5 · Columnas: qué se revisa de cada matafuego', 'Una columna por pregunta, con su tipo', 600);
  for (const [i, [nombre, tipo]] of P.columnas.entries()) {
    if (i) await tocar('[data-act="b-agrega"][data-lista="columnas"]', 800);
    await tipear('[data-lista="columnas"][data-prop="label"] >> nth=' + i, nombre);
    // Una columna nueva ya viene como Sí/No: solo se cambia si es de otro tipo.
    if (tipo !== 'siNo') await elegir('select[data-lista="columnas"][data-i="' + i + '"][data-prop="tipo"]', tipo);
    if (i === 0 || tipo !== 'siNo') {
      const [t, d] = EXPLICA_TIPO[tipo];
      await cartel('Tipo: ' + t, d, 600);
      await ver('select[data-lista="columnas"][data-i="' + i + '"][data-prop="tipo"]');
      await espera(2400);
    }
  }

  // ── 6 · Ítems ──
  await cartel('6 · Los ítems: cada matafuego, uno por línea', 'Van TODOS en este cuadro. "+ Agregar columna" suma una pregunta, no un ítem', 600);
  await ver('[data-prop="filasTexto"]');
  await espera(2400);
  await tipearLineas('[data-prop="filasTexto"]', P.items);
  await espera(1200);

  // ── 7 · Final ──
  await cartel('7 · Si querés, observaciones al final', 'Y "Datos del final", por ejemplo quién controló', 600);
  await tocar('[data-bcampo="observaciones"]', 1800);

  // ── 8 · Guardar ──
  await cartel('8 · Guardar planilla', 'Si falta algo, la app te avisa qué', 600);
  await page.click('[data-act="pl-guardar"]');
  await espera(1000);
  await cartel('Ya está en tu lista', 'Se puede editar, duplicar o borrar cuando quieras', 600);
  await ver('.planilla:has-text("' + P.titulo + '")');
  await espera(2400);

  // ── 9 · Usarla ──
  await cartel('9 · Así se carga un control', 'Un renglón por matafuego, con botones grandes', 600);
  await tocar('.planilla:has-text("' + P.titulo + '") [data-act="nueva"]', 1000);
  await elegir('select[data-k="campo1"]', C.sector);
  const items = lineas(P.items);
  for (const [fi, item] of items.entries()) {
    const fila = 's1.r' + (fi + 1) + '.';
    const vencido = item === C.vencido;
    await tocar('.grupo[data-k="' + fila + 'c1"] .opc[data-v="' + (vencido ? 'no' : 'si') + '"]', 300);
    await tocar('.grupo[data-k="' + fila + 'c2"] .opc[data-v="si"]', 300);
    await tocar('.grupo[data-k="' + fila + 'c3"] .opc[data-v="bien"]', vencido ? 300 : 500);
    if (vencido) await tipear('input[data-k="' + fila + 'c4"]', C.observacion);
  }
  await page.click('[data-act="guardar"]');
  await espera(1000);

  // ── 10 · Reporte ──
  await cartel('Y aparece en el reporte del día', 'Lo que está en rojo queda arriba, para atender', 600);
  await tocar('[data-act="reporte"]', 1000);
  await ver('.r-alerta', 'start');
  await espera(3600);
  await cartel('', '', 300);

  // ── Cierre ──
  await placa(titulo + '<p>Resumen</p><p><b>Ítems</b> = lo que se revisa, uno por línea<br><b>Columnas</b> = lo que se responde de cada ítem</p>', 6000);
}).catch(e => { console.error('✗', e.message); process.exit(1); });
