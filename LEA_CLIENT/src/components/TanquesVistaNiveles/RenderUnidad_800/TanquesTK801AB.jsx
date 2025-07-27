// components/Tanques/TanquesTK801AB.js
import { Box, Typography } from "@mui/material";

const tanques = [
  { nombre: "TK801A", nivel: 70, imagen: "/TanquesAlmacenamiento/tanque2.png", ancho: 680 },
  { nombre: "TK801B", nivel: 40, imagen: "/TanquesAlmacenamiento/tanque2.png", ancho: 680 },
];

const contenedorAltura = 460;

const TanquesTK801AB = () => {
  return (
    <Box display="flex" gap="150px" justifyContent="center" alignItems="flex-end" mt={30}>
      {tanques.map(({ nombre, nivel, imagen, ancho }) => (
        <Box key={nombre} position="relative" display="flex" flexDirection="column" alignItems="center" height={contenedorAltura} width={ancho} justifyContent="flex-end">
          <Box
            sx={{
              position: "absolute",
              top: -10,
              left: "20%",
              transform: "translateX(-50%)",
              width: "16px",
              height: "80%",
              backgroundColor: "#ddd",
              borderRadius: "5px",
              border: "1px solid #ccc",
              display: "flex",
              flexDirection: "column-reverse",
              overflow: "hidden",
              zIndex: 2,
            }}
          >
            <Box
              sx={{
                height: `${nivel}%`,
                width: "100%",
                backgroundColor: nivel > 50 ? "blue" : "orange",
                transition: "height 0.5s ease",
              }}
            />
          </Box>

          <Typography variant="h6">F: 285071,42</Typography>

          <img src={imagen} alt={`Tanque ${nombre}`} style={{ width: `${ancho}px`, height: "auto", zIndex: 1, position: "relative" }} />
          <div style={{ marginTop: 8 }}>{nivel * 1000}L</div>
          <div style={{ marginTop: 5 }}>{nivel} cm</div>

          <input
            type="text"
            readOnly
            value={nombre}
            style={{
              position: "absolute",
              top: "5%",
              left: "47%",
              transform: "translate(-50%, -50%)",
              fontSize: "23px",
              width: "100px",
              textAlign: "center",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "4px",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              cursor: "default",
              zIndex: 4,
            }}
          />
        </Box>
      ))}
    </Box>
  );
};

export default TanquesTK801AB;
