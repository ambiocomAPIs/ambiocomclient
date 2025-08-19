import React, { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";

import RenderizarGraficoDiarioPorTanque from "../../utils/modals/RenderizarGraficoDiarioPorTanque";

const CubaDeFermentacion = ({ tanquesContext, NivelesTanquesContext }) => {
  const [modalOpenGraficaTanque, setModalOpenGraficaTanque] = useState(false);
  const [tanqueSeleccionado, setTanqueSeleccionado] = useState(null);
  const [tanques, setTanques] = useState([])
  //guardaremos el último registro en la DB de cada tanque 
  const [tanquesNivelesFiltered, setTanquesNivelesFiltered] = useState([]);
  //Captura la fecha del ultimo registro
  const [ultimoRegistroGlobal, setUltimoRegistroGlobal] = useState(null);

  useEffect(() => {
      if (tanquesContext?.length > 0 && NivelesTanquesContext?.length > 0) {
        // 1. Filtrar solo los tanques que quieras (ej: 102A y 102B)
        const tanquesFiltrados = tanquesContext.filter(
          (tanque) =>
            tanque.NombreTanque === "300A" || tanque.NombreTanque === "300B"
        );
        setTanques(tanquesFiltrados);
  
        // 2. Buscar en NivelesTanquesContext el último registro por cada tanque fijo
        const tanquesUltimos = tanquesFiltrados
          .map((tanque) => {
            const registrosPorTanque = NivelesTanquesContext.filter(
              (nivel) => nivel.NombreTanque === tanque.NombreTanque
            );
  
            if (registrosPorTanque.length === 0) return null;
  
            // 3. Seleccionar el último por FechaRegistro
            const ultimo = registrosPorTanque.reduce((prev, curr) => {
              const fechaPrev = new Date(prev.FechaRegistro);
              const fechaCurr = new Date(curr.FechaRegistro);
              return fechaCurr > fechaPrev ? curr : prev;
            });
  
            setUltimoRegistroGlobal(ultimo.FechaRegistro);
  
            return ultimo;
          })
          .filter(Boolean); // eliminar nulls
  
        // 4. Guardar en el estado los niveles filtrados
        setTanquesNivelesFiltered(tanquesUltimos);
      }
    }, [tanquesContext, NivelesTanquesContext]);

  const handleDobleClickTanque = (nombreTanque) => {
    console.log("nombre tanque que llega:", nombreTanque);

    setTanqueSeleccionado(nombreTanque);
    setModalOpenGraficaTanque(true);
  };

  const handleNombreChange = (index, nuevoNombre) => {
    const nuevosTanques = [...tanques];
    nuevosTanques[index].diposicion = nuevoNombre;
    setTanques(nuevosTanques);
  };

  const contenedorAltura = 440; // altura fija para alinear los tanques

  return (
    <div style={{ marginTop: 65, textAlign: "center" }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 600, color: "#1A237E" }}
      >
        Cubas de Fermentacion
      </Typography>

      <div
        style={{
          display: "flex",
          gap: "280px",
          justifyContent: "center",
          alignItems: "flex-end",
          marginTop: 280,
        }}
      >
        {tanques.map(
          ({ NombreTanque, ancho = 370, Disposicion, Factor = 1, VolumenTotal = 1000 }, index) => {
            const nivelObj = tanquesNivelesFiltered[index];
            const nivel = nivelObj?.NivelTanque ?? 0;

            return (
              <div
                key={index}
                onDoubleClick={() => handleDobleClickTanque(NombreTanque)}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: contenedorAltura,
                  width: ancho,
                  justifyContent: "flex-end",
                }}
              >
                {/* Barra vertical */}
                <div
                  style={{
                    position: "absolute",
                    top: "-15%",
                    left: "15%",
                    transform: "translateX(-50%)",
                    width: "16px",
                    height: "95%",
                    backgroundColor: "#ddd",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    display: "flex",
                    flexDirection: "column-reverse",
                    overflow: "hidden",
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      height: `${((nivel * Factor) / VolumenTotal) * 100}%`,
                      width: "100%",
                      backgroundColor:
                        nivel > VolumenTotal / 2 ? "blue" : "orange",
                      transition: "height 0.5s ease",
                    }}
                  />
                </div>

                <Typography variant="h6">VT: {VolumenTotal} L</Typography>
                <Typography variant="h6">F: {Factor} L/m</Typography>

                <img
                  src={"/TanquesAlmacenamiento/tanque5.png"}
                  alt={`Tanque ${NombreTanque}`}
                  style={{ width: `${ancho}px`, height: "auto", zIndex: 1 }}
                />

                <div>{nivel * Factor} L</div>
                <div>{nivel} cm</div>

                <input
                  type="text"
                  readOnly
                  value={NombreTanque}
                  style={{
                    position: "absolute",
                    top: "-10%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "15px",
                    textAlign: "center",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    padding: "4px",
                    backgroundColor: "rgba(255,255,255,0.8)",
                    zIndex: 4,
                  }}
                />
                <input
                  type="text"
                  value={Disposicion ?? ""}
                  style={{
                    position: "absolute",
                    top: "0%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "15px",
                    width: "200px",
                    textAlign: "center",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    padding: "4px",
                    backgroundColor: "rgba(255,255,255,0.8)",
                    zIndex: 400,
                  }}
                />
              </div>
            );
          }
        )}
      </div>

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
        <span style={{ fontWeight: "bold", color: "blue" }}>Último Registro:</span>{" "}
        {ultimoRegistroGlobal}
      </Typography>

      <RenderizarGraficoDiarioPorTanque
        modalIsOpen={modalOpenGraficaTanque}
        onClose={() => setModalOpenGraficaTanque(false)}
        nombreTanque={tanqueSeleccionado}
      />
    </div>
  );
};

export default CubaDeFermentacion;
