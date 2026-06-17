import React from "react";
import { Box, Grid } from "@mui/material";
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

import CollapsibleSection from "./CollapsibleSection";

const LineChartMermas = ({
  seriesMermasDetalladaFiltrada,
  CustomMermasTooltip,
  formatNumber1D,
}) => (
  <Grid item xs={12}>
    <CollapsibleSection
      title="Análisis de Variaciones de Volumen y Peso en Báscula (Mermas Reportadas por el Cliente)"
      subtitle="Regla: Se analizan todos los datos filtrados programados y no programados a excepcion de aquellos que fueron rechazados en ambiocom o rechazados por el cliente."
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
            data={seriesMermasDetalladaFiltrada}
            margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="item" hide />

            <YAxis
              tickFormatter={(v) => formatNumber1D(v)}
              domain={[
                (dataMin) => dataMin - 5000,
                (dataMax) => dataMax + 5000,
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
              content={<CustomMermasTooltip />}
              offset={20}
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ transform: "translateY(-110%)" }}
              cursor={{ stroke: "#9CA3AF", strokeWidth: 1 }}
            />

            <Legend />

            <Line
              type="monotone"
              dataKey="diffVolCliente"
              name="Diff volumen cliente"
              stroke="#ed6c02"
              strokeWidth={3}
              dot={{ r: 3 }}
            />

            <Line
              type="monotone"
              dataKey="diffPesoCliente"
              name="Diff peso cliente"
              stroke="#9f5bbc"
              strokeWidth={3}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </CollapsibleSection>
  </Grid>
);

export default LineChartMermas;