/*
 * planillas-base.js — Las 3 planillas MASH que vienen de fábrica.
 *
 * POR QUÉ ES UN ARCHIVO DE DATOS: la pantalla de carga NO sabe nada de botiquines ni de
 * tableros; solo sabe dibujar "una planilla" a partir de esta descripción. Así, agregar o
 * cambiar una planilla es cambiar datos, no código (y en la Fase 1b el constructor va a
 * generar exactamente esta misma forma de objeto).
 *
 * FORMA de una planilla:
 *   id, codigo, titulo
 *   cabecera:      campos de arriba            { key, label, tipo }   tipo: texto | opciones
 *   secciones:     tablas de ítems             { id, titulo, columnas[], filas[] }
 *   observaciones: true si lleva cuadro de notas al final
 *   pie:           campos de abajo (texto)     { key, label, tipo }
 *
 * TIPOS de columna: siNo | bienMal | check | texto
 *
 * En las columnas siNo, "problema" dice cuál respuesta hay que ATENDER: 'no', 'si' o 'ninguno'.
 * Hace falta porque el reporte no puede adivinarlo: en "Disponible" lo malo es el No, pero en
 * "Recargar (<50%)" lo malo es el Sí. (En bienMal lo malo siempre es "Mal".)
 *
 * Los puestos, ubicaciones y códigos son GENÉRICOS (el repo es público): cada planta los ajusta
 * con Editar o armando sus propias planillas.
 *
 * La FECHA no está acá: todos los registros tienen siempre una fecha (el día elegido).
 * Tampoco hay firma dibujada: por ahora alcanza con el nombre escrito (ver DIAGNOSTICO.md).
 */
