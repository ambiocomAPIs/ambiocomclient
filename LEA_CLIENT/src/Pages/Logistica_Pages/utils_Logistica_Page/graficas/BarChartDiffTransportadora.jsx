import React from "react";
import { Grid } from "@mui/material";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import CollapsibleSection from "./CollapsibleSection";

const BarChartDiffTransportadora = ({ seriesPosNegPorTransportadora, colorByTransportadora, formatNumber, formatNumber1D }) => (
  <Grid item xs={12}>
  <CollapsibleSection
    title="KPI acumulado Diferencia (Volumen Programado -Volumen Cliente) por transportadora"
    subtitle="Regla: Los acumulados positivos y negativos se visualizan por transportadora para analizar las variaciones de volumen de cada ítem."
    chipLabel="Divergent Chart Analisys"
    defaultOpen={false}
    paperSx={{
      p: { xs: 2, md: 2.5 },
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      background:
        "linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 45%, rgba(239,246,255,1) 100%)",
    }}
  >
    {/* ✅ Más alto para que se “llene” el área */}
    <ResponsiveContainer width="100%" height={520}>
      <BarChart
        data={seriesPosNegPorTransportadora}
        margin={{ top: 16, right: 18, left: 10, bottom: 52 }} // ✅ menos bottom
        barCategoryGap="12%" // ✅ barras más anchas
        barGap={4}
      >
        {/* Patrón para NEGATIVOS (rayado) */}
        <defs>
          <pattern
            id="negStripes"
            patternUnits="userSpaceOnUse"
            width="6"
            height="6"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              stroke="rgba(17,24,39,0.55)"
              strokeWidth="2"
            />
          </pattern>
        </defs>

        <CartesianGrid strokeDasharray="3 3" vertical={false} />

        <XAxis
          dataKey="transportadora"
          interval={0}
          angle={-15}
          textAnchor="end"
          height={70}
          tick={{ fontSize: 12 }}
          tickMargin={10}
        />

        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => formatNumber(v)}
          domain={[
            (dataMin) => dataMin * 1.25,
            (dataMax) => dataMax * 1.15,
          ]}
        />

        {/* Eje cero */}
        <ReferenceLine
          y={0}
          stroke="#111827"
          strokeWidth={2}
          strokeDasharray="3 3"
        />

        <RTooltip
          formatter={(v, name) => [`${formatNumber(v)} L`, name]}
          labelFormatter={(label) => `Transportadora: ${label}`}
          cursor={{ fill: "rgba(17,24,39,0.06)" }}
        />

        <Legend wrapperStyle={{ paddingTop: 6 }} />

        {/* ===================== POSITIVOS ===================== */}
        <Bar
          dataKey="positivos"
          name="Positivos"
          radius={[3, 10, 0, 0]}
          stroke="rgba(17,24,39,0.35)"
          strokeWidth={0.6}
          maxBarSize={64}
        >
          <LabelList
            dataKey="positivos"
            position="top"
            formatter={(v) => (v ? `${formatNumber(v)}` : "")}
            style={{
              fontSize: 12,
              fill: "#111827",
              fontWeight: 700,
            }}
          />

          {seriesPosNegPorTransportadora.map((d, i) => (
            <Cell
              key={`pos-${i}`}
              fill={colorByTransportadora.get(d.transportadora)}
              fillOpacity={1}
            />
          ))}
        </Bar>

        {/* ===================== NEGATIVOS ===================== */}
        <Bar
          dataKey="negativos"
          name="Negativos"
          radius={[10, 3, 0, 0]}
          stroke="rgba(17, 24, 39, 0.84)"
          strokeWidth={0.6}
          maxBarSize={64}
        >
          <LabelList
            dataKey="negativos"
            position="bottom"
            offset={10}
            formatter={(v) => (v ? `${formatNumber(v)}` : "")}
            style={{
              fontSize: 12,
              fill: "#111827",
              fontWeight: 700,
            }}
          />

          {seriesPosNegPorTransportadora.map((d, i) => (
            <Cell
              key={`neg-${i}`}
              fill={colorByTransportadora.get(d.transportadora)}
              fillOpacity={0.58}
            />
          ))}
        </Bar>

        {/* Capa “rayada” sobre los negativos */}
        <Bar dataKey="negativos" hide>
          {seriesPosNegPorTransportadora.map((_, i) => (
            <Cell key={`neg-stripe-${i}`} fill="url(#negStripes)" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </CollapsibleSection>
    </Grid>
);

export default BarChartDiffTransportadora;
