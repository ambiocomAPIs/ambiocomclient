import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { registerDejaVuFont } from "../../../assets/fonts/DejaVuSans.js";

const PAGE_WIDTH_MM = 210;
const PAGE_CONTENT_BOTTOM = 278;
const TABLE_MARGIN_X = 14;
const TABLE_CONTENT_WIDTH =
  PAGE_WIDTH_MM - TABLE_MARGIN_X * 2;

const PDF_COLORS = {
  blue: [41, 128, 185],
  blueDark: [30, 64, 175],
  purple: [126, 34, 206],
  green: [22, 101, 52],
  orange: [180, 83, 9],
  slate: [71, 85, 105],
  text: [30, 41, 59],
  border: [203, 213, 225],
  soft: [248, 250, 252],
};

const turnosShorted = [
  {
    value: "TurnoMañana(6:00-14:00)",
    short: "T1-0614",
    priority: 1,
  },
  {
    value: "TurnoTarde(14:00-22:00)",
    short: "T2-1422",
    priority: 2,
  },
  {
    value: "TurnoNoche(22:00-06:00)",
    short: "T3-2206",
    priority: 3,
  },
  {
    value: "TurnoAdministrativo(07:30-17:30)",
    short: "TA-07:17",
    priority: 4,
  },
  {
    value: "Turno12Horas(06:00-18:00)",
    short: "T12-0618",
    priority: 5,
  },
  {
    value: "Turno12Horas(18:00-06:00)",
    short: "T12-1806",
    priority: 6,
  },
];

function drawGradientRect(
  doc,
  x,
  y,
  width,
  height,
  startColor,
  endColor
) {
  const steps = 100;

  const [r1, g1, b1] = startColor;
  const [r2, g2, b2] = endColor;

  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;

    const r = Math.round(
      r1 + (r2 - r1) * ratio
    );

    const g = Math.round(
      g1 + (g2 - g1) * ratio
    );

    const b = Math.round(
      b1 + (b2 - b1) * ratio
    );

    doc.setFillColor(r, g, b);

    doc.rect(
      x + (width / steps) * i,
      y,
      width / steps + 1,
      height,
      "F"
    );
  }
}

const normalizeDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date
    .toISOString()
    .split("T")[0];
};

const getPriority = (turnoValue) => {
  const turno = turnosShorted.find(
    (item) =>
      item.value === turnoValue
  );

  return turno
    ? turno.priority
    : Infinity;
};

const tieneNumero = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value));

const obtenerPrimerNumeroDisponible = (...values) => {
  for (const value of values) {
    if (tieneNumero(value)) {
      return Number(value);
    }
  }

  return null;
};

const formatearNumero = (
  value,
  decimals = 2
) => {
  if (!tieneNumero(value)) {
    return "—";
  }

  return Number(value).toLocaleString(
    "es-CO",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }
  );
};

const formatearPorcentaje = (
  value,
  decimals = 2
) => {
  if (!tieneNumero(value)) {
    return "—";
  }

  return Number(value).toLocaleString(
    "es-CO",
    {
      style: "percent",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }
  );
};

const asegurarEspacio = (
  doc,
  currentY,
  requiredHeight = 40
) => {
  if (
    currentY + requiredHeight <=
    PAGE_CONTENT_BOTTOM
  ) {
    return currentY;
  }

  doc.addPage();

  return 20;
};

const dibujarSeparadorBloque = (
  doc,
  currentY,
  title,
  subtitle,
  fillColor
) => {
  const y = asegurarEspacio(
    doc,
    currentY,
    24
  );

  doc.setFillColor(...fillColor);
  doc.roundedRect(
    TABLE_MARGIN_X,
    y,
    TABLE_CONTENT_WIDTH,
    15,
    2,
    2,
    "F"
  );

  doc.setFont(
    "DejaVuSans",
    "bold"
  );
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    String(title || "").toUpperCase(),
    TABLE_MARGIN_X + 5,
    y + 5.7,
    {
      maxWidth:
        TABLE_CONTENT_WIDTH - 10,
    }
  );

  if (subtitle) {
    doc.setFont(
      "DejaVuSans",
      "normal"
    );
    doc.setFontSize(7.3);
    doc.text(
      subtitle,
      TABLE_MARGIN_X + 5,
      y + 11.2,
      {
        maxWidth:
          TABLE_CONTENT_WIDTH - 10,
      }
    );
  }

  return y + 21;
};

const construirAnalisisLocal = (
  resumenTotalizadores
) => {
  if (
    resumenTotalizadores?.sinDatos
  ) {
    return {
      estado: "SIN DATOS",

      observaciones: [],

      alertas: [
        resumenTotalizadores?.mensaje ||
          "No se encontraron datos de totalizadores para el día anterior.",
      ],
    };
  }

  const totals =
    resumenTotalizadores?.totals ||
    {};

  const observaciones = [];
  const alertas = [];

  if (
    tieneNumero(
      totals.renConsumo
    ) &&
    tieneNumero(
      totals.prodTotal
    )
  ) {
    const diferencia =
      Number(totals.prodTotal) -
      Number(totals.renConsumo);

    if (diferencia > 0) {
      observaciones.push(
        `La producción superó el consumo REN en ${formatearNumero(
          Math.abs(diferencia)
        )}.`
      );
    } else if (diferencia < 0) {
      observaciones.push(
        `El consumo REN superó la producción en ${formatearNumero(
          Math.abs(diferencia)
        )}.`
      );
    } else {
      observaciones.push(
        "El consumo REN y la producción presentaron el mismo resultado."
      );
    }
  }

  const errorTotalizadores =
    totals.errorTotalizadoresPct;

  if (
    tieneNumero(
      errorTotalizadores
    )
  ) {
    const error = Math.abs(
      Number(errorTotalizadores)
    );

    if (error <= 0.02) {
      observaciones.push(
        `La diferencia entre totalizadores fue estable, con un error de ${formatearPorcentaje(
          error
        )}.`
      );
    } else if (error <= 0.05) {
      observaciones.push(
        `La diferencia entre totalizadores fue moderada, con un error de ${formatearPorcentaje(
          error
        )}.`
      );
    } else {
      alertas.push(
        `Se detectó una diferencia relevante entre totalizadores de ${formatearPorcentaje(
          error
        )}.`
      );
    }
  }

  const errorProdTk402 =
    totals.errorProdTk402Pct ??
    totals.errorTrasladoPct;

  if (
    tieneNumero(
      errorProdTk402
    )
  ) {
    const error = Math.abs(
      Number(errorProdTk402)
    );

    if (error > 0.05) {
      alertas.push(
        `La diferencia Producción/TK402 alcanzó ${formatearPorcentaje(
          error
        )}. Se recomienda revisar lecturas y factores.`
      );
    } else {
      observaciones.push(
        `La conciliación Producción/TK402 cerró con un error de ${formatearPorcentaje(
          error
        )}.`
      );
    }
  }

  if (
    tieneNumero(
      totals.errorRenNivelesPct
    )
  ) {
    const error = Math.abs(
      Number(
        totals.errorRenNivelesPct
      )
    );

    if (error > 0.05) {
      alertas.push(
        `La diferencia REN/Niveles alcanzó ${formatearPorcentaje(
          error
        )}. Se recomienda revisar niveles y factores de los tanques.`
      );
    } else {
      observaciones.push(
        `La conciliación REN/Niveles cerró con un error de ${formatearPorcentaje(
          error
        )}.`
      );
    }
  }

  const movimientosNegativos = [
    [
      "Consumo REN",
      totals.renConsumo,
    ],
    [
      "Producción",
      totals.prodTotal,
    ],
    [
      "TK402A/B",
      totals.tk402Total,
    ],
    [
      "REN por niveles",
      totals.renNivelTotal,
    ],
    [
      "Traslado 801A/B",
      totals.ab801Total,
    ],
  ].filter(
    ([, value]) =>
      tieneNumero(value) &&
      Number(value) < 0
  );

  movimientosNegativos.forEach(
    ([label, value]) => {
      alertas.push(
        `${label} presentó un resultado negativo de ${formatearNumero(
          value
        )}.`
      );
    }
  );

  if (
    !observaciones.length &&
    !alertas.length
  ) {
    observaciones.push(
      "No se identificaron alertas operativas en la información disponible."
    );
  }

  return {
    estado:
      alertas.length > 0
        ? "REQUIERE REVISIÓN"
        : "NORMAL",

    observaciones,
    alertas,
  };
};

