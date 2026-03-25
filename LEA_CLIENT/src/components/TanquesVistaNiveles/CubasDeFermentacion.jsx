import React, { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";

import RenderizarGraficoDiarioPorTanque from "../SeguimientoTanquesJornaleros/utils_seguimientoTanquesJornaleros/modals_seguimientoTanquesJornaleros/RenderizarGraficoDiarioPorTanque";

const CubaDeFermentacion = ({ tanquesContext, NivelesTanquesContext }) => {
  const [modalOpenGraficaTanque, setModalOpenGraficaTanque] = useState(false);
  const [tanqueSeleccionado, setTanqueSeleccionado] = useState(null);
  const [tanques, setTanques] = useState([])
  //guardaremos el último registro en la DB de cada tanque 
  const [tanquesNivelesFiltered, setTanquesNivelesFiltered] = useState([]);
  //Captura la fecha del ultimo registro
  const [ultimoRegistroGlobal, setUltimoRegistroGlobal] = useState(null);
  //Captura el factor para enviar al modal rendergrafica
  const [factorSeleccionado, setFactorSeleccionado] = useState(null);

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
          marginTop: 250,
        }}
      >
        {tanques.map(
          ({ NombreTanque, ancho = 365, Disposicion, Factor = 1, VolumenTotal = 1000 }, index) => {
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
                    top: "-19%",
                    left: "11%",
                    transform: "translateX(-50%)",
                    width: "16px",
                    height: "95%",
                    backgroundColor: "#d6c8c8",
                    borderRadius: "5px",
                    border: "1px solid #918d8d",
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
                <Typography sx={{ fontSize: '18px' }}><strong>Capacidad:</strong> {Number(VolumenTotal).toLocaleString('es-ES')}  L</Typography>
                <Typography sx={{ fontSize: '18px' }}><strong>Factor: </strong>{Number(Factor).toLocaleString('es-ES')} L/m</Typography>
                <img
                  src={"/TanquesAlmacenamiento/tanque5.png"}
                  alt={`Tanque ${NombreTanque}`}
                  style={{ width: `${ancho}px`, height: "auto", zIndex: 1 }}
                />

                <div>   <strong>Volumen:</strong> {Number(nivel * Factor || 0).toLocaleString('es-ES', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 1
                })} L
                </div>
                <div style={{ marginTop: 5 }}><strong>Nivel:</strong>: {nivel} cm</div>

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
                    top: "-2%",
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
        factorTanque={factorSeleccionado}
      />
    </div>
  );
};

export default CubaDeFermentacion;
