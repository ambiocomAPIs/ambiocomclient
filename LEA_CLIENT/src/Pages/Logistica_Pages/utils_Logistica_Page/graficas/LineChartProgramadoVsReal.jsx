import React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Box, Grid } from "@mui/material";

import CollapsibleSection from "./CollapsibleSection";

const LineChartProgramadoVsReal = ({
  seriesPorDia,
  formatNumber,
  formatNumber1D,
}) => (
  <Grid item xs={12}>
    <CollapsibleSection
      title="KPI (V.Real - V.Programado) Volumen Real Despachado vs Volumen Programado/Facturado (por día)"
      chipLabel="Lineal Charts KPI"
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
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={seriesPorDia}
            margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="fecha" />

            <YAxis
              tickFormatter={(v) => formatNumber1D(v)}
              domain={[
                (dataMin) => dataMin - 20000,
                (dataMax) => dataMax * 1.25,
              ]}
            />

            <ReferenceLine
              y={0}
              stroke="#111827"
              strokeDasharray="4 4"
              strokeWidth={1}
              ifOverflow="extendDomain"
            />

            <RTooltip formatter={(v) => formatNumber(v)} />

            <Legend />

            <Line
              type="monotone"
              dataKey="programado"
              name="Programado / Facturado"
              stroke="#1976d2"
              strokeWidth={2}
              dot={{ r: 3 }}
            />

            <Line
              type="monotone"
              dataKey="real"
              name="Real despachado"
              stroke="#2e7d32"
              strokeWidth={4}
              dot={{ r: 3 }}
            />

            <Line
              type="natural"
              dataKey="diff"
              name="Diferencia"
              stroke="#ed6c02"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </CollapsibleSection>
  </Grid>
);

export default LineChartProgramadoVsReal;