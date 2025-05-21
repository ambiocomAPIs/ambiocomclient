import { Grid, TextField, MenuItem, Select, InputLabel, FormControl } from "@mui/material";

function HeaderForm({ data, onChange }) {
  // Array de turnos
  const turnos = [
    { value: "mañana", label: "Turno Mañana (6 AM - 2 PM)" },
    { value: "tarde", label: "Turno Tarde (2 PM - 10 PM)" },
    { value: "noche", label: "Turno Noche (10 PM - 6 AM)" },
  ];

  const fields = [
    { label: "Fecha", key: "fecha", type: "date" },
    { label: "Turno", key: "turno", type: "select" }, // Especificamos que el turno es un select
    { label: "Supervisor", key: "supervisor" },
    { label: "Op. Destilería", key: "op_destileria" },
    { label: "Op. Caldera", key: "op_caldera" },
    { label: "Op. Aguas", key: "op_aguas" },
    { label: "Aux. Caldera", key: "aux_caldera" },
    { label: "Analista 1", key: "analista1" },
    { label: "Analista 2", key: "analista2" },
  ];

  return (
    <Grid container spacing={2} sx={{ marginBottom: 4, marginTop: 2 }}>
      {fields.map((field) => (
        <Grid item xs={12} sm={6} md={4} key={field.key}>
          {/* Si el campo es de tipo "select" (turno), usamos Select en lugar de TextField */}
          {field.type === "select" ? (
            <FormControl fullWidth>
              <InputLabel>Turno</InputLabel>
              <Select
                value={data[field.key] || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                label="Turno"
              >
                {turnos.map((turno) => (
                  <MenuItem key={turno.value} value={turno.value}>
                    {turno.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              fullWidth
              label={field.label}
              type={field.type || "text"}
              value={data[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
              InputLabelProps={field.type === "date" ? { shrink: true } : {}}
            />
          )}
        </Grid>
      ))}
    </Grid>
  );
}

export default HeaderForm;