export async function exportarBitacoraPDF(
  headerData,
  notes,
  resumenTotalizadores = null,
  resumenIngresosCombustibles = null,
  resumenConsumosCombustibles = null,
  resumenRecepcionesAlcohol = null,
  resumenDespachosAlcohol = null,
  resumenNivelesTanques = null
) {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  registerDejaVuFont(doc);

  doc.setFont(
    "times",
    "normal"
  );

  const logoUrl =
    "/LogoCompany/logoambiocomsinfondo.png";

  const logoBase64 =
    await toBase64(logoUrl);

  doc.addImage(
    logoBase64,
    "PNG",
    9,
    7,
    60,
    18
  );

  drawGradientRect(
    doc,
    0,
    28,
    210,
    12,
    [41, 128, 185],
    [46, 204, 113]
  );

  doc.setFontSize(14);

  doc.setTextColor(
    255,
    255,
    255
  );

  doc.text(
    "BITÁCORA DE TURNOS - SUPERVISORES",
    105,
    36,
    {
      align: "center",
    }
  );

  doc.setLineWidth(0.5);

  doc.line(
    10,
    42,
    200,
    42
  );

  doc.setFontSize(12);

  doc.setTextColor(
    0,
    0,
    0
  );

  doc.text(
    `Fecha: ${
      headerData.fecha || ""
    }`,
    167,
    20
  );

  /*
   * Encabezado original de la bitácora.
   * Se conserva como listado vertical, sin tablas ni tarjetas.
   */
  doc.text(
    `Turno: ${
      headerData.turno || ""
    }`,
    20,
    50
  );

  doc.text(
    `Supervisor: ${
      headerData.supervisor || ""
    }`,
    20,
    58
  );

  doc.text(
    `Operario Destilería: ${
      headerData.op_destileria ||
      ""
    }`,
    20,
    66
  );

  doc.text(
    `Operario de calderas: ${
      headerData.op_caldera ||
      ""
    }`,
    20,
    74
  );

  doc.text(
    `Auxiliar de calderas: ${
      headerData.aux_caldera ||
      ""
    }`,
    20,
    82
  );

  doc.text(
    `Operario de Aguas: ${
      headerData.op_aguas || ""
    }`,
    20,
    90
  );

  doc.text(
    `Analista de Laboratorio 1: ${
      headerData.analista1 ||
      ""
    }`,
    20,
    98
  );

  doc.text(
    `Analista de Laboratorio 2: ${
      headerData.analista2 ||
      ""
    }`,
    20,
    106
  );

  const currentDate =
    normalizeDate(
      headerData.fecha
    );

  const currentTurno = String(
    headerData.turno || ""
  ).trim();

  const currentPriority =
    getPriority(currentTurno);

  let startY = 120;

  if (
    Object.keys(notes || {}).length ||
    resumenTotalizadores
  ) {
    startY = dibujarSeparadorBloque(
      doc,
      startY,
      "Reportes de bitácora",
      "Novedades del turno y balance operativo de totalizadores",
      PDF_COLORS.blue
    );
  }

  Object.keys(
    notes || {}
  ).forEach((section) => {
    const sectionNotes = (
      notes?.[section] || []
    ).filter((note) => {
      const noteDate =
        normalizeDate(
          note.date
        );

      const noteTurno = String(
        note.turno || ""
      ).trim();

      const notePriority =
        getPriority(noteTurno);

      const noteCompleted =
        Boolean(note.completed);

      if (
        noteDate === currentDate &&
        noteTurno === currentTurno
      ) {
        return true;
      }

      if (
        noteDate === currentDate &&
        notePriority <
          currentPriority
      ) {
        return !noteCompleted;
      }

      if (
        noteDate < currentDate
      ) {
        return !noteCompleted;
      }

      return false;
    });

    if (!sectionNotes.length) {
      return;
    }

    startY = asegurarEspacio(
      doc,
      startY,
      35
    );

    doc.setFont(
      "times",
      "normal"
    );

    doc.setFontSize(13);

    doc.setTextColor(
      41,
      128,
      185
    );

    doc.text(
      section,
      TABLE_MARGIN_X,
      startY,
      {
        maxWidth: TABLE_CONTENT_WIDTH,
      }
    );

    doc.setFont(
      "DejaVuSans",
      "normal"
    );

    const rows =
      sectionNotes.map(
        (note) => {
          const fechaCreacion =
            new Date(
              note.createdAt
            );

          const hora =
            Number.isNaN(
              fechaCreacion.getTime()
            )
              ? ""
              : fechaCreacion.toLocaleTimeString(
                  "es-CO",
                  {
                    hour:
                      "2-digit",

                    minute:
                      "2-digit",

                    hour12: false,
                  }
                );

          return [
            hora,
            note.text || "",
          ];
        }
      );

    autoTable(doc, {

      tableWidth: TABLE_CONTENT_WIDTH,
      startY: startY + 4,

      head: [
        [
          "Hora",
          "Descripción",
        ],
      ],

      body: rows,

      theme: "striped",

      showHead: "everyPage",

      rowPageBreak: "avoid",

      styles: {
        font: "DejaVuSans",
        textColor: PDF_COLORS.text,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.12,
        overflow: "linebreak",
        fontSize: 10,
        cellPadding: 3,
      },

      headStyles: {
        fillColor: [
          41,
          128,
          185,
        ],

        textColor: 255,
        halign: "center",
      },

      bodyStyles: {
        fillColor: [
          245,
          245,
          245,
        ],
      },

      alternateRowStyles: {
        fillColor: [
          255,
          255,
          255,
        ],
      },

      columnStyles: {
        0: {
          cellWidth: 25,
          halign: "center",
        },

        1: {
          cellWidth: "auto",
        },
      },

      margin: {
        left: TABLE_MARGIN_X,
        right: TABLE_MARGIN_X,
      },
    });

    startY =
      doc.lastAutoTable.finalY +
      12;
  });

  /*
   * Balance del día anterior.
   * Solo llegará para Turno 1 y Turno 4.
   */
  if (resumenTotalizadores) {
    startY = asegurarEspacio(
      doc,
      startY,
      90
    );

    const totals =
      resumenTotalizadores
        ?.totals || {};

    const turnos =
      Array.isArray(
        resumenTotalizadores
          ?.turnos
      )
        ? resumenTotalizadores.turnos
        : [];

    const analisis =
      resumenTotalizadores
        ?.analisis ||
      construirAnalisisLocal(
        resumenTotalizadores
      );

    const estado =
      resumenTotalizadores
        ?.sinDatos
        ? "SIN DATOS"
        : analisis?.estado ||
          "SIN CLASIFICAR";

    doc.setFont(
      "times",
      "bold"
    );

    doc.setFontSize(13);

    doc.setTextColor(
      41,
      128,
      185
    );

    doc.text(
      `BALANCE TOTALIZADORES U400 — ${
        resumenTotalizadores.fecha ||
        "FECHA NO DISPONIBLE"
      }`,
      TABLE_MARGIN_X,
      startY,
      {
        maxWidth: TABLE_CONTENT_WIDTH,
      }
    );

    autoTable(doc, {

      tableWidth: TABLE_CONTENT_WIDTH,
      startY: startY + 5,

      head: [
        [
          "Indicador",
          "Resultado",
        ],
      ],

      body: [
        [
          "Estado del balance",
          estado,
        ],

        [
          "Consumo REN",

          formatearNumero(
            totals.renConsumo
          ),
        ],

        [
          "Producción totalizador",

          formatearNumero(
            totals.prodTotal
          ),
        ],

        [
          "Volumen TK402A/B",

          formatearNumero(
            totals.tk402Total
          ),
        ],

        [
          "REN por diferencia de niveles",

          formatearNumero(
            totals.renNivelTotal
          ),
        ],

        [
          "Traslado 801A/B",

          formatearNumero(
            totals.ab801Total
          ),
        ],

        [
          "Diferencia Producción/TK402",

          formatearNumero(
            totals.difProdTk402 ??
              totals.difProdTraslado
          ),
        ],

        [
          "Error Producción/TK402",

          formatearPorcentaje(
            totals.errorProdTk402Pct ??
              totals.errorTrasladoPct
          ),
        ],

        [
          "Diferencia REN/Niveles",

          formatearNumero(
            totals.difRenNiveles
          ),
        ],

        [
          "Error REN/Niveles",

          formatearPorcentaje(
            totals.errorRenNivelesPct
          ),
        ],

        [
          "Diferencia REN/Producción",

          formatearNumero(
            totals.difAcumRenProd
          ),
        ],

        [
          "Error entre totalizadores",

          formatearPorcentaje(
            totals.errorTotalizadoresPct
          ),
        ],

        [
          "Factor por totalizador",

          formatearNumero(
            totals.fcPorTotalizador,
            4
          ),
        ],

        [
          "Factor REN/Niveles",

          formatearNumero(
            totals.fcRenNiveles,
            4
          ),
        ],
      ],

      theme: "striped",

      showHead: "everyPage",

      rowPageBreak: "avoid",

      styles: {
        font: "DejaVuSans",
        textColor: PDF_COLORS.text,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.12,
        overflow: "linebreak",
        fontSize: 8.5,
        cellPadding: 2.2,
        valign: "middle",
      },

      headStyles: {
        fillColor: [
          41,
          128,
          185,
        ],

        textColor: 255,
        halign: "center",
      },

      columnStyles: {
        0: {
          cellWidth: 108,
          fontStyle: "bold",
        },

        1: {
          cellWidth: 68,
          halign: "right",
        },
      },

      margin: {
        left: TABLE_MARGIN_X,
        right: TABLE_MARGIN_X,
      },
    });

    startY =
      doc.lastAutoTable.finalY +
      8;

    /*
     * Desglose por cada turno del día anterior.
     */
    if (turnos.length) {
      startY = asegurarEspacio(
        doc,
        startY,
        45
      );

      doc.setFont(
        "times",
        "bold"
      );

      doc.setFontSize(11);

      doc.setTextColor(
        41,
        128,
        185
      );

      doc.text(
        "Movimientos por turno del día anterior",
        14,
        startY
      );

      autoTable(doc, {

        tableWidth: TABLE_CONTENT_WIDTH,
        startY: startY + 3,

        head: [
          [
            "Turno",
            "REN",
            "Producción",
            "TK402",
            "REN niveles",
            "801A/B",
          ],
        ],

        body: turnos.map(
          (turno) => [
            turno?.turno ||
              "Sin definir",

            formatearNumero(
              turno?.renConsumo
            ),

            formatearNumero(
              turno?.prodTotal
            ),

            formatearNumero(
              turno?.tk402Total
            ),

            formatearNumero(
              turno?.renNivelTotal
            ),

            formatearNumero(
              turno?.ab801Total
            ),
          ]
        ),

        theme: "striped",

        showHead: "everyPage",

        rowPageBreak: "avoid",

        styles: {
          font: "DejaVuSans",
          textColor: PDF_COLORS.text,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.12,
          overflow: "linebreak",
          fontSize: 7.3,
          cellPadding: 1.7,
          halign: "right",
        },

        headStyles: {
          fillColor: [
            46,
            125,
            50,
          ],

          textColor: 255,
          halign: "center",
        },

        columnStyles: {
          0: {
            cellWidth: 30,
            halign: "left",
          },
        },

        margin: {
          left: TABLE_MARGIN_X,
          right: TABLE_MARGIN_X,
        },
      });

      startY =
        doc.lastAutoTable.finalY +
        8;
    }

    /*
     * Análisis breve del balance.
     */
    startY = asegurarEspacio(
      doc,
      startY,
      45
    );

    doc.setFont(
      "times",
      "bold"
    );

    doc.setFontSize(11);

    doc.setTextColor(
      41,
      128,
      185
    );

    doc.text(
      "Análisis operativo del día anterior",
      TABLE_MARGIN_X,
      startY,
      {
        maxWidth: TABLE_CONTENT_WIDTH,
      }
    );

    const observaciones =
      Array.isArray(
        analisis?.observaciones
      )
        ? analisis.observaciones
        : [];

    const alertas =
      Array.isArray(
        analisis?.alertas
      )
        ? analisis.alertas
        : [];

    const filasAnalisis = [
      ...observaciones.map(
        (texto) => [
          "Observación",
          texto,
        ]
      ),

      ...alertas.map(
        (texto) => [
          "Alerta",
          texto,
        ]
      ),
    ];

    if (
      !filasAnalisis.length &&
      resumenTotalizadores
        ?.mensaje
    ) {
      filasAnalisis.push([
        "Información",
        resumenTotalizadores.mensaje,
      ]);
    }

    if (
      !filasAnalisis.length
    ) {
      filasAnalisis.push([
        "Información",
        "No se generaron observaciones adicionales.",
      ]);
    }

    autoTable(doc, {

      tableWidth: TABLE_CONTENT_WIDTH,
      startY: startY + 3,

      head: [
        [
          "Tipo",
          "Detalle",
        ],
      ],

      body: filasAnalisis,

      theme: "striped",

      showHead: "everyPage",

      rowPageBreak: "avoid",

      styles: {
        font: "DejaVuSans",
        textColor: PDF_COLORS.text,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.12,
        overflow: "linebreak",
        fontSize: 8.5,
        cellPadding: 2.5,
        valign: "top",
      },

      headStyles: {
        fillColor:
          alertas.length > 0
            ? [198, 40, 40]
            : [41, 128, 185],

        textColor: 255,
        halign: "center",
      },

      columnStyles: {
        0: {
          cellWidth: 30,
          fontStyle: "bold",
          halign: "center",
        },

        1: {
          cellWidth: "auto",
        },
      },

      didParseCell(data) {
        if (
          data.section ===
            "body" &&
          data.column.index ===
            0 &&
          data.cell.raw ===
            "Alerta"
        ) {
          data.cell.styles.textColor =
            [198, 40, 40];
        }
      },

      margin: {
        left: TABLE_MARGIN_X,
        right: TABLE_MARGIN_X,
      },
    });

    startY =
      doc.lastAutoTable.finalY +
      10;
  }

  if (
    resumenNivelesTanques ||
    resumenRecepcionesAlcohol ||
    resumenDespachosAlcohol
  ) {
    startY = dibujarSeparadorBloque(
      doc,
      startY,
      "Alcoholes",
      "Niveles de tanques jornaleros, recepciones, compras y despachos del día anterior",
      PDF_COLORS.purple
    );
  }

  /*
   * Niveles de tanques jornaleros del día anterior.
   * Se presenta una fila por cada tanque.
   */
  if (resumenNivelesTanques) {
    startY = asegurarEspacio(
      doc,
      startY,
      55
    );

    const fechaNiveles =
      resumenNivelesTanques?.fecha ||
      "FECHA NO DISPONIBLE";

    const detalleTanques = Array.isArray(
      resumenNivelesTanques?.detalle
    )
      ? resumenNivelesTanques.detalle
      : [];

    doc.setFont(
      "times",
      "bold"
    );

    doc.setFontSize(13);

    doc.setTextColor(
      41,
      128,
      185
    );

    doc.text(
      `NIVELES DE TANQUES JORNALEROS — ${fechaNiveles}`,
      TABLE_MARGIN_X,
      startY,
      {
        maxWidth: TABLE_CONTENT_WIDTH,
      }
    );

    if (detalleTanques.length) {
      autoTable(doc, {
        tableWidth: TABLE_CONTENT_WIDTH,
        startY: startY + 5,

        head: [
          [
            "Tanque",
            "Producto / disposición",
            "Nivel",
            "Factor",
            "Volumen (L)",
            "Grado (% v/v)",
            "Alcohol absoluto (L)",
            "Responsable",
            "Observación",
          ],
        ],

        body: detalleTanques.map((item) => {
          const nivel = Number(item?.nivel || 0);
          const factor = Number(item?.factor || 0);

          const volumenCalculado = tieneNumero(item?.volumen)
            ? Number(item.volumen)
            : nivel * factor;

          const gradoNormalizado =
            item?.gradoAlcoholico !== null &&
            item?.gradoAlcoholico !== undefined &&
            item?.gradoAlcoholico !== ""
              ? Number(
                  String(item.gradoAlcoholico)
                    .trim()
                    .replace(",", ".")
                )
              : null;

          const gradoAlcoholico =
            gradoNormalizado !== null &&
            Number.isFinite(gradoNormalizado)
              ? gradoNormalizado
              : null;

          const alcoholAbsoluto =
            gradoAlcoholico !== null
              ? volumenCalculado * (gradoAlcoholico / 100)
              : null;

          return [
            item?.tanque || "Sin definir",
            item?.disposicion || "Sin definir",
            formatearNumero(nivel, 3),
            formatearNumero(factor, 4),
            formatearNumero(volumenCalculado, 2),
            gradoAlcoholico !== null
              ? `${formatearNumero(gradoAlcoholico, 2)} %`
              : "—",
            alcoholAbsoluto !== null
              ? formatearNumero(alcoholAbsoluto, 2)
              : "—",
            item?.responsable || "—",
            item?.observaciones || "—",
          ];
        }),

        theme: "striped",
        showHead: "everyPage",
        rowPageBreak: "avoid",

        styles: {
          font: "DejaVuSans",
          textColor: PDF_COLORS.text,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.12,
          overflow: "linebreak",
          fontSize: 5.7,
          cellPadding: 1.15,
          valign: "middle",
        },

        headStyles: {
          fillColor: PDF_COLORS.blueDark,
          textColor: 255,
          halign: "center",
          valign: "middle",
        },

        columnStyles: {
          0: {
            cellWidth: 15,
            fontStyle: "bold",
            halign: "center",
          },
          1: {
            cellWidth: 28,
          },
          2: {
            cellWidth: 14,
            halign: "right",
          },
          3: {
            cellWidth: 16,
            halign: "right",
          },
          4: {
            cellWidth: 22,
            halign: "right",
            fontStyle: "bold",
          },
          5: {
            cellWidth: 18,
            halign: "right",
          },
          6: {
            cellWidth: 24,
            halign: "right",
            fontStyle: "bold",
          },
          7: {
            cellWidth: 21,
          },
          8: {
            cellWidth: 24,
          },
        },

        margin: {
          left: TABLE_MARGIN_X,
          right: TABLE_MARGIN_X,
        },
      });

      startY =
        doc.lastAutoTable.finalY +
        10;
    } else {
      autoTable(doc, {
        tableWidth: TABLE_CONTENT_WIDTH,
        startY: startY + 5,

        head: [["Información"]],

        body: [
          [
            resumenNivelesTanques?.mensaje ||
              "No se registraron niveles de tanques jornaleros para la fecha consultada.",
          ],
        ],

        theme: "striped",
        showHead: "everyPage",
        rowPageBreak: "avoid",

        styles: {
          font: "DejaVuSans",
          textColor: PDF_COLORS.text,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.12,
          overflow: "linebreak",
          fontSize: 9,
          cellPadding: 3,
          valign: "middle",
        },

        headStyles: {
          fillColor: PDF_COLORS.slate,
          textColor: 255,
          halign: "center",
        },

        margin: {
          left: TABLE_MARGIN_X,
          right: TABLE_MARGIN_X,
        },
      });

      startY =
        doc.lastAutoTable.finalY +
        10;
    }
  }

  /*
   * Recepciones o compras de alcoholes del día anterior.
   */
  if (resumenRecepcionesAlcohol) {
    startY = asegurarEspacio(
      doc,
      startY,
      85
    );

    const fechaRecepciones =
      resumenRecepcionesAlcohol
        ?.fecha ||
      "FECHA NO DISPONIBLE";

    const resumen =
      resumenRecepcionesAlcohol
        ?.resumen || {};

    const porProducto =
      Array.isArray(
        resumenRecepcionesAlcohol
          ?.porProducto
      )
        ? resumenRecepcionesAlcohol.porProducto
        : [];

    const detalle =
      Array.isArray(
        resumenRecepcionesAlcohol
          ?.detalle
      )
        ? resumenRecepcionesAlcohol.detalle
        : [];

    const totalRecepciones = Number(
      resumen?.totalRecepciones ||
        resumenRecepcionesAlcohol
          ?.totalRegistros ||
        0
    );

    const tieneRecepciones =
      totalRecepciones > 0 ||
      detalle.length > 0;

    doc.setFont(
      "times",
      "bold"
    );

    doc.setFontSize(13);

    doc.setTextColor(
      41,
      128,
      185
    );

    doc.text(
      `RECEPCIONES / COMPRAS DE ALCOHOLES — ${fechaRecepciones}`,
      TABLE_MARGIN_X,
      startY,
      {
        maxWidth: TABLE_CONTENT_WIDTH,
      }
    );

    autoTable(doc, {

      tableWidth: TABLE_CONTENT_WIDTH,
      startY: startY + 5,

      head: [
        [
          "Indicador",
          "Resultado",
        ],
      ],

      body: [
        [
          "Recepciones registradas",
          formatearNumero(
            totalRecepciones,
            0
          ),
        ],

        [
          "Cantidad recibida reportada",
          `${formatearNumero(
            resumen?.cantidadRecibida,
            2
          )} L`,
        ],

        [
          "Volumen recepcionado en planta",
          `${formatearNumero(
            resumen?.volumenRecepcionado,
            2
          )} L`,
        ],

        [
          "Peso neto enviado por proveedor",
          `${formatearNumero(
            resumen?.pesoEnviadoProveedor,
            2
          )} kg`,
        ],

        [
          "Peso registrado en Ambiocom",
          `${formatearNumero(
            resumen?.pesoAmbiocom,
            2
          )} kg`,
        ],

        [
          "Vehículos aprobados",
          formatearNumero(
            resumen?.aprobados,
            0
          ),
        ],

        [
          "Vehículos rechazados",
          formatearNumero(
            resumen?.rechazados,
            0
          ),
        ],

        [
          "Vehículos en proceso",
          formatearNumero(
            resumen?.enProceso,
            0
          ),
        ],
      ],

      theme: "striped",

      showHead: "everyPage",

      rowPageBreak: "avoid",

      styles: {
        font: "DejaVuSans",
        textColor: PDF_COLORS.text,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.12,
        overflow: "linebreak",
        fontSize: 8.5,
        cellPadding: 2.2,
        valign: "middle",
      },

      headStyles: {
        fillColor: [
          30,
          64,
          175,
        ],

        textColor: 255,
        halign: "center",
      },

      columnStyles: {
        0: {
          cellWidth: 112,
          fontStyle: "bold",
        },

        1: {
          cellWidth: 64,
          halign: "right",
        },
      },

      margin: {
        left: TABLE_MARGIN_X,
        right: TABLE_MARGIN_X,
      },
    });

    startY =
      doc.lastAutoTable.finalY +
      8;

    if (porProducto.length) {
      startY = asegurarEspacio(
        doc,
        startY,
        45
      );

      doc.setFont(
        "times",
        "bold"
      );

      doc.setFontSize(11);

      doc.setTextColor(
        41,
        128,
        185
      );

      doc.text(
        "Resumen de recepciones por producto",
        14,
        startY
      );

      autoTable(doc, {

        tableWidth: TABLE_CONTENT_WIDTH,
        startY: startY + 3,

        head: [
          [
            "Producto",
            "Recepciones",
            "Cantidad reportada (L)",
            "Volumen planta (L)",
            "Peso Ambiocom (kg)",
          ],
        ],

        body: porProducto.map(
          (item) => [
            item?.producto ||
              "Sin definir",

            formatearNumero(
              item?.recepciones,
              0
            ),

            formatearNumero(
              item?.cantidadRecibida,
              2
            ),

            formatearNumero(
              item?.volumenRecepcionado,
              2
            ),

            formatearNumero(
              item?.pesoAmbiocom,
              2
            ),
          ]
        ),

        theme: "striped",

        showHead: "everyPage",

        rowPageBreak: "avoid",

        styles: {
          font: "DejaVuSans",
          textColor: PDF_COLORS.text,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.12,
          overflow: "linebreak",
          fontSize: 7.2,
          cellPadding: 1.8,
          valign: "middle",
          halign: "right",
        },

        headStyles: {
          fillColor: [
            37,
            99,
            235,
          ],

          textColor: 255,
          halign: "center",
        },

        columnStyles: {
          0: {
            cellWidth: 48,
            halign: "left",
          },

          1: {
            cellWidth: 25,
            halign: "center",
          },

          2: {
            cellWidth: 35,
          },

          3: {
            cellWidth: 34,
          },

          4: {
            cellWidth: 34,
          },
        },

        margin: {
          left: TABLE_MARGIN_X,
          right: TABLE_MARGIN_X,
        },
      });

      startY =
        doc.lastAutoTable.finalY +
        8;
    }

    if (detalle.length) {
      startY = asegurarEspacio(
        doc,
        startY,
        55
      );

      doc.setFont(
        "times",
        "bold"
      );

      doc.setFontSize(11);

      doc.setTextColor(
        41,
        128,
        185
      );

      doc.text(
        "Detalle de vehículos y recepción",
        14,
        startY
      );

      autoTable(doc, {

        tableWidth: TABLE_CONTENT_WIDTH,
        startY: startY + 3,

        head: [
          [
            "Producto",
            "Proveedor",
            "Remisión",
            "Placa",
            "Tanque",
            "Cliente (L)",
            "Planta (L)",
            "Estado",
          ],
        ],

        body: detalle.map(
          (item) => [
            item?.producto ||
              "Sin definir",

            item?.proveedor ||
              "Sin definir",

            item?.remision ||
              "—",

            item?.placa ||
              "—",

            item?.tanqueRecepcion ||
              "—",

            formatearNumero(
              item?.cantidadRecibida,
              2
            ),

            formatearNumero(
              item?.volumenRecepcionado,
              2
            ),

            item?.estadoVehiculo ||
              "Sin estado",
          ]
        ),

        theme: "striped",

        showHead: "everyPage",

        rowPageBreak: "avoid",

        styles: {
          font: "DejaVuSans",
          textColor: PDF_COLORS.text,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.12,
          overflow: "linebreak",
          fontSize: 6.4,
          cellPadding: 1.35,
          valign: "middle",
        },

        headStyles: {
          fillColor: [
            30,
            64,
            175,
          ],

          textColor: 255,
          halign: "center",
        },

        columnStyles: {
          0: {
            cellWidth: 25,
          },

          1: {
            cellWidth: 30,
          },

          2: {
            cellWidth: 20,
          },

          3: {
            cellWidth: 16,
            halign: "center",
          },

          4: {
            cellWidth: 18,
          },

          5: {
            cellWidth: 20,
            halign: "right",
          },

          6: {
            cellWidth: 20,
            halign: "right",
          },

          7: {
            cellWidth: 27,
            halign: "center",
          },
        },

        didParseCell(data) {
          if (
            data.section ===
              "body" &&
            data.column.index === 7
          ) {
            const estado = String(
              data.cell.raw || ""
            ).toUpperCase();

            if (estado === "RECHAZADO") {
              data.cell.styles.textColor =
                [198, 40, 40];
              data.cell.styles.fontStyle =
                "bold";
            } else if (
              estado === "APROBADO"
            ) {
              data.cell.styles.textColor =
                [22, 101, 52];
              data.cell.styles.fontStyle =
                "bold";
            }
          }
        },

        margin: {
          left: TABLE_MARGIN_X,
          right: TABLE_MARGIN_X,
        },
      });

      startY =
        doc.lastAutoTable.finalY +
        8;

      const observacionesRecepciones =
        detalle
          .filter((item) =>
            String(
              item?.observaciones || ""
            ).trim()
          )
          .map((item) => [
            item?.producto ||
              "Sin definir",

            item?.placa ||
              "Sin placa",

            item?.observaciones ||
              "",
          ]);

      if (
        observacionesRecepciones.length
      ) {
        startY = asegurarEspacio(
          doc,
          startY,
          35
        );

        autoTable(doc, {

          tableWidth: TABLE_CONTENT_WIDTH,
          startY,

          head: [
            [
              "Producto",
              "Vehículo",
              "Observación",
            ],
          ],

          body:
            observacionesRecepciones,

          theme: "striped",

          showHead: "everyPage",

          rowPageBreak: "avoid",

          styles: {
            font: "DejaVuSans",
            textColor: PDF_COLORS.text,
            lineColor: PDF_COLORS.border,
            lineWidth: 0.12,
            overflow: "linebreak",
            fontSize: 7.5,
            cellPadding: 2,
            valign: "top",
          },

          headStyles: {
            fillColor: [
              100,
              116,
              139,
            ],

            textColor: 255,
            halign: "center",
          },

          columnStyles: {
            0: {
              cellWidth: 40,
            },

            1: {
              cellWidth: 30,
              halign: "center",
            },

            2: {
              cellWidth: 106,
            },
          },

          margin: {
            left: TABLE_MARGIN_X,
            right: TABLE_MARGIN_X,
          },
        });

        startY =
          doc.lastAutoTable.finalY +
          8;
      }
    }

    if (!tieneRecepciones) {
      startY = asegurarEspacio(
        doc,
        startY,
        30
      );

      autoTable(doc, {

        tableWidth: TABLE_CONTENT_WIDTH,
        startY,

        head: [
          [
            "Información",
          ],
        ],

        body: [
          [
            resumenRecepcionesAlcohol
              ?.mensaje ||
              "No se registraron recepciones o compras de alcoholes para la fecha consultada.",
          ],
        ],

        theme: "striped",

        showHead: "everyPage",

        rowPageBreak: "avoid",

        styles: {
          font: "DejaVuSans",
          textColor: PDF_COLORS.text,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.12,
          overflow: "linebreak",
          fontSize: 9,
          cellPadding: 3,
          valign: "middle",
        },

        headStyles: {
          fillColor: [
            100,
            116,
            139,
          ],

          textColor: 255,
          halign: "center",
        },

        margin: {
          left: TABLE_MARGIN_X,
          right: TABLE_MARGIN_X,
        },
      });

      startY =
        doc.lastAutoTable.finalY +
        10;
    }
  }


  /*
   * Despachos de alcoholes del día anterior.
   */
  if (resumenDespachosAlcohol) {
    startY = asegurarEspacio(
      doc,
      startY,
      90
    );

    const fechaDespachos =
      resumenDespachosAlcohol
        ?.fecha ||
      "FECHA NO DISPONIBLE";

    const resumen =
      resumenDespachosAlcohol
        ?.resumen || {};

    const porProducto =
      Array.isArray(
        resumenDespachosAlcohol
          ?.porProducto
      )
        ? resumenDespachosAlcohol.porProducto
        : [];

    const porCliente =
      Array.isArray(
        resumenDespachosAlcohol
          ?.porCliente
      )
        ? resumenDespachosAlcohol.porCliente
        : [];

    const detalle =
      Array.isArray(
        resumenDespachosAlcohol
          ?.detalle
      )
        ? resumenDespachosAlcohol.detalle
        : [];

    const totalDespachos = Number(
      resumen?.totalDespachos ||
        resumenDespachosAlcohol
          ?.totalRegistros ||
        0
    );

    const tieneDespachos =
      totalDespachos > 0 ||
      detalle.length > 0;

    doc.setFont(
      "times",
      "bold"
    );

    doc.setFontSize(13);

    doc.setTextColor(
      41,
      128,
      185
    );

    doc.text(
      `DESPACHOS DE ALCOHOLES — ${fechaDespachos}`,
      TABLE_MARGIN_X,
      startY,
      {
        maxWidth: TABLE_CONTENT_WIDTH,
      }
    );

    autoTable(doc, {

      tableWidth: TABLE_CONTENT_WIDTH,
      startY: startY + 5,

      head: [
        [
          "Indicador",
          "Resultado",
        ],
      ],

      body: [
        [
          "Despachos registrados",
          formatearNumero(
            totalDespachos,
            0
          ),
        ],

        [
          "Volumen programado / facturado",
          `${formatearNumero(
            resumen?.volumenFacturado,
            2
          )} L`,
        ],

        [
          "Volumen medido por contador",
          `${formatearNumero(
            resumen?.volumenDespachado,
            2
          )} L`,
        ],

        [
          "Peso neto báscula Ambiocom",
          `${formatearNumero(
            resumen?.pesoNeto,
            2
          )} kg`,
        ],

        [
          "En cargue",
          formatearNumero(
            resumen?.enCargue,
            0
          ),
        ],

        [
          "En tránsito",
          formatearNumero(
            resumen?.enTransito,
            0
          ),
        ],

        [
          "En cliente",
          formatearNumero(
            resumen?.enCliente,
            0
          ),
        ],

        [
          "Aprobados por cliente",
          formatearNumero(
            resumen?.aprobadosCliente,
            0
          ),
        ],

        [
          "Aprobados con observaciones",
          formatearNumero(
            resumen?.aprobadosConObservaciones,
            0
          ),
        ],

        [
          "Rechazados",
          formatearNumero(
            Number(
              resumen?.rechazadosAmbiocom ||
                0
            ) +
              Number(
                resumen?.rechazadosCliente ||
                  0
              ),
            0
          ),
        ],
      ],

      theme: "striped",

      showHead: "everyPage",

      rowPageBreak: "avoid",

      styles: {
        font: "DejaVuSans",
        textColor: PDF_COLORS.text,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.12,
        overflow: "linebreak",
        fontSize: 8.4,
        cellPadding: 2.2,
        valign: "middle",
      },

      headStyles: {
        fillColor: [
          126,
          34,
          206,
        ],

        textColor: 255,
        halign: "center",
      },

      columnStyles: {
        0: {
          cellWidth: 112,
          fontStyle: "bold",
        },

        1: {
          cellWidth: 64,
          halign: "right",
        },
      },

      margin: {
        left: TABLE_MARGIN_X,
        right: TABLE_MARGIN_X,
      },
    });

    startY =
      doc.lastAutoTable.finalY +
      8;

    if (porProducto.length) {
      startY = asegurarEspacio(
        doc,
        startY,
        45
      );

      doc.setFont(
        "times",
        "bold"
      );

      doc.setFontSize(11);

      doc.setTextColor(
        41,
        128,
        185
      );

      doc.text(
        "Resumen de despachos por producto",
        14,
        startY
      );

      autoTable(doc, {

        tableWidth: TABLE_CONTENT_WIDTH,
        startY: startY + 3,

        head: [
          [
            "Producto",
            "Despachos",
            "Volumen facturado (L)",
            "Volumen contador (L)",
            "Peso neto (kg)",
          ],
        ],

        body: porProducto.map(
          (item) => [
            item?.producto ||
              "Sin definir",

            formatearNumero(
              item?.despachos,
              0
            ),

            formatearNumero(
              item?.volumenFacturado,
              2
            ),

            formatearNumero(
              item?.volumenDespachado,
              2
            ),

            formatearNumero(
              item?.pesoNeto,
              2
            ),
          ]
        ),

        theme: "striped",

        showHead: "everyPage",

        rowPageBreak: "avoid",

        styles: {
          font: "DejaVuSans",
          textColor: PDF_COLORS.text,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.12,
          overflow: "linebreak",
          fontSize: 7.2,
          cellPadding: 1.8,
          valign: "middle",
          halign: "right",
        },

        headStyles: {
          fillColor: [
            147,
            51,
            234,
          ],

          textColor: 255,
          halign: "center",
        },

        columnStyles: {
          0: {
            cellWidth: 48,
            halign: "left",
          },

          1: {
            cellWidth: 25,
            halign: "center",
          },

          2: {
            cellWidth: 35,
          },

          3: {
            cellWidth: 34,
          },

          4: {
            cellWidth: 34,
          },
        },

        margin: {
          left: TABLE_MARGIN_X,
          right: TABLE_MARGIN_X,
        },
      });

      startY =
        doc.lastAutoTable.finalY +
        8;
    }

    if (porCliente.length) {
      startY = asegurarEspacio(
        doc,
        startY,
        42
      );

      doc.setFont(
        "times",
        "bold"
      );

      doc.setFontSize(11);

      doc.setTextColor(
        41,
        128,
        185
      );

      doc.text(
        "Resumen de despachos por cliente",
        14,
        startY
      );

      autoTable(doc, {

        tableWidth: TABLE_CONTENT_WIDTH,
        startY: startY + 3,

        head: [
          [
            "Cliente",
            "Despachos",
            "Volumen facturado (L)",
            "Volumen contador (L)",
          ],
        ],

        body: porCliente.map(
          (item) => [
            item?.cliente ||
              "Sin definir",

            formatearNumero(
              item?.despachos,
              0
            ),

            formatearNumero(
              item?.volumenFacturado,
              2
            ),

            formatearNumero(
              item?.volumenDespachado,
              2
            ),
          ]
        ),

        theme: "striped",

        showHead: "everyPage",

        rowPageBreak: "avoid",

        styles: {
          font: "DejaVuSans",
          textColor: PDF_COLORS.text,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.12,
          overflow: "linebreak",
          fontSize: 7.5,
          cellPadding: 1.9,
          valign: "middle",
        },

        headStyles: {
          fillColor: [
            109,
            40,
            217,
          ],

          textColor: 255,
          halign: "center",
        },

        columnStyles: {
          0: {
            cellWidth: 80,
          },

          1: {
            cellWidth: 28,
            halign: "center",
          },

          2: {
            cellWidth: 34,
            halign: "right",
          },

          3: {
            cellWidth: 34,
            halign: "right",
          },
        },

        margin: {
          left: TABLE_MARGIN_X,
          right: TABLE_MARGIN_X,
        },
      });

      startY =
        doc.lastAutoTable.finalY +
        8;
    }

    if (detalle.length) {
      startY = asegurarEspacio(
        doc,
        startY,
        58
      );

      doc.setFont(
        "times",
        "bold"
      );

      doc.setFontSize(11);

      doc.setTextColor(
        41,
        128,
        185
      );

      doc.text(
        "Detalle de vehículos despachados",
        14,
        startY
      );

      autoTable(doc, {

        tableWidth: TABLE_CONTENT_WIDTH,
        startY: startY + 3,

        head: [
          [
            "Producto",
            "Cliente",
            "Transportadora",
            "Placa",
            "Remisión",
            "G.A. (% v/v)",
            "Densidad",
            "Facturado (L)",
            "Contador (L)",
            "Estado",
          ],
        ],

        body: detalle.map(
          (item) => [
            item?.producto ||
              "Sin definir",

            item?.cliente ||
              "Sin definir",

            item?.transportadora ||
              "Sin definir",

            item?.placa ||
              "—",

            item?.remisionFactura ||
              "—",

            formatearNumero(
              item?.gradoAlcoholico,
              2
            ),

            formatearNumero(
              item?.densidad,
              5
            ),

            formatearNumero(
              item?.volumenFacturado,
              2
            ),

            formatearNumero(
              item?.volumenDespachado,
              2
            ),

            item?.estadoVehiculo ||
              "Sin estado",
          ]
        ),

        theme: "striped",

        showHead: "everyPage",

        rowPageBreak: "avoid",

        styles: {
          font: "DejaVuSans",
          textColor: PDF_COLORS.text,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.12,
          overflow: "linebreak",
          fontSize: 5.5,
          cellPadding: 1.05,
          valign: "middle",
        },

        headStyles: {
          fillColor: [
            126,
            34,
            206,
          ],

          textColor: 255,
          halign: "center",
        },

        columnStyles: {
          0: {
            cellWidth: 19,
          },

          1: {
            cellWidth: 22,
          },

          2: {
            cellWidth: 22,
          },

          3: {
            cellWidth: 13,
            halign: "center",
          },

          4: {
            cellWidth: 16,
          },

          5: {
            cellWidth: 14,
            halign: "right",
          },

          6: {
            cellWidth: 14,
            halign: "right",
          },

          7: {
            cellWidth: 17,
            halign: "right",
          },

          8: {
            cellWidth: 17,
            halign: "right",
          },

          9: {
            cellWidth: 22,
            halign: "center",
          },
        },

        didParseCell(data) {
          if (
            data.section ===
              "body" &&
            data.column.index === 9
          ) {
            const estado = String(
              data.cell.raw || ""
            ).toUpperCase();

            if (
              estado.includes(
                "RECHAZADO"
              )
            ) {
              data.cell.styles.textColor =
                [198, 40, 40];

              data.cell.styles.fontStyle =
                "bold";
            } else if (
              estado.includes(
                "APROBADO"
              )
            ) {
              data.cell.styles.textColor =
                [22, 101, 52];

              data.cell.styles.fontStyle =
                "bold";
            }
          }
        },

        margin: {
          left: TABLE_MARGIN_X,
          right: TABLE_MARGIN_X,
        },
      });

      startY =
        doc.lastAutoTable.finalY +
        8;

      const novedadesDespachos =
        detalle
          .filter(
            (item) =>
              String(
                item?.observaciones || ""
              ).trim() ||
              String(
                item?.llegadaDestino || ""
              ).trim() ||
              String(
                item?.puntualidadCliente || ""
              ).trim()
          )
          .map((item) => [
            item?.placa ||
              "Sin placa",

            item?.cliente ||
              "Sin cliente",

            item?.llegadaDestino ||
              "—",

            item?.puntualidadCliente ||
              "—",

            item?.observaciones ||
              "",
          ]);

      if (novedadesDespachos.length) {
        startY = asegurarEspacio(
          doc,
          startY,
          40
        );

        autoTable(doc, {

          tableWidth: TABLE_CONTENT_WIDTH,
          startY,

          head: [
            [
              "Vehículo",
              "Cliente",
              "Llegada destino",
              "Puntualidad cliente",
              "Observación",
            ],
          ],

          body:
            novedadesDespachos,

          theme: "striped",

          showHead: "everyPage",

          rowPageBreak: "avoid",

          styles: {
            font: "DejaVuSans",
            textColor: PDF_COLORS.text,
            lineColor: PDF_COLORS.border,
            lineWidth: 0.12,
            overflow: "linebreak",
            fontSize: 6.8,
            cellPadding: 1.8,
            valign: "top",
          },

          headStyles: {
            fillColor: [
              100,
              116,
              139,
            ],

            textColor: 255,
            halign: "center",
          },

          columnStyles: {
            0: {
              cellWidth: 24,
              halign: "center",
            },

            1: {
              cellWidth: 40,
            },

            2: {
              cellWidth: 30,
              halign: "center",
            },

            3: {
              cellWidth: 32,
              halign: "center",
            },

            4: {
              cellWidth: 50,
            },
          },

          margin: {
            left: TABLE_MARGIN_X,
            right: TABLE_MARGIN_X,
          },
        });

        startY =
          doc.lastAutoTable.finalY +
          8;
      }
    }

    if (!tieneDespachos) {
      startY = asegurarEspacio(
        doc,
        startY,
        30
      );

      autoTable(doc, {

        tableWidth: TABLE_CONTENT_WIDTH,
        startY,

        head: [
          [
            "Información",
          ],
        ],

        body: [
          [
            resumenDespachosAlcohol
              ?.mensaje ||
              "No se registraron despachos de alcohol para la fecha consultada.",
          ],
        ],

        theme: "striped",

        showHead: "everyPage",

        rowPageBreak: "avoid",

        styles: {
          font: "DejaVuSans",
          textColor: PDF_COLORS.text,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.12,
          overflow: "linebreak",
          fontSize: 9,
          cellPadding: 3,
          valign: "middle",
        },

        headStyles: {
          fillColor: [
            100,
            116,
            139,
          ],

          textColor: 255,
          halign: "center",
        },

        margin: {
          left: TABLE_MARGIN_X,
          right: TABLE_MARGIN_X,
        },
      });

      startY =
        doc.lastAutoTable.finalY +
        10;
    }
  }

  if (
    resumenIngresosCombustibles ||
    resumenConsumosCombustibles
  ) {
    startY = dibujarSeparadorBloque(
      doc,
      startY,
      "Carbón, madera y bagazo",
      "Ingresos, consumos, ajustes y lecturas de tolvas",
      PDF_COLORS.orange
    );
  }

  /*
   * Ingresos de carbón y madera del día anterior.
   */
  if (
    resumenIngresosCombustibles
  ) {
    startY = asegurarEspacio(
      doc,
      startY,
      70
    );

    const fechaIngresos =
      resumenIngresosCombustibles
        ?.fecha ||
      "FECHA NO DISPONIBLE";

    const resumen =
      resumenIngresosCombustibles
        ?.resumen || {};

    const carbon =
      resumen?.carbon || {};

    const madera =
      resumen?.madera || {};

    const total =
      resumen?.total || {};

    const proveedores =
      Array.isArray(
        resumenIngresosCombustibles
          ?.proveedores
      )
        ? resumenIngresosCombustibles.proveedores
        : [];

    const detalle =
      Array.isArray(
        resumenIngresosCombustibles
          ?.detalle
      )
        ? resumenIngresosCombustibles.detalle
        : [];

    const tieneIngresos =
      Number(
        total?.viajes || 0
      ) > 0 ||
      Number(
        total?.toneladas || 0
      ) > 0 ||
      proveedores.length > 0 ||
      detalle.length > 0;

    doc.setFont(
      "times",
      "bold"
    );

    doc.setFontSize(13);

    doc.setTextColor(
      41,
      128,
      185
    );

    doc.text(
      `INGRESOS DE COMBUSTIBLES — ${fechaIngresos}`,
      TABLE_MARGIN_X,
      startY,
      {
        maxWidth: TABLE_CONTENT_WIDTH,
      }
    );

    autoTable(doc, {

      tableWidth: TABLE_CONTENT_WIDTH,
      startY: startY + 5,

      head: [
        [
          "Material",
          "Viajes",
          "Toneladas recibidas",
        ],
      ],

      body: [
        [
          "Carbón",

          formatearNumero(
            carbon?.viajes,
            0
          ),

          formatearNumero(
            carbon?.toneladas,
            4
          ),
        ],

        [
          "Madera",

          formatearNumero(
            madera?.viajes,
            0
          ),

          formatearNumero(
            madera?.toneladas,
            4
          ),
        ],

        [
          "TOTAL",

          formatearNumero(
            total?.viajes,
            0
          ),

          formatearNumero(
            total?.toneladas,
            4
          ),
        ],
      ],

      theme: "striped",

      showHead: "everyPage",

      rowPageBreak: "avoid",

      styles: {
        font: "DejaVuSans",
        textColor: PDF_COLORS.text,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.12,
        overflow: "linebreak",
        fontSize: 9,
        cellPadding: 2.5,
        valign: "middle",
      },

      headStyles: {
        fillColor: [
          22,
          101,
          52,
        ],

        textColor: 255,
        halign: "center",
      },

      columnStyles: {
        0: {
          cellWidth: 70,
          fontStyle: "bold",
        },

        1: {
          cellWidth: 45,
          halign: "center",
        },

        2: {
          cellWidth: 61,
          halign: "right",
        },
      },

      didParseCell(data) {
        if (
          data.section ===
            "body" &&
          data.row.index === 2
        ) {
          data.cell.styles.fontStyle =
            "bold";

          data.cell.styles.fillColor =
            [236, 253, 245];
        }
      },

      margin: {
        left: TABLE_MARGIN_X,
        right: TABLE_MARGIN_X,
      },
    });

    startY =
      doc.lastAutoTable.finalY +
      8;

    if (proveedores.length) {
      startY = asegurarEspacio(
        doc,
        startY,
        45
      );

      doc.setFont(
        "times",
        "bold"
      );

      doc.setFontSize(11);

      doc.setTextColor(
        41,
        128,
        185
      );

      doc.text(
        "Detalle de ingresos por proveedor o mina",
        14,
        startY
      );

      autoTable(doc, {

        tableWidth: TABLE_CONTENT_WIDTH,
        startY: startY + 3,

        head: [
          [
            "Material",
            "Proveedor / mina",
            "Viajes",
            "Toneladas",
          ],
        ],

        body: proveedores.map(
          (item) => [
            item?.material ||
              "Sin definir",

            item?.proveedor ||
              "Proveedor no definido",

            formatearNumero(
              item?.viajes,
              0
            ),

            formatearNumero(
              item?.toneladas,
              4
            ),
          ]
        ),

        theme: "striped",

        showHead: "everyPage",

        rowPageBreak: "avoid",

        styles: {
          font: "DejaVuSans",
          textColor: PDF_COLORS.text,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.12,
          overflow: "linebreak",
          fontSize: 8.2,
          cellPadding: 2,
          valign: "middle",
        },

        headStyles: {
          fillColor: [
            46,
            125,
            50,
          ],

          textColor: 255,
          halign: "center",
        },

        columnStyles: {
          0: {
            cellWidth: 35,
            halign: "left",
          },

          1: {
            cellWidth: 75,
            halign: "left",
          },

          2: {
            cellWidth: 30,
            halign: "center",
          },

          3: {
            cellWidth: 36,
            halign: "right",
          },
        },

        margin: {
          left: TABLE_MARGIN_X,
          right: TABLE_MARGIN_X,
        },
      });

      startY =
        doc.lastAutoTable.finalY +
        8;
    }

    if (!tieneIngresos) {
      startY = asegurarEspacio(
        doc,
        startY,
        30
      );

      autoTable(doc, {

        tableWidth: TABLE_CONTENT_WIDTH,
        startY,

        head: [
          [
            "Información",
          ],
        ],

        body: [
          [
            resumenIngresosCombustibles
              ?.mensaje ||
              "No se registraron ingresos de carbón o madera para la fecha consultada.",
          ],
        ],

        theme: "striped",

        showHead: "everyPage",

        rowPageBreak: "avoid",

        styles: {
          font: "DejaVuSans",
          textColor: PDF_COLORS.text,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.12,
          overflow: "linebreak",
          fontSize: 9,
          cellPadding: 3,
          valign: "middle",
        },

        headStyles: {
          fillColor: [
            100,
            116,
            139,
          ],

          textColor: 255,
          halign: "center",
        },

        margin: {
          left: TABLE_MARGIN_X,
          right: TABLE_MARGIN_X,
        },
      });

      startY =
        doc.lastAutoTable.finalY +
        10;
    }
  }

  /*
   * Consumos de carbón, madera y bagazo del día anterior.
   */
  if (
    resumenConsumosCombustibles
  ) {
    startY = asegurarEspacio(
      doc,
      startY,
      80
    );

    const fechaConsumos =
      resumenConsumosCombustibles
        ?.fecha ||
      "FECHA NO DISPONIBLE";

    const resumen =
      resumenConsumosCombustibles
        ?.resumen || {};

    const carbon =
      resumen?.carbon || {};

    const madera =
      resumen?.madera || {};

    const bagazo =
      resumen?.bagazo || {};

    const total =
      resumen?.total || {};

    const materiales =
      Array.isArray(
        resumenConsumosCombustibles
          ?.materiales
      )
        ? resumenConsumosCombustibles.materiales
        : [];

    const tolvas =
      resumenConsumosCombustibles
        ?.tolvas || {};

    /*
     * Composición de la mezcla consumida.
     * El porcentaje se calcula sobre el consumo real de cada material.
     */
    const consumoCarbonTon = Number(
      carbon?.consumoTon || 0
    );

    const consumoMaderaTon = Number(
      madera?.consumoTon || 0
    );

    const consumoBagazoTon = Number(
      bagazo?.consumoTon || 0
    );

    const consumoTotalMezclaTon =
      consumoCarbonTon +
      consumoMaderaTon +
      consumoBagazoTon;

    const porcentajeCarbon =
      consumoTotalMezclaTon > 0
        ? consumoCarbonTon / consumoTotalMezclaTon
        : 0;

    const porcentajeMadera =
      consumoTotalMezclaTon > 0
        ? consumoMaderaTon / consumoTotalMezclaTon
        : 0;

    const porcentajeBagazo =
      consumoTotalMezclaTon > 0
        ? consumoBagazoTon / consumoTotalMezclaTon
        : 0;

    const totalTolvasTon = tieneNumero(
      tolvas?.total
    )
      ? Number(tolvas.total)
      : Number(tolvas?.principal || 0) +
        Number(tolvas?.auxiliares || 0);

    const carbonEnTolvasTon =
      totalTolvasTon * porcentajeCarbon;

    const maderaEnTolvasTon =
      totalTolvasTon * porcentajeMadera;

    const bagazoEnTolvasTon =
      totalTolvasTon * porcentajeBagazo;

    /*
     * El inventario de patio debe llegar desde el resumen de la API.
     * Se admiten varios nombres para mantener compatibilidad.
     * No se usa inventarioFinalCarbon/inventarioFinalMadera como respaldo,
     * porque esos campos pueden incluir ya la fracción de las tolvas.
     */
    const stockPatioCarbonTon =
      obtenerPrimerNumeroDisponible(
        carbon?.inventarioFinalPatioTon,
        carbon?.stockPatioTon,
        carbon?.inventarioPatioTon,
        resumen?.inventarioFinalCarbonPatio,
        resumen?.stockPatioCarbon,
        resumenConsumosCombustibles
          ?.inventarioFinalCarbonPatio,
        resumenConsumosCombustibles
          ?.stockPatioCarbon
      );

    const stockPatioMaderaTon =
      obtenerPrimerNumeroDisponible(
        madera?.inventarioFinalPatioTon,
        madera?.stockPatioTon,
        madera?.inventarioPatioTon,
        resumen?.inventarioFinalMaderaPatio,
        resumen?.stockPatioMadera,
        resumenConsumosCombustibles
          ?.inventarioFinalMaderaPatio,
        resumenConsumosCombustibles
          ?.stockPatioMadera
      );

    const stockPatioBagazoTon =
      obtenerPrimerNumeroDisponible(
        bagazo?.inventarioFinalPatioTon,
        bagazo?.stockPatioTon,
        bagazo?.inventarioPatioTon,
        resumen?.inventarioFinalBagazoPatio,
        resumen?.stockPatioBagazo,
        resumenConsumosCombustibles
          ?.inventarioFinalBagazoPatio,
        resumenConsumosCombustibles
          ?.stockPatioBagazo
      );

    const stockTotalCarbonTon =
      stockPatioCarbonTon === null
        ? null
        : stockPatioCarbonTon +
          carbonEnTolvasTon;

    const stockTotalMaderaTon =
      stockPatioMaderaTon === null
        ? null
        : stockPatioMaderaTon +
          maderaEnTolvasTon;

    const stockTotalBagazoTon =
      stockPatioBagazoTon === null
        ? null
        : stockPatioBagazoTon +
          bagazoEnTolvasTon;

    const observacion = String(
      resumenConsumosCombustibles
        ?.observacion || ""
    ).trim();

    const tieneConsumos =
      Number(
        total?.consumoTon || 0
      ) !== 0 ||
      Number(
        total?.ajusteTon || 0
      ) !== 0 ||
      Number(
        total?.paladasCV || 0
      ) !== 0 ||
      Number(
        total?.paladasCN || 0
      ) !== 0 ||
      materiales.length > 0;

    doc.setFont(
      "times",
      "bold"
    );

    doc.setFontSize(13);

    doc.setTextColor(
      41,
      128,
      185
    );

    doc.text(
      `CONSUMOS DE COMBUSTIBLES — ${fechaConsumos}`,
      TABLE_MARGIN_X,
      startY,
      {
        maxWidth: TABLE_CONTENT_WIDTH,
      }
    );

    autoTable(doc, {

      tableWidth: TABLE_CONTENT_WIDTH,
      startY: startY + 5,

      head: [
        [
          "Material",
          "Paladas CV",
          "Paladas CN",
          "Consumo (t)",
          "% mezcla",
          "Ajuste (t)",
        ],
      ],

      body: [
        [
          "Carbón",

          formatearNumero(
            carbon?.paladasCV,
            2
          ),

          formatearNumero(
            carbon?.paladasCN,
            2
          ),

          formatearNumero(
            carbon?.consumoTon,
            4
          ),

          formatearPorcentaje(
            porcentajeCarbon,
            1
          ),

          formatearNumero(
            carbon?.ajusteTon,
            4
          ),
        ],

        [
          "Madera",

          formatearNumero(
            madera?.paladasCV,
            2
          ),

          formatearNumero(
            madera?.paladasCN,
            2
          ),

          formatearNumero(
            madera?.consumoTon,
            4
          ),

          formatearPorcentaje(
            porcentajeMadera,
            1
          ),

          formatearNumero(
            madera?.ajusteTon,
            4
          ),
        ],

        [
          "Bagazo",

          formatearNumero(
            bagazo?.paladasCV,
            2
          ),

          formatearNumero(
            bagazo?.paladasCN,
            2
          ),

          formatearNumero(
            bagazo?.consumoTon,
            4
          ),

          formatearPorcentaje(
            porcentajeBagazo,
            1
          ),

          formatearNumero(
            bagazo?.ajusteTon,
            4
          ),
        ],

        [
          "TOTAL",

          formatearNumero(
            total?.paladasCV,
            2
          ),

          formatearNumero(
            total?.paladasCN,
            2
          ),

          formatearNumero(
            total?.consumoTon,
            4
          ),

          formatearPorcentaje(
            consumoTotalMezclaTon > 0
              ? 1
              : 0,
            1
          ),

          formatearNumero(
            total?.ajusteTon,
            4
          ),
        ],
      ],

      theme: "striped",

      showHead: "everyPage",

      rowPageBreak: "avoid",

      styles: {
        font: "DejaVuSans",
        textColor: PDF_COLORS.text,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.12,
        overflow: "linebreak",
        fontSize: 8.3,
        cellPadding: 2.2,
        valign: "middle",
      },

      headStyles: {
        fillColor: [
          180,
          83,
          9,
        ],

        textColor: 255,
        halign: "center",
      },

      columnStyles: {
        0: {
          cellWidth: 35,
          fontStyle: "bold",
          halign: "left",
        },

        1: {
          cellWidth: 26,
          halign: "right",
        },

        2: {
          cellWidth: 26,
          halign: "right",
        },

        3: {
          cellWidth: 32,
          halign: "right",
        },

        4: {
          cellWidth: 28,
          halign: "right",
          fontStyle: "bold",
        },

        5: {
          cellWidth: 29,
          halign: "right",
        },
      },

      didParseCell(data) {
        if (
          data.section ===
            "body" &&
          data.row.index === 3
        ) {
          data.cell.styles.fontStyle =
            "bold";

          data.cell.styles.fillColor =
            [255, 247, 237];
        }
      },

      margin: {
        left: TABLE_MARGIN_X,
        right: TABLE_MARGIN_X,
      },
    });

    startY =
      doc.lastAutoTable.finalY +
      8;

    /*
     * Detalle por proveedor o tipo de material.
     */
    if (materiales.length) {
      startY = asegurarEspacio(
        doc,
        startY,
        50
      );

      doc.setFont(
        "times",
        "bold"
      );

      doc.setFontSize(11);

      doc.setTextColor(
        41,
        128,
        185
      );

      doc.text(
        "Detalle de consumo por material",
        14,
        startY
      );

      autoTable(doc, {

        tableWidth: TABLE_CONTENT_WIDTH,
        startY: startY + 3,

        head: [
          [
            "Material",
            "Proveedor",
            "P. CV",
            "P. CN",
            "Consumo (t)",
            "Ajuste (t)",
          ],
        ],

        body: materiales.map(
          (item) => [
            item?.material ||
              "Sin definir",

            item?.proveedor ||
              "Sin definir",

            formatearNumero(
              item?.paladasCV,
              2
            ),

            formatearNumero(
              item?.paladasCN,
              2
            ),

            formatearNumero(
              item?.consumoTon,
              4
            ),

            formatearNumero(
              item?.ajusteTon,
              4
            ),
          ]
        ),

        theme: "striped",

        showHead: "everyPage",

        rowPageBreak: "avoid",

        styles: {
          font: "DejaVuSans",
          textColor: PDF_COLORS.text,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.12,
          overflow: "linebreak",
          fontSize: 7.4,
          cellPadding: 1.7,
          valign: "middle",
        },

        headStyles: {
          fillColor: [
            194,
            65,
            12,
          ],

          textColor: 255,
          halign: "center",
        },

        columnStyles: {
          0: {
            cellWidth: 28,
            halign: "left",
          },

          1: {
            cellWidth: 55,
            halign: "left",
          },

          2: {
            cellWidth: 22,
            halign: "right",
          },

          3: {
            cellWidth: 22,
            halign: "right",
          },

          4: {
            cellWidth: 27,
            halign: "right",
          },

          5: {
            cellWidth: 22,
            halign: "right",
          },
        },

        margin: {
          left: TABLE_MARGIN_X,
          right: TABLE_MARGIN_X,
        },
      });

      startY =
        doc.lastAutoTable.finalY +
        8;
    }

    /*
     * Lecturas de tolvas registradas en la fecha.
     */
    startY = asegurarEspacio(
      doc,
      startY,
      35
    );

    doc.setFont(
      "times",
      "bold"
    );

    doc.setFontSize(11);

    doc.setTextColor(
      41,
      128,
      185
    );

    doc.text(
      "Lecturas registradas de tolvas",
      TABLE_MARGIN_X,
      startY,
      {
        maxWidth: TABLE_CONTENT_WIDTH,
      }
    );

    autoTable(doc, {

      tableWidth: TABLE_CONTENT_WIDTH,
      startY: startY + 3,

      head: [
        [
          "Tolva principal",
          "Tolvas auxiliares",
          "Total tolvas",
        ],
      ],

      body: [
        [
          formatearNumero(
            tolvas?.principal,
            4
          ),

          formatearNumero(
            tolvas?.auxiliares,
            4
          ),

          formatearNumero(
            tolvas?.total,
            4
          ),
        ],
      ],

      theme: "striped",

      showHead: "everyPage",

      rowPageBreak: "avoid",

      styles: {
        font: "DejaVuSans",
        textColor: PDF_COLORS.text,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.12,
        overflow: "linebreak",
        fontSize: 8.5,
        cellPadding: 2.5,
        halign: "right",
        valign: "middle",
      },

      headStyles: {
        fillColor: [
          120,
          53,
          15,
        ],

        textColor: 255,
        halign: "center",
      },

      columnStyles: {
        0: {
          cellWidth: 58,
        },

        1: {
          cellWidth: 58,
        },

        2: {
          cellWidth: 60,
          fontStyle: "bold",
        },
      },

      margin: {
        left: TABLE_MARGIN_X,
        right: TABLE_MARGIN_X,
      },
    });

    startY =
      doc.lastAutoTable.finalY +
      8;

    /*
     * Observación registrada en el módulo de consumos.
     */
    if (observacion) {
      startY = asegurarEspacio(
        doc,
        startY,
        30
      );

      autoTable(doc, {

        tableWidth: TABLE_CONTENT_WIDTH,
        startY,

        head: [
          [
            "Observación del registro",
          ],
        ],

        body: [
          [
            observacion,
          ],
        ],

        theme: "striped",

        showHead: "everyPage",

        rowPageBreak: "avoid",

        styles: {
          font: "DejaVuSans",
          textColor: PDF_COLORS.text,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.12,
          overflow: "linebreak",
          fontSize: 8.5,
          cellPadding: 3,
          valign: "top",
        },

        headStyles: {
          fillColor: [
            100,
            116,
            139,
          ],

          textColor: 255,
          halign: "center",
        },

        margin: {
          left: TABLE_MARGIN_X,
          right: TABLE_MARGIN_X,
        },
      });

      startY =
        doc.lastAutoTable.finalY +
        8;
    }

    /*
     * Resumen final de consumo, mezcla e inventario disponible.
     * Stock total = inventario final de patio + participación en tolvas.
     */
    startY = asegurarEspacio(
      doc,
      startY,
      55
    );

    doc.setFont(
      "times",
      "bold"
    );

    doc.setFontSize(11);
    doc.setTextColor(41, 128, 185);

    doc.text(
      "Resumen final de combustibles",
      TABLE_MARGIN_X,
      startY,
      {
        maxWidth: TABLE_CONTENT_WIDTH,
      }
    );

    const filasResumenCombustibles = [
      [
        "Carbón",
        formatearNumero(
          consumoCarbonTon,
          4
        ),
        formatearPorcentaje(
          porcentajeCarbon,
          1
        ),
        stockPatioCarbonTon === null
          ? "—"
          : formatearNumero(
              stockPatioCarbonTon,
              4
            ),
        formatearNumero(
          carbonEnTolvasTon,
          4
        ),
        stockTotalCarbonTon === null
          ? "—"
          : formatearNumero(
              stockTotalCarbonTon,
              4
            ),
      ],
      [
        "Madera",
        formatearNumero(
          consumoMaderaTon,
          4
        ),
        formatearPorcentaje(
          porcentajeMadera,
          1
        ),
        stockPatioMaderaTon === null
          ? "—"
          : formatearNumero(
              stockPatioMaderaTon,
              4
            ),
        formatearNumero(
          maderaEnTolvasTon,
          4
        ),
        stockTotalMaderaTon === null
          ? "—"
          : formatearNumero(
              stockTotalMaderaTon,
              4
            ),
      ],
    ];

    const incluirBagazoResumen =
      consumoBagazoTon !== 0 ||
      stockPatioBagazoTon !== null ||
      bagazoEnTolvasTon !== 0;

    if (incluirBagazoResumen) {
      filasResumenCombustibles.push([
        "Bagazo",
        formatearNumero(
          consumoBagazoTon,
          4
        ),
        formatearPorcentaje(
          porcentajeBagazo,
          1
        ),
        stockPatioBagazoTon === null
          ? "—"
          : formatearNumero(
              stockPatioBagazoTon,
              4
            ),
        formatearNumero(
          bagazoEnTolvasTon,
          4
        ),
        stockTotalBagazoTon === null
          ? "—"
          : formatearNumero(
              stockTotalBagazoTon,
              4
            ),
      ]);
    }

    autoTable(doc, {
      tableWidth: TABLE_CONTENT_WIDTH,
      startY: startY + 3,

      head: [
        [
          "Material",
          "Consumo total (t)",
          "% mezcla",
          "Stock patio (t)",
          "Participación tolvas (t)",
          "Stock total (t)",
        ],
      ],

      body: filasResumenCombustibles,
      theme: "striped",
      showHead: "everyPage",
      rowPageBreak: "avoid",

      styles: {
        font: "DejaVuSans",
        textColor: PDF_COLORS.text,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.12,
        overflow: "linebreak",
        fontSize: 7.2,
        cellPadding: 1.8,
        valign: "middle",
      },

      headStyles: {
        fillColor: [120, 53, 15],
        textColor: 255,
        halign: "center",
      },

      columnStyles: {
        0: {
          cellWidth: 28,
          fontStyle: "bold",
        },
        1: {
          cellWidth: 28,
          halign: "right",
        },
        2: {
          cellWidth: 23,
          halign: "right",
        },
        3: {
          cellWidth: 31,
          halign: "right",
        },
        4: {
          cellWidth: 34,
          halign: "right",
        },
        5: {
          cellWidth: 32,
          halign: "right",
          fontStyle: "bold",
        },
      },

      didParseCell(data) {
        if (
          data.section === "body" &&
          data.column.index === 5
        ) {
          data.cell.styles.fillColor =
            [255, 247, 237];
        }
      },

      margin: {
        left: TABLE_MARGIN_X,
        right: TABLE_MARGIN_X,
      },
    });

    startY =
      doc.lastAutoTable.finalY +
      8;

    const faltaStockPatio =
      stockPatioCarbonTon === null ||
      stockPatioMaderaTon === null;

    if (faltaStockPatio) {
      startY = asegurarEspacio(
        doc,
        startY,
        25
      );

      autoTable(doc, {
        tableWidth: TABLE_CONTENT_WIDTH,
        startY,
        body: [
          [
            "Nota",
            "Para calcular el stock total, la API debe enviar el inventario final de patio por material mediante inventarioFinalPatioTon, inventarioFinalCarbonPatio/inventarioFinalMaderaPatio o stockPatioCarbon/stockPatioMadera.",
          ],
        ],
        theme: "plain",
        styles: {
          font: "DejaVuSans",
          textColor: PDF_COLORS.text,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.12,
          fontSize: 7.2,
          cellPadding: 2.2,
          valign: "top",
        },
        columnStyles: {
          0: {
            cellWidth: 22,
            fontStyle: "bold",
            textColor: [180, 83, 9],
          },
          1: {
            cellWidth: 154,
          },
        },
        margin: {
          left: TABLE_MARGIN_X,
          right: TABLE_MARGIN_X,
        },
      });

      startY =
        doc.lastAutoTable.finalY +
        8;
    }

    /*
     * Mensaje cuando no existen movimientos de consumo.
     */
    if (!tieneConsumos) {
      startY = asegurarEspacio(
        doc,
        startY,
        30
      );

      autoTable(doc, {

        tableWidth: TABLE_CONTENT_WIDTH,
        startY,

        head: [
          [
            "Información",
          ],
        ],

        body: [
          [
            resumenConsumosCombustibles
              ?.mensaje ||
              "No se registraron consumos de combustibles para la fecha consultada.",
          ],
        ],

        theme: "striped",

        showHead: "everyPage",

        rowPageBreak: "avoid",

        styles: {
          font: "DejaVuSans",
          textColor: PDF_COLORS.text,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.12,
          overflow: "linebreak",
          fontSize: 9,
          cellPadding: 3,
          valign: "middle",
        },

        headStyles: {
          fillColor: [
            100,
            116,
            139,
          ],

          textColor: 255,
          halign: "center",
        },

        margin: {
          left: TABLE_MARGIN_X,
          right: TABLE_MARGIN_X,
        },
      });

      startY =
        doc.lastAutoTable.finalY +
        10;
    }
  }

  /*
   * Pie de página.
   * Se calcula después de agregar toda la información.
   */
  const pageCount =
    doc.getNumberOfPages();

  for (
    let pageNumber = 1;
    pageNumber <= pageCount;
    pageNumber += 1
  ) {
    doc.setPage(pageNumber);

    doc.setFont(
      "times",
      "normal"
    );

    doc.setFontSize(9);

    doc.setTextColor(150);

    doc.text(
      `Página ${pageNumber} de ${pageCount}`,
      105,
      290,
      {
        align: "center",
      }
    );

    doc.text(
      "Ambiocom SAS © 2026",
      105,
      296,
      {
        align: "center",
      }
    );
  }

  const turnoNameExported =
    turnosShorted.find(
      (turno) =>
        turno.value ===
        headerData.turno
    )?.short || "T0000";

  doc.save(
    `bitacora_${
      headerData.fecha ||
      "sin_fecha"
    }_${
      turnoNameExported ||
      "sin_turno"
    }.pdf`
  );
}

function toBase64(url) {
  return new Promise(
    (resolve, reject) => {
      const img = new Image();

      img.setAttribute(
        "crossOrigin",
        "anonymous"
      );

      img.onload = () => {
        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width = img.width;
        canvas.height = img.height;

        const context =
          canvas.getContext("2d");

        if (!context) {
          reject(
            new Error(
              "No fue posible crear el contexto para cargar el logo."
            )
          );

          return;
        }

        context.drawImage(
          img,
          0,
          0
        );

        resolve(
          canvas.toDataURL(
            "image/png"
          )
        );
      };

      img.onerror = () => {
        reject(
          new Error(
            `No fue posible cargar el logo desde ${url}.`
          )
        );
      };

      img.src = url;
    }
  );
}