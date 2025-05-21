import { Grid } from "@mui/material";
import NoteColumn from "./NoteColumn";

function NoteBoard({ notes, onAddNote }) {
  const sections = [
    { key: "PENDIENTES", title: "Pendientes" },
    { key: "NOVEDADES", title: "Novedades" },
    { key: "DESGLOSE", title: "Desglose de Unidades" },
    { key: "REGISTROS", title: "Listado de Registros" },
  ];

  return (
    <Grid container spacing={2}>
      {sections.map((section) => (
        <Grid item xs={12} md={3} key={section.key}>
          <NoteColumn
            title={section.title}
            notes={notes[section.key]}
            onAdd={(text) => onAddNote(section.key, text)}
          />
        </Grid>
      ))}
    </Grid>
  );
}

export default NoteBoard;
