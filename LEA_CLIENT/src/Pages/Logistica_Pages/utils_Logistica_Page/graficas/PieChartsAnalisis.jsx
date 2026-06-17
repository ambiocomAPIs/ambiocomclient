import React from "react";
import Swal from "sweetalert2";
import DOMPurify from "dompurify";
import { Box, Grid, IconButton, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip } from "recharts";
import CollapsibleSection from "./CollapsibleSection";

const PieChartsAnalisis = ({
  tolerancia,
  toleranciaKgCliente,
  pieCumplimientoPeso,
  pieTransportadoras,
  pieToleranciaRango,
  pieCumpleVsNoCumple,
  pieCumpleVsNoCumpleHoraProgramada,
  pieCumplimientoFechaEntrega,
}) => (
  <Grid item xs={12}>
    <CollapsibleSection
      title="(KPI) Analisis de Cumplimiento de Programación por transportadora y Diferencias en Volumen."
      subtitle={
        <>
          Regla: Se analizan según cruce de información entre la programación y los despachos reales, si un vehiculo o Transportadora NO ESTÁ PROGRAMADO no será renderizado en el gráfico.{" "}
          <strong>NOTA: Los Rechazos son excluidos de este análisis.</strong>
        </>
      }
      chipLabel="Pie Charts"
      defaultOpen={false}
      paperSx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "rgba(148, 163, 184, 0.35)",
        background:
          "linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 45%, rgba(239,246,255,1) 100%)",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
      }}
    >
      <Grid container spacing={2} justifyContent="center">
        {/* Pie 1 */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ textAlign: "center" }}
              fontWeight="bold"
            >
              KPI cumplimiento por peso neto (Báscula Ambiocom vs Cliente)
              Según Tolerancia: ±{`${toleranciaKgCliente} Kg`}.
            </Typography>

            <Tooltip title="Información del gráfico">
              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  Swal.fire({
                    icon: "info",
                    title: "Cumplimiento por peso neto",
                    html: DOMPurify.sanitize(`
<div style="text-align:left; line-height:1.7">
  <b>Análisis de mermas :</b>
  Este gráfico compara el peso neto registrado
  por la báscula de Ambiocom frente al peso
  recibido por el cliente.<br/><br/>

  <b>Range:</b> Se encuentra dentro la tolerancia.<br/>
  <b>Upper:</b> Diferencias por encima de la tolerancia.<br/>
  <b>Low:</b> Diferencias por debajo de la tolerancia.

</div>
          `),
                    width: 500,
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#7b1fa2",
                  });
                }}
                sx={{
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  "&:hover": {
                    backgroundColor: "#ede9fe",
                  },
                }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <ResponsiveContainer width="100%" height={285}>
            <PieChart>
              <Pie
                data={pieCumplimientoPeso}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                label={({ name, value, percent }) =>
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {pieCumplimientoPeso.map((entry, idx) => (
                  <Cell key={`cell-1-${idx}`} fill={entry.color} />
                ))}
              </Pie>
              <RTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Grid>

        {/* Pie 2 */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ textAlign: "center" }}
              fontWeight="bold"
            >
              Distribución por estados de despachos
            </Typography>

            <Tooltip title="Información del gráfico">
              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  Swal.fire({
                    icon: "info",
                    title: "Distribución de estados en Despachos",
                    html: DOMPurify.sanitize(`
<div style="text-align:left; line-height:1.8">
  
  <b>¿Qué muestra esta gráfica?</b><br/>
  Representa el estado operativo actual de los despachos
  registrados en el sistema según su flujo logístico.<br/><br/>

  <b>Estados agrupados:</b>

  <ul style="padding-left:18px">

    <li>
      <b>En proceso:</b>
      Vehículos en estados:
      <i>En planta, Aprobado Ambiocom, En cargue,
      En tránsito o En cliente.</i>
    </li>

    <li>
      <b>Rechazado:</b>
      Vehículos rechazados en Ambiocom
      o rechazados por el cliente.
    </li>

    <li>
      <b>Cumple:</b>
      Vehículos aprobados por el cliente
      o aprobados con observaciones.
    </li>

  </ul>

  <b>Nota:</b><br/>
  Los porcentajes y cantidades cambian según
  los filtros y rangos de fechas aplicados.
</div>
`),
                    width: 650,
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#7b1fa2",
                  });
                }}
                sx={{
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  "&:hover": {
                    backgroundColor: "#ede9fe",
                  },
                }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <ResponsiveContainer width="100%" height={330}>
            <PieChart>
              <Pie
                data={pieTransportadoras}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                labelLine={{ stroke: "#999", strokeWidth: 1 }}
                label={({
                  cx,
                  cy,
                  midAngle,
                  outerRadius,
                  percent,
                  index,
                  name,
                  value,
                }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 22 + index * 10;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return (
                    <text
                      x={x}
                      y={y}
                      fill="#333"
                      textAnchor={x > cx ? "start" : "end"}
                      dominantBaseline="central"
                      style={{
                        fontSize: "11px",
                        fontWeight: 500,
                      }}
                    >
                      {`${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    </text>
                  );
                }}
              >
                {pieTransportadoras.map((entry, idx) => (
                  <Cell key={`cell-2-${idx}`} fill={entry.color} />
                ))}
              </Pie>

              <RTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Grid>

        {/* Pie 3 */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ textAlign: "center" }}
              fontWeight="bold"
            >
              Estado de cumplimiento del despacho según tolerancia:
              ±{`${(Number(tolerancia ?? 0) * 100).toFixed(2)} %`}
              (En rango / Exceso / Merma)
            </Typography>

            <Tooltip title="Información del gráfico">
              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  Swal.fire({
                    icon: "info",
                    title: "Cumplimiento Volumen por tolerancia 0.2%",
                    html: DOMPurify.sanitize(`
<div style="text-align:left; line-height:1.7">
  <b>Análisis de mermas :</b>
  Este gráfico muestra la diferencia entre el
  volumen programado o facturado y el volumen despachado en planta.<br/><br/>

  <b>En rango:</b> Dentro de la tolerancia permitida de despacho.<br/>
  <b>Por encima:</b> Volumen despachado superior al facturado.<br/>
  <b>Merma:</b> Volumen despachado inferior al facturado.

</div>
          `),
                    width: 500,
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#7b1fa2",
                  });
                }}
                sx={{
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  "&:hover": {
                    backgroundColor: "#ede9fe",
                  },
                }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <ResponsiveContainer width="100%" height={285}>
            <PieChart>
              <Pie
                data={pieToleranciaRango}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                label={({ name, value, percent }) =>
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {pieToleranciaRango.map((entry, idx) => (
                  <Cell key={`cell-tol-${idx}`} fill={entry.color} />
                ))}
              </Pie>
              <RTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Grid>

        {/* Pie 4 */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ textAlign: "center" }}
              fontWeight="bold"
            >
              Cumple vs No cumple Programado vs Despachado
            </Typography>

            <Tooltip title="Información del gráfico">
              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  Swal.fire({
                    icon: "info",
                    title: "Cumple vs No cumple Programacion",
                    html: DOMPurify.sanitize(`
<div style="text-align:left; line-height:1.7">
  Este gráfico compara los registros que tienen
  programación y despacho real contra los que no cumplen
  esa condición.<br/><br/>

  <b>Cumple:</b> Tiene programación y despacho registrado.<br/>
  <b>No cumple:</b> Falta programación o falta despacho.
</div>
          `),
                    width: 500,
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#7b1fa2",
                  });
                }}
                sx={{
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  "&:hover": {
                    backgroundColor: "#ede9fe",
                  },
                }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <ResponsiveContainer width="100%" height={285}>
            <PieChart>
              <Pie
                data={pieCumpleVsNoCumple}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                label={({ name, value, percent }) =>
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {pieCumpleVsNoCumple.map((entry, idx) => (
                  <Cell key={`cell-cumple-${idx}`} fill={entry.color} />
                ))}
              </Pie>
              <RTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Grid>

        {/* pie 5 */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ textAlign: "center" }}
              fontWeight="bold"
            >
              Cumple vs No cumple Hora Programada en Ambiocom
            </Typography>

            <Tooltip title="Información del gráfico">
              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  Swal.fire({
                    icon: "info",
                    title: "Cumplimiento hora programada",
                    html: DOMPurify.sanitize(`
    <div style="text-align:left; line-height:1.7">
      <b>¿Qué mide este indicador?</b><br/>
      Este KPI evalúa si el vehículo llegó a Ambiocom dentro de la ventana de tolerancia definida
      frente a la hora programada en la programación diaria de despachos.<br/><br/>

      <b>Variables comparadas:</b><br/>
      <ul style="margin-top:6px; padding-left:20px;">
        <li><b>Hora programada:</b> se toma del campo <code>horaProgramada</code> del módulo de programación.</li>
        <li><b>Hora de llegada:</b> se toma del campo <code>hora_llegada</code> o <code>horaLlegada</code> del módulo de despachos.</li>
      </ul>

      <b>Cruce de información:</b><br/>
      Para este indicador, la programación y el despacho se cruzan mediante la siguiente llave:<br/>
      <code>fecha + transportadora + cliente + producto + placa</code><br/><br/>

      Este cruce por <b>placa</b> permite diferenciar correctamente varios despachos realizados
      el mismo día para el mismo cliente, producto y transportadora.<br/><br/>

      <b>Criterio de cumplimiento:</b><br/>
      El vehículo cumple si la hora de llegada es menor o igual a la hora programada más
      <b>15 minutos</b> de tolerancia.<br/><br/>

      <b>Ejemplo:</b><br/>
      Hora programada: <b>09:00</b><br/>
      Hora llegada: <b>09:15</b> → Cumple<br/>
      Hora llegada: <b>09:16</b> → No cumple<br/><br/>

      <b>Tratamiento de vehículos rechazados:</b><br/>
      Los vehículos rechazados <b>sí se tienen en cuenta</b> en este indicador, porque el objetivo
      de este KPI es medir la puntualidad de llegada frente a la programación, independientemente
      de si el vehículo fue aprobado o rechazado posteriormente.<br/><br/>

      <b>Sin datos:</b><br/>
      Un registro se clasifica como <b>Sin datos</b> cuando no se encuentra un despacho asociado
      con la misma llave de cruce o cuando falta la hora programada o la hora de llegada.
    </div>
  `),
                    width: 650,
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#7b1fa2",
                  });
                }}
                sx={{
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  "&:hover": {
                    backgroundColor: "#ede9fe",
                  },
                }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <ResponsiveContainer width="100%" height={285}>
            <PieChart>
              <Pie
                data={pieCumpleVsNoCumpleHoraProgramada}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                label={({ name, value, percent }) =>
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {pieCumpleVsNoCumpleHoraProgramada.map((entry, idx) => (
                  <Cell
                    key={`cell-cumple-hora-programada-${idx}`}
                    fill={entry.color}
                  />
                ))}
              </Pie>

              <RTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Grid>

        {/* pie 6 */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ textAlign: "center" }}
              fontWeight="bold"
            >
              KPI cumplimiento fecha estimada de entrega vs fecha real de entrega
            </Typography>

            <Tooltip title="Información del gráfico">
              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  Swal.fire({
                    icon: "info",
                    title: "Cumplimiento fecha de entrega",
                    html: DOMPurify.sanitize(`
    <div style="text-align:left; line-height:1.7">
      <b>¿Qué mide este KPI?</b><br/>
      Compara la fecha estimada de entrega registrada en programación diaria
      contra la fecha real de entrega recibida desde el módulo de despachos.<br/><br/>

      <b>Fórmula:</b><br/>
      % Cumplimiento = (Entregas que cumplen fecha / Total de entregas evaluables) × 100<br/><br/>

      <b>Cumple:</b> La fecha real de entrega es menor o igual a la fecha estimada de entrega.<br/>
      <b>No cumple:</b> La fecha real de entrega es posterior a la fecha estimada de entrega.<br/>
      <b>Sin datos:</b> Falta la fecha estimada o la fecha real. Este caso castiga el KPI.<br/><br/>

      <b>Exclusión:</b><br/>
      Los vehículos rechazados por Ambiocom o rechazados por el cliente no se tienen en cuenta
      en el cálculo y no se renderizan en este gráfico.
    </div>
  `),
                    width: 560,
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#1976d2",
                  });
                }}
                sx={{
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  "&:hover": {
                    backgroundColor: "#e0f2fe",
                  },
                }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <ResponsiveContainer width="100%" height={285}>
            <PieChart>
              <Pie
                data={pieCumplimientoFechaEntrega}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                label={({ name, value, percent }) =>
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {pieCumplimientoFechaEntrega.map((entry, idx) => (
                  <Cell key={`cell-fecha-entrega-${idx}`} fill={entry.color} />
                ))}
              </Pie>
              <RTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Grid>

      </Grid>
    </CollapsibleSection>
  </Grid>
);

export default PieChartsAnalisis;
