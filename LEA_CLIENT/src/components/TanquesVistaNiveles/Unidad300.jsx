import React, { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";

import RenderizarGraficoDiarioPorTanque from "../../utils/modals/RenderizarGraficoDiarioPorTanque";

const TanquesUnidadTreCientos = ({ tanquesContext, NivelesTanquesContext }) => {
  const [modalOpenGraficaTanque, setModalOpenGraficaTanque] = useState(false);
  const [tanqueSeleccionado, setTanqueSeleccionado] = useState(null);
  const [tanques, setTanques] = useState([]);
  //guardaremos el último registro en la DB de cada tanque 102A / 102B
  const [tanquesNivelesFiltered, setTanquesNivelesFiltered] = useState([]);
  //Captura la fecha del ultimo registro
  const [ultimoRegistroGlobal, setUltimoRegistroGlobal] = useState(null);

  useEffect(() => {
    if (tanquesContext?.length > 0 && NivelesTanquesContext?.length > 0) {
      // 1. Filtrar solo los tanques que quieras (ej: 102A y 102B)
      const tanquesFiltrados = tanquesContext
        .filter(
          (tanque) =>
            tanque.NombreTanque === "350" ||
            tanque.NombreTanque === "301" ||
            tanque.NombreTanque === "302" ||
            tanque.NombreTanque === "303" ||
            tanque.NombreTanque === "304" ||
            tanque.NombreTanque === "305"
        )
        .sort((a, b) => {
          if (a.NombreTanque === "350") return -1; // a va primero
          if (b.NombreTanque === "350") return 1; // b va después
          return a.NombreTanque.localeCompare(b.NombreTanque); // ordena el resto por nombre
        });
      setTanques(tanquesFiltrados);

      //Buscar en NivelesTanquesContext el último registro por cada tanque fijo
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

      //Guardar en el estado los niveles filtrados
      setTanquesNivelesFiltered(tanquesUltimos);
    }
  }, [tanquesContext, NivelesTanquesContext]);

  const handleDobleClickTanque = (nombreTanque) => {
    setTanqueSeleccionado(nombreTanque);
    setModalOpenGraficaTanque(true);
  };

  const handleNombreChange = (index, nuevoNombre) => {
    const nuevosTanques = [...tanques];
    nuevosTanques[index].diposicion = nuevoNombre;
    setTanques(nuevosTanques);
  };

  const contenedorAltura = 320; // altura fija para alinear los tanques

  return (
    <div style={{ marginTop: 80, textAlign: "center" }}>
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
        Unidad de Fermentacion Tanques de Almacenamiento
      </Typography>
      <div
        style={{
          display: "flex",
          gap: "40px",
          justifyContent: "center",
          alignItems: "flex-end",
          marginTop: 305,
        }}
      >
        {tanques.map(({ NombreTanque, Disposicion, Factor, VolumenTotal }, index) => {
            const nivelTanqueObj = tanquesNivelesFiltered.find(
              (t) => t.NombreTanque === NombreTanque
            );
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
                  width: 250,
                  justifyContent: "flex-end",
                }}
              >
                {/* Barra vertical posicionada absolute encima */}
                <div
                  style={{
                    position: "absolute",
                    top: index === 0 ? "-18%" : "-25%",
                    left: index === 0 ? "15%" : "13%",
                    transform: "translateX(-50%)",
                    width: "16px",
                    height: index === 0 ? "88%" : "95%", // ocupará la altura completa del contenedor (mismo que la imagen)
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
                      height: `${
                        ((nivelTanqueObj?.NivelTanque * Factor) /
                          VolumenTotal) *
                        100
                      }%`,
                      width: "100%",
                      backgroundColor:
                        nivelTanqueObj?.NivelTanque > Number(VolumenTotal) / 2
                          ? "blue"
                          : "orange",
                      transition: "height 0.5s ease",
                    }}
                  />
                </div>
                <Typography style={{ marginBottom: "0px", fontSize: "16px" }}>
                  V total: {VolumenTotal} L
                </Typography>
                <Typography
                  variant="h6"
                  style={{ marginBottom: "-30px", fontSize: "15px" }}
                >
                  Factor: {Factor} L/m
                </Typography>
                <img
                  src={"/TanquesAlmacenamiento/tanque5.png"}
                  alt={`Tanque ${NombreTanque}`}
                  style={{
                    width: NombreTanque === "350" ? "100%" : "108%",
                    height: "auto",
                    zIndex: 1,
                    position: "relative",
                  }}
                />

                {/* ✅ Mostrar el nivel correspondiente a este tanque */}
                {nivelTanqueObj && (
                  <>
                    <div style={{ marginTop: 8, zIndex: 3 }}>
                      {nivelTanqueObj.NivelTanque * Factor} L
                    </div>
                    <div style={{ marginTop: 5, zIndex: 3 }}>
                      {nivelTanqueObj.NivelTanque} m
                    </div>
                  </>
                )}

                <input
                  type="text"
                  readOnly
                  value={NombreTanque}
                  style={{
                    position: "absolute",
                    top: index === 0 ? "-6%" : "-15%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "15px",
                    width: "100px",
                    textAlign: "center",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    padding: "4px",
                    backgroundColor: "rgba(255, 255, 255, 0.8)", // con transparencia para no tapar todo
                    cursor: "default",
                    zIndex: 4,
                  }}
                />
                <input
                  type="text"
                  onChange={(e) => handleNombreChange(index, e.target.value)}
                  value={Disposicion}
                  style={{
                    position: "absolute",
                    top: index === 0 ? "3%" : "-5%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "15px",
                    width: index === 0 ? "130px" : "150px",
                    textAlign: "center",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    padding: "2px",
                    backgroundColor: "rgba(255, 255, 255, 0.8)", // con transparencia para no tapar todo
                    cursor: "default",
                    zIndex: 500,
                  }}
                />
              </div>
            );
          }
        )}
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
      </div>
      <RenderizarGraficoDiarioPorTanque
        modalIsOpen={modalOpenGraficaTanque}
        onClose={() => setModalOpenGraficaTanque(false)}
        // nombreTanque={tanqueSeleccionado}
        nombreTanque={tanqueSeleccionado}
      />
    </div>
  );
};

export default TanquesUnidadTreCientos;
