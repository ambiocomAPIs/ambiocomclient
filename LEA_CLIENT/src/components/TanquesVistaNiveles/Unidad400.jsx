import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";

import RenderizarGraficoDiarioPorTanque from "../SeguimientoTanquesJornaleros/utils_seguimientoTanquesJornaleros/modals_seguimientoTanquesJornaleros/RenderizarGraficoDiarioPorTanque";

const contenedorAltura = 460;

// Componente base reutilizable
const RenderTanque = ({
  nombre,
  nivel,
  imagen,
  ancho,
  factor,
  diposicion,
  index,
  onDoubleClick,
  volumenTotal,
}) => (
  <Box
    onDoubleClick={() => onDoubleClick(nombre)}
    position="relative"
    display="flex"
    flexDirection="column"
    alignItems="center"
    height={contenedorAltura}
    width={ancho}
    justifyContent="flex-end"
  >
    {console.log("nivel:", nivel)}
    {/* Indicador vertical */}
    <Box
      sx={{
        position: "absolute",
        top:
          index === 0
            ? "15%"
            : index === 1
            ? "5%"
            : index === 2
            ? "5%"
            : index === 3
            ? "-8%"
            : index === 4
            ? "-8%"
            : index === 5
            ? "36%"
            : index === 6
            ? "36%"
            : "51%",
        left:
          index === 0
            ? "27%"
            : index === 1
            ? "24%"
            : index === 2
            ? "24%"
            : index === 3
            ? "16%"
            : index === 4
            ? "16%"
            : index === 5
            ? "21%"
            : index === 6
            ? "21%"
            : "18%",
        transform: "translateX(-50%)",
        width:
          index === 0
            ? "6%"
            : index === 1
            ? "6%"
            : index === 2
            ? "6%"
            : index === 5
            ? "5%"
            : index === 6
            ? "5%"
            : index === 7
            ? "6%"
            : "16px",
        height:
          index === 0
            ? "65%"
            : index === 1
            ? "60%"
            : index === 2
            ? "60%"
            : index === 3
            ? "85%"
            : index === 4
            ? "85%"
            : index === 5
            ? "44%"
            : index === 6
            ? "44%"
            : "30%",
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
          height: `${((nivel * factor) / volumenTotal) * 100}%`,
          width: "100%",
          backgroundColor: nivel > Number(volumenTotal) / 2 ? "blue" : "orange",
          transition: "height 0.5s ease",
        }}
      />
    </Box>

    {/* Factor volumétrico */}
    <Typography variant="h6">
      V total: {volumenTotal.toLocaleString()}
    </Typography>
    <Typography variant="h6">Factor: {factor.toLocaleString()} L/m</Typography>

    {/* Imagen */}
    <img
      src={imagen}
      alt={`Tanque ${nombre}`}
      style={{
        width: `${ancho}px`,
        height: "auto",
        zIndex: 1,
        position: "relative",
      }}
    />

    {/* Litros y altura */}
    <div style={{ marginTop: 8 }}>{(nivel * factor).toLocaleString()} L</div>
    <div style={{ marginTop: 5 }}>{nivel} cm</div>

    {/* Nombre del tanque */}
    <input
      type="text"
      readOnly
      value={nombre}
      style={{
        position: "absolute",
        top:
          index === 0
            ? "42%"
            : index === 1
            ? "10%"
            : index === 2
            ? "10%"
            : index === 3
            ? "5%"
            : index === 4
            ? "5%"
            : index === 5
            ? "68%"
            : index === 6
            ? "68%"
            : "74%",
        left: index === 0 ? "56%" : "52%",
        transform: "translate(-50%, -50%)",
        fontSize:
          index === 1
            ? "15px"
            : index === 2
            ? "15px"
            : index === 5
            ? "15px"
            : index === 6
            ? "15px"
            : index === 7
            ? "15px"
            : "23px",
        width: index === 7 ? "70px" : "100px",
        textAlign: "center",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding:
          index === 5
            ? "2px"
            : index === 6
            ? "2px"
            : index === 7
            ? "2px"
            : "4px",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        cursor: "default",
        zIndex: 4,
      }}
    />
    <input
      type="text"
      onChange={(e) => handleNombreChange(index, e.target.value)}
      value={diposicion}
      style={{
        position: "absolute",
        top:
          index === 0
            ? "50%"
            : index === 1
            ? "15%"
            : index === 2
            ? "15%"
            : index === 3
            ? "13%"
            : index === 4
            ? "13%"
            : index === 5
            ? "74%"
            : index === 6
            ? "74%"
            : "79%",
        left: index === 0 ? "56%" : "52%",
        transform: "translate(-50%, -50%)",
        fontSize: "15px",
        width:
          index === 0
            ? "120px"
            : index === 1
            ? "100px"
            : index === 2
            ? "100px"
            : index === 7
            ? "70px"
            : "120px",
        textAlign: "center",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "2px",
        backgroundColor: "rgba(255, 255, 255, 0.99)",
        cursor: "default",
        zIndex: 4,
      }}
    />
  </Box>
);

const Unidad400Component = ({ tanquesContext, NivelesTanquesContext }) => {
  const [modalOpenGraficaTanque, setModalOpenGraficaTanque] = useState(false);
  const [tanqueSeleccionado, setTanqueSeleccionado] = useState(null);
  const [tanques, setTanques] = useState([]);
  //guardaremos el último registro en la DB de cada tanque 102A / 102B
  const [tanquesNivelesFiltered, setTanquesNivelesFiltered] = useState([]);
  //Captura la fecha del ultimo registro
  const [ultimoRegistroGlobal, setUltimoRegistroGlobal] = useState(null);
  //Captura el factor para enviar al modal rendergrafica
  const [factorSeleccionado, setFactorSeleccionado] = useState(null);


  useEffect(() => {
    if (tanquesContext?.length > 0 && NivelesTanquesContext?.length > 0) {
      const ordenExacto = [
        "405",
        "401A",
        "401B",
        "402A",
        "402B",
        "403A",
        "403B",
        "404",
      ];
      const tanquesFiltrados = tanquesContext
        .filter((tanque) => ordenExacto.includes(tanque.NombreTanque)) // solo los de la lista
        .sort((a, b) => {
          return (
            ordenExacto.indexOf(a.NombreTanque) -
            ordenExacto.indexOf(b.NombreTanque)
          );
        });

      setTanques(tanquesFiltrados);
      //Buscar en NivelesTanquesContext el último registro por cada tanque fijo
      const tanquesUltimos = tanquesFiltrados
        .map((tanque) => {
          const registrosPorTanque = NivelesTanquesContext.filter(
            (nivel) => nivel.NombreTanque === tanque.NombreTanque
          );

          if (registrosPorTanque.length === 0) return null;

          const ultimo = registrosPorTanque.reduce((prev, curr) => {
            const fechaPrev = new Date(prev.FechaRegistro);
            const fechaCurr = new Date(curr.FechaRegistro);
            return fechaCurr > fechaPrev ? curr : prev;
          });

          setUltimoRegistroGlobal(ultimo.FechaRegistro);

          return ultimo;
        })
        .filter(Boolean); // eliminar nulls

      //Guardar en el estado los niveles filtrados
      setTanquesNivelesFiltered(tanquesUltimos);
    }
  }, [tanquesContext, NivelesTanquesContext]);

  const handleDobleClickTanque = (nombreTanque) => {
    const tanque = tanques.find((t) => t.NombreTanque === nombreTanque);
    // setTanqueSeleccionado(nombreTanque);
    // setModalOpenGraficaTanque(true);
    if (tanque) {
      setTanqueSeleccionado(nombreTanque);
      setFactorSeleccionado(tanque.Factor);
      setModalOpenGraficaTanque(true);
    }
  };

  const handleNombreChange = (index, nuevoNombre) => {
    const nuevosTanques = [...tanques];
    nuevosTanques[index].diposicion = nuevoNombre;
    setTanques(nuevosTanques);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={10}>
      {/* Título centrado arriba */}
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 600,
          color: "#1A237E",
          letterSpacing: 0.5,
          textTransform: "none",
        }}
      >
        Unidad de Almacenamiento Tanques Diarios o Jornaleros
      </Typography>

      {/* Tanques alineados abajo */}
      <Box
        display="flex"
        gap="14px"
        justifyContent="center"
        alignItems="flex-end"
        mt={26}
      >
        {tanques.length > 0 &&
          tanques.map((tanque, index) => (
            <RenderTanque
              key={tanque.NombreTanque}
              nombre={tanque.NombreTanque}
              diposicion={tanque.Disposicion}
              nivel={
                tanquesNivelesFiltered.find(
                  (t) => t.NombreTanque === tanque.NombreTanque
                )?.NivelTanque ?? 0
              }
              imagen={
                tanque.NombreTanque === "405"
                  ? "/TanquesAlmacenamiento/tanqueFDE.png"
                  : tanque.NombreTanque.includes("401")
                  ? "/TanquesAlmacenamiento/tanquejornalerotafias.png"
                  : tanque.NombreTanque.includes("402")
                  ? "/TanquesAlmacenamiento/tanque403best.png"
                  : tanque.NombreTanque.includes("403")
                  ? "/TanquesAlmacenamiento/jornaleroindustrial.png"
                  : "/TanquesAlmacenamiento/jornalerofusel.png"
              }
              ancho={
                tanque.NombreTanque === "405"
                  ? 250
                  : tanque.NombreTanque.includes("401")
                  ? 210
                  : tanque.NombreTanque.includes("402")
                  ? 280
                  : tanque.NombreTanque.includes("403")
                  ? 220
                  : 150
              }
              factor={tanque.Factor}
              volumenTotal={tanque.VolumenTotal}
              index={index}
              onDoubleClick={handleDobleClickTanque}
            />
          ))}
      </Box>
      {/* footer ultima fecha registro */}
      <Typography
        variant="body2"
        sx={{
          position: "absolute",
          bottom: 15,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "1.1rem",
          fontWeight: 500,
        }}
      >
        <span style={{ fontWeight: "bold", color: "blue" }}>
          Último Registro:
        </span>{" "}
        {ultimoRegistroGlobal}
      </Typography>

      {/* Modal de gráfico */}
      <RenderizarGraficoDiarioPorTanque
        modalIsOpen={modalOpenGraficaTanque}
        onClose={() => setModalOpenGraficaTanque(false)}
        nombreTanque={tanqueSeleccionado}
        factorTanque={factorSeleccionado}
      />
    </Box>
  );
};

export default Unidad400Component;
