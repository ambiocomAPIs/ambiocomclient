import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { registerDejaVuFont } from "../../../assets/fonts/DejaVuSans.js";

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
    278
  ) {
    return currentY;
  }

  doc.addPage();

  return 20;
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
  resumenConsumosCombustibles = null
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
      14,
      startY
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
      startY: startY + 4,

      head: [
        [
          "Hora",
          "Descripción",
        ],
      ],

      body: rows,

      theme: "grid",

      styles: {
        font: "DejaVuSans",
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
        left: 14,
        right: 14,
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
      14,
      startY
    );

    autoTable(doc, {
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

      theme: "grid",

      styles: {
        font: "DejaVuSans",
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
        left: 14,
        right: 14,
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

        theme: "grid",

        styles: {
          font: "DejaVuSans",
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
          left: 14,
          right: 14,
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
      14,
      startY
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
      startY: startY + 3,

      head: [
        [
          "Tipo",
          "Detalle",
        ],
      ],

      body: filasAnalisis,

      theme: "grid",

      styles: {
        font: "DejaVuSans",
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
        left: 14,
        right: 14,
      },
    });

    startY =
      doc.lastAutoTable.finalY +
      10;
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
      14,
      startY
    );

    autoTable(doc, {
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

      theme: "grid",

      styles: {
        font: "DejaVuSans",
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
        left: 14,
        right: 14,
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

        theme: "grid",

        styles: {
          font: "DejaVuSans",
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
          left: 14,
          right: 14,
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

        theme: "grid",

        styles: {
          font: "DejaVuSans",
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
          left: 14,
          right: 14,
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
      14,
      startY
    );

    autoTable(doc, {
      startY: startY + 5,

      head: [
        [
          "Material",
          "Paladas CV",
          "Paladas CN",
          "Consumo (t)",
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

          formatearNumero(
            total?.ajusteTon,
            4
          ),
        ],
      ],

      theme: "grid",

      styles: {
        font: "DejaVuSans",
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
          cellWidth: 45,
          fontStyle: "bold",
          halign: "left",
        },

        1: {
          cellWidth: 32,
          halign: "right",
        },

        2: {
          cellWidth: 32,
          halign: "right",
        },

        3: {
          cellWidth: 34,
          halign: "right",
        },

        4: {
          cellWidth: 33,
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
        left: 14,
        right: 14,
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

        theme: "grid",

        styles: {
          font: "DejaVuSans",
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
          left: 14,
          right: 14,
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
      14,
      startY
    );

    autoTable(doc, {
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

      theme: "grid",

      styles: {
        font: "DejaVuSans",
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
        left: 14,
        right: 14,
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

        theme: "grid",

        styles: {
          font: "DejaVuSans",
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
          left: 14,
          right: 14,
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

        theme: "grid",

        styles: {
          font: "DejaVuSans",
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
          left: 14,
          right: 14,
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