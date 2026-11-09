/* Datos de ejemplo para la guía y el video (tools/demo.js y tools/video.js).
 *
 * Son INVENTADOS: empresa "Planta Demo" con un logo dibujado acá, personas ficticias y las
 * planillas genéricas que trae la app. No son parte de la app (la app arranca vacía): los
 * scripts los cargan en el navegador de la grabación, que es un perfil nuevo cada vez.
 *
 * El día de ejemplo tiene una planilla de cada tipo con algo para atender (un faltante en el
 * botiquín, dos "Mal" en un tablero, absorbentes para recargar) y un par de casillas sin
 * responder, para que el reporte muestre todo lo que sabe hacer. El día anterior tiene un
 * registro más, para que se note que cada día tiene su lista.
 */

const HOY = '2026-11-11';        // se lee igual en dd/mm y mm/dd
const AYER = '2026-11-10';
const NOMBRE = 'Laura Gómez';

// Logo de la empresa de ejemplo (600 x 180): una hoja dentro de un engranaje y el nombre.
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="180" viewBox="0 0 600 180">
  <g transform="translate(90 90)">
    <g fill="#0f5c6e">${Array.from({ length: 8 }, (_, i) => `<rect x="-11" y="-78" width="22" height="26" rx="4" transform="rotate(${i * 45})"/>`).join('')}</g>
    <circle r="62" fill="#0f5c6e"/><circle r="46" fill="#fff"/>
    <path d="M-22 26 C-30 -10 0 -34 30 -30 C30 4 8 30 -22 26 Z" fill="#2fa36b"/>
    <path d="M-22 26 L14 -14" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
  </g>
  <text x="180" y="88" font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="62" font-weight="700" fill="#0f5c6e">Planta</text>
  <text x="180" y="146" font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="50" font-weight="400" fill="#2fa36b" letter-spacing="6">DEMO</text>
</svg>`;

// Respuestas de cada registro. "todo" = respuesta por defecto de cada columna Sí/No o Bien/Mal;
// "excepto" = las celdas que cambian ('seccion.fila.columna': valor); "sinResponder" = celdas
// que quedan vacías. Las columnas de texto se completan en "excepto".
const REGISTROS = [
  { planilla: 'botiquines', fecha: HOY, hora: '08:10', cabecera: { puesto: 'Producción', reviso: NOMBRE },
    todo: { c1: 'si' },
    excepto: { 's1.r11.c1': 'no', 's1.r11.c2': 'Se pidió reposición a compras', 's1.r16.c1': 'no' } },
  { planilla: 'botiquines', fecha: HOY, hora: '08:25', cabecera: { puesto: 'Calidad', reviso: NOMBRE },
    todo: { c1: 'si' }, excepto: {} },
  { planilla: 'tableros', fecha: HOY, hora: '09:05',
    cabecera: { sector: 'Envasado', area: 'Línea 2', identificacion: 'TS-04', tipo: 'Seccional' },
    todo: { c1: 'bien' },
    excepto: {
      's1.r2.c1': 'mal', 's1.r2.c2': 'Colocar cartel de riesgo eléctrico', 's1.r2.c3': 'Mantenimiento',
      's2.r6.c1': 'mal', 's2.r6.c2': 'Cambiar la cerradura', 's2.r6.c3': 'J. Pérez',
      's3.r1.c1': 'si', 's3.r1.c2': 'Mantenimiento'
    },
    sinResponder: ['s1.r8.c1', 's1.r10.c1'],
    observaciones: 'El tablero queda abierto en el cambio de turno.', pie: { controlo: NOMBRE } },
  { planilla: 'absorbentes', fecha: HOY, hora: '09:40', cabecera: { reviso: NOMBRE },
    todo: { c1: 'si', c2: 'no', c3: 'si', c4: 'si', c5: 'si' },
    excepto: {
      's1.r3.c2': 'si', 's1.r3.c6': 'Queda menos de la mitad',
      's1.r9.c2': 'si',
      's1.r11.c4': 'no', 's1.r11.c6': 'Falta la tapa del tacho',
      's1.r13.c5': 'no'
    } },
  { planilla: 'botiquines', fecha: AYER, hora: '17:30', cabecera: { puesto: 'Depósito', reviso: NOMBRE },
    todo: { c1: 'si' }, excepto: {} }
];

// El registro que se carga en vivo en el GIF y el video (botiquín de Portería).
const NUEVO = { puesto: 'Portería', faltan: ['r5', 'r9'], observacion: 'Vencido' };

// La planilla que se arma en vivo con el constructor.
const PLANILLA_NUEVA = {
  titulo: 'Control de Matafuegos', codigo: 'REG-04',
  seccion: 'Matafuegos', columnas: [['Carga vigente', 'no'], ['Precinto', 'no']],
  items: 'Depósito de materias primas\nLínea de envasado 1\nLínea de envasado 2\nTaller de mantenimiento'
};

/* ---------- Carga en el navegador ---------- */
// Se ejecuta DENTRO de la página (page.evaluate): arma cada registro con la copia de su
// planilla (como hace la app al guardar), dibuja el logo en un canvas y deja todo en el
// localStorage con las claves de la app. Después hay que recargar.
async function cargarEnPagina(d) {
  const logo = await new Promise((ok, mal) => {
    const im = new Image();
    im.onload = () => { const c = document.createElement('canvas'); c.width = 600; c.height = 180;
      c.getContext('2d').drawImage(im, 0, 0); ok({ d: c.toDataURL('image/png'), w: 600, h: 180 }); };
    im.onerror = mal;
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(d.logo);
  });
  const planillas = JSON.parse(JSON.stringify(PLANILLAS_BASE));
  const registros = d.registros.map((r, i) => {
    const planilla = JSON.parse(JSON.stringify(planillas.find((p) => p.id === r.planilla)));
    const datos = {};
    planilla.secciones.forEach((sec) => sec.filas.forEach((fila) => sec.columnas.forEach((col) => {
      const v = r.todo[col.key];
      if (v && (col.tipo === 'siNo' || col.tipo === 'bienMal')) datos[sec.id + '.' + fila.key + '.' + col.key] = v;
    })));
    Object.assign(datos, r.excepto);
    (r.sinResponder || []).forEach((k) => { delete datos[k]; });
    // Hora local de Buenos Aires (UTC-3) en ISO, como la guarda la app
    const iso = new Date(r.fecha + 'T' + r.hora + ':00-03:00').toISOString();
    return { id: 'ej' + i, fecha: r.fecha, planillaId: planilla.id, planilla, cabecera: r.cabecera, datos,
      observaciones: r.observaciones || '', pie: r.pie || {}, creado: iso, modificado: iso };
  });
  localStorage.setItem('mashCheck.v1', JSON.stringify({ ultimoNombre: d.nombre, planillas, registros }));
  localStorage.setItem('mashCheck.marca.v1', JSON.stringify({ empresa: d.empresa, logo }));
}

const paquete = () => ({ logo: LOGO, nombre: NOMBRE, empresa: 'Planta Demo', registros: REGISTROS });

module.exports = { HOY, AYER, NOMBRE, NUEVO, PLANILLA_NUEVA, cargarEnPagina, paquete };