const PLANILLAS_BASE = [
  {
    id: 'botiquines',
    codigo: 'REG-01',
    titulo: 'Control de Botiquines',
    // En la planilla de papel los 5 puestos eran columnas (80 casillas juntas). Con guantes y
    // una mano eso es inmanejable, así que acá el PUESTO es un dato de la cabecera: se carga
    // un registro por puesto (16 ítems). El reporte los junta después.
    cabecera: [
      { key: 'puesto', label: 'Puesto', tipo: 'opciones',
        opciones: ['Portería', 'Producción', 'Calidad', 'Comedor', 'Depósito'] },
      { key: 'reviso', label: 'Revisó', tipo: 'texto' }
    ],
    secciones: [{
      id: 's1',
      titulo: 'Elementos a chequear',
      columnas: [
        { key: 'c1', label: 'Disponible', tipo: 'siNo', problema: 'no' },
        { key: 'c2', label: 'Observaciones', tipo: 'texto' }
      ],
      filas: [
        { key: 'r1', label: 'Guantes descartables' },
        { key: 'r2', label: 'Gasas y vendas' },
        { key: 'r3', label: 'Apósitos' },
        { key: 'r4', label: 'Cinta adhesiva' },
        { key: 'r5', label: 'Yodo povidona' },
        { key: 'r6', label: 'Agua oxigenada' },
        { key: 'r7', label: 'Alcohol' },
        { key: 'r8', label: 'Jabón neutro (blanco)' },
        { key: 'r9', label: 'Alcohol en gel' },
        { key: 'r10', label: 'Crema para quemaduras' },
        { key: 'r11', label: 'Ibuprofeno' },
        { key: 'r12', label: 'Paracetamol' },
        { key: 'r13', label: 'Colirio' },
        { key: 'r14', label: 'Algodón' },
        { key: 'r15', label: 'Solución fisiológica' },
        { key: 'r16', label: 'Curitas' }
      ]
    }],
    observaciones: false,
    pie: []
  },

  {
    id: 'tableros',
    codigo: 'REG-02',
    titulo: 'Control de Tableros Eléctricos',
    cabecera: [
      { key: 'sector', label: 'Sector', tipo: 'texto' },
      { key: 'area', label: 'Área', tipo: 'texto' },
      { key: 'identificacion', label: 'Identificación', tipo: 'texto' },
      { key: 'tipo', label: 'Tipo', tipo: 'texto' }
    ],
    secciones: [
      {
        id: 's1',
        titulo: 'Estado general e instalación',
        columnas: [
          { key: 'c1', label: 'Condición', tipo: 'bienMal' },
          { key: 'c2', label: 'Acción a realizar', tipo: 'texto' },
          { key: 'c3', label: 'Responsable', tipo: 'texto' }
        ],
        filas: [
          { key: 'r1', label: 'Acceso despejado y cercano al área de trabajo' },
          { key: 'r2', label: 'Señalización de "Riesgo eléctrico"' },
          { key: 'r3', label: 'Señalización de la tensión de servicio' },
          { key: 'r4', label: 'Señalización de números de fases' },
          { key: 'r5', label: 'Tablero montado dentro de cajas/gabinetes/armarios' },
          { key: 'r6', label: 'Construido con materiales no higroscópicos ni combustibles' },
          { key: 'r7', label: 'Resistente a la corrosión o protegido contra ella' },
          { key: 'r8', label: 'Posee luces piloto que indiquen el funcionamiento de cada fase' },
          { key: 'r9', label: 'Posee tapa interior' },
          { key: 'r10', label: 'Instalación entre 0,6 y 2,0 m de altura' }
        ]
      },
      {
        id: 's2',
        titulo: 'Protecciones',
        columnas: [
          { key: 'c1', label: 'Condición', tipo: 'bienMal' },
          { key: 'c2', label: 'Acción a realizar', tipo: 'texto' },
          { key: 'c3', label: 'Responsable', tipo: 'texto' }
        ],
        filas: [
          { key: 'r1', label: '¿Tiene interruptores de corte o termomagnéticos automáticos?' },
          { key: 'r2', label: '¿Tiene interruptores diferenciales? (10 mA para 220 V y 30 mA para 380 V)' },
          { key: 'r3', label: 'El tablero cuenta con Puesta a Tierra (PAT)' },
          { key: 'r4', label: 'Todos los interruptores están debidamente identificados' },
          { key: 'r5', label: 'El cableado cuenta con recubrimiento y no está libre' },
          { key: 'r6', label: '¿Puede cerrarse fácilmente? ¿La cerradura está rígida o suelta?' }
        ]
      },
      {
        id: 's3',
        titulo: 'Trabajos a realizar',
        columnas: [
          { key: 'c1', label: 'Realizado', tipo: 'check' },
          { key: 'c2', label: 'Responsable', tipo: 'texto' }
        ],
        filas: [
          { key: 'r1', label: 'Limpieza' },
          { key: 'r2', label: 'Cableado desordenado' }
        ]
      }
    ],
    observaciones: true,
    pie: [
      { key: 'controlo', label: 'Controló', tipo: 'texto' }
    ]
  },

  {
    id: 'absorbentes',
    codigo: 'REG-03',
    titulo: 'Control de Absorbentes',
    cabecera: [
      { key: 'reviso', label: 'Revisó', tipo: 'texto' }
    ],
    secciones: [{
      id: 's1',
      titulo: 'Ubicaciones',
      columnas: [
        { key: 'c1', label: 'Disponible', tipo: 'siNo', problema: 'no' },
        { key: 'c2', label: 'Recargar (<50%)', tipo: 'siNo', problema: 'si' },
        { key: 'c3', label: 'Posee cartelería', tipo: 'siNo', problema: 'no' },
        { key: 'c4', label: 'Tapa', tipo: 'siNo', problema: 'no' },
        { key: 'c5', label: 'Limpio', tipo: 'siNo', problema: 'no' },
        { key: 'c6', label: 'Observaciones', tipo: 'texto' }
      ],
      filas: [
        { key: 'r1', label: 'Depósito de materias primas' },
        { key: 'r2', label: 'Depósito de producto terminado' },
        { key: 'r3', label: 'Línea de envasado 1' },
        { key: 'r4', label: 'Línea de envasado 2' },
        { key: 'r5', label: 'Línea de envasado 3' },
        { key: 'r6', label: 'Sala de formulación' },
        { key: 'r7', label: 'Laboratorio' },
        { key: 'r8', label: 'Taller de mantenimiento' },
        { key: 'r9', label: 'Compactadora' },
        { key: 'r10', label: 'Caldera' },
        { key: 'r11', label: 'Playón de carga' },
        { key: 'r12', label: 'Depósito de bidones e IBC' },
        { key: 'r13', label: 'Salida de emergencia' }
      ]
    }],
    observaciones: false,
    pie: []
  }
];
