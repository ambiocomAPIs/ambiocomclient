import React from "react";
import { Box, Grid } from "@mui/material";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

import CollapsibleSection from "./CollapsibleSection";

const BarChartCumplimiento = ({
  seriesCumplimientoPorTransportadora,
  hasRechazosAmbiocom,
  hasRechazosCliente,
  formatNumber,
  formatNumber1D,
}) => (
  <Grid item xs={12}>
    <CollapsibleSection
      title="KPI cumplimiento de la programación por transportadora (Cumplidos vs Rechazados)"
      subtitle="Regla: Se analizan según cruce de información entre la programación y los despachos reales, si un vehiculo o Transportadora NO ESTÁ PROGRAMADO no será renderizado en el gráfico."
      chipLabel="KPI Chart Cumplimiento por transportadora"
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
      <Box
        sx={{
          mt: 1.5,
          p: { xs: 1, md: 1.5 },
          borderRadius: 3,
          backgroundColor: "rgba(255,255,255,0.72)",
          border: "1px solid rgba(226,232,240,0.9)",
        }}
      >
        <ResponsiveContainer width="100%" height={360}>
          <BarChart
            data={seriesCumplimientoPorTransportadora}
            margin={{ top: 10, right: 15, left: 5, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="transportadora"
              interval={0}
              angle={-15}
              textAnchor="end"
              height={80}
            />

            <YAxis
              tickFormatter={(v) => formatNumber1D(v)}
              domain={[
                (dataMin) => dataMin * 0 - 5,
                (dataMax) => dataMax + 15,
              ]}
            />

            <ReferenceLine
              y={0}
              stroke="#111827"
              strokeDasharray="4 4"
              strokeWidth={1}
              ifOverflow="extendDomain"
            />

            <RTooltip
              formatter={(val, name) => {
                const map = {
                  programados: "Programados",
                  cumplidos: "Cumplidos",
                  rechazadosAmbiocom: "Rechazados Ambiocom",
                  rechazadosCliente: "Rechazados Cliente",
                  Programados: "Programados",
                  Cumplidos: "Cumplidos",
                  "Rechazados Ambiocom": "Rechazados Ambiocom",
                  "Rechazados Cliente": "Rechazados Cliente",
                };

                return [formatNumber(val), map[name] ?? String(name)];
              }}
            />

            <Legend />

            {/* PROGRAMADOS */}
            <Bar
              dataKey="programados"
              name="Programados"
              fill="#4f51cb"
              radius={[6, 6, 0, 0]}
              label={{
                position: "top",
                offset: 20,
                fill: "#111827",
                fontSize: 12,
                formatter: (v) => `Programados: ${formatNumber(v)}`,
              }}
            />

            {/* CUMPLIDOS */}
            <Bar
              dataKey="cumplidos"
              name="Cumplidos"
              fill="#70a189"
              radius={[6, 6, 0, 0]}
              label={{
                position: "top",
                fill: "#111827",
                fontSize: 12,
                formatter: (v) => `Cumple: ${formatNumber(v)}`,
              }}
            />

            {/* RECHAZADOS AMBIOCOM */}
            {hasRechazosAmbiocom && (
              <Bar
                dataKey="rechazadosAmbiocom"
                name="Rechazados Ambiocom"
                stackId="rechazosambiocom"
                fill="#EF4444"
                radius={[6, 6, 0, 0]}
                label={{
                  position: "top",
                  offset: 5,
                  fill: "#111827",
                  fontSize: 11,
                  formatter: (v) => (v ? `${formatNumber(v)}` : ""),
                }}
              />
            )}

            {/* RECHAZADOS CLIENTE */}
            {hasRechazosCliente && (
              <Bar
                dataKey="rechazadosCliente"
                name="Rechazados Cliente"
                stackId="rechazoscliente"
                fill="#F59E0B"
                radius={[6, 6, 0, 0]}
                label={{
                  position: "top",
                  offset: 5,
                  fill: "#111827",
                  fontSize: 11,
                  formatter: (v) => (v ? ` ${formatNumber(v)}` : ""),
                }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </CollapsibleSection>
  </Grid>
);

export default BarChartCumplimiento;