import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";

import RenderizarGraficoDiarioPorTanque from "../SeguimientoTanquesJornaleros/utils_seguimientoTanquesJornaleros/modals_seguimientoTanquesJornaleros/RenderizarGraficoDiarioPorTanque";
import { Button } from "@mui/material";

const contenedorAltura = 460;

const RenderTanque = ({
  nombre,
  nivel,
  imagen,
  ancho,
  factor,
  disposicion,
  onDoubleClick,
  volumenTotal,
}) => {
  // Posiciones específicas para solo 3 tanques en el orden de renderizado
  const configPorTanque = {
    "650": {
      indicadorTop: "-13%",
      indicadorLeft: "92%",
      indicadorWidth: "17px",
      indicadorHeight: "84%",
      nombreTop: "0%",
      nombreLeft: "55%",
      disposicionTop: "8%",
      disposicionLeft: "55%",
    },
    "600A": {
      indicadorTop: "14%",
      indicadorLeft: "72%",
      indicadorWidth: "15px",
      indicadorHeight: "61%",
      nombreTop: "30%",
      nombreLeft: "48%",
      disposicionTop: "37%",
      disposicionLeft: "49%",
    },
    "600B": {
      indicadorTop: "14%",
      indicadorLeft: "72%",
      indicadorWidth: "15px",
      indicadorHeight: "61%",
      nombreTop: "30%",
      nombreLeft: "49%",
      disposicionTop: "37%",
      disposicionLeft: "48%",
    },
    "670": {
      indicadorTop: "-20%",
      indicadorLeft: "76%",
      indicadorWidth: "14px",
      indicadorHeight: "91%",
      nombreTop: "5%",
      nombreLeft: "67%",
      disposicionTop: "13%",
      disposicionLeft: "67%",
    },
  };

  const cfg = configPorTanque[nombre] || configPorTanque["650"];
  const litros = nivel * factor;
  const porcentaje = volumenTotal ? (litros / volumenTotal) * 100 : 0;

  return (
    <Box
      onDoubleClick={() => onDoubleClick(nombre)}
      position="relative"
      display="flex"
      flexDirection="column"
      alignItems="center"
      height={contenedorAltura}
      width={ancho}
      justifyContent="flex-end"
      sx={{ cursor: "pointer" }}
    >
      {/* Indicador vertical */}
      <Box
        sx={{
          position: "absolute",
          top: cfg.indicadorTop,
          left: cfg.indicadorLeft,
          transform: "translateX(-50%)",
          width: cfg.indicadorWidth,
          height: cfg.indicadorHeight,
          backgroundColor: "#ddd",
          borderRadius: "6px",
          border: "1px solid #ccc",
          display: "flex",
          flexDirection: "column-reverse",
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            height: `${Math.max(0, Math.min(porcentaje, 100))}%`,
            width: "100%",
            backgroundColor: litros > volumenTotal / 2 ? "blue" : "orange",
            transition: "height 0.5s ease",
          }}
        />
      </Box>

      {/* Datos */}
      <Typography sx={{ fontSize: '18px' }}><strong>Capacidad:</strong> {Number(volumenTotal).toLocaleString('es-ES')}  L</Typography>
      <Typography sx={{ fontSize: '18px' }}><strong>Factor: </strong>{Number(factor).toLocaleString('es-ES')} L/m</Typography>

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
      <strong>Volumen:</strong> {Number(litros || 0).toLocaleString('es-ES', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
      })} L
      <div style={{ marginTop: 5 }}><strong>Nivel:</strong>: {nivel} cm</div>

      {/* Nombre del tanque */}
      <input
        type="text"
        readOnly
        value={nombre}
        style={{
          position: "absolute",
          top: cfg.nombreTop,
          left: cfg.nombreLeft,
          transform: "translate(-50%, -50%)",
          fontSize: "18px",
          width: "100px",
          textAlign: "center",
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "4px",
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          zIndex: 4,
        }}
      />

      {/* Disposición */}
      <input
        type="text"
        readOnly
        value={disposicion || ""}
        style={{
          position: "absolute",
          top: cfg.disposicionTop,
          left: cfg.disposicionLeft,
          transform: "translate(-50%, -50%)",
          fontSize: "14px",
          width: "120px",
          textAlign: "center",
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "3px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          zIndex: 4,
        }}
      />
    </Box>
  );
};

const Unidad600Component = ({ tanquesContext, NivelesTanquesContext }) => {
  const [modalOpenGraficaTanque, setModalOpenGraficaTanque] = useState(false);
  const [tanqueSeleccionado, setTanqueSeleccionado] = useState(null);
  const [tanques, setTanques] = useState([]);
  const [tanquesNivelesFiltered, setTanquesNivelesFiltered] = useState([]);
  const [ultimoRegistroGlobal, setUltimoRegistroGlobal] = useState(null);
  const [factorSeleccionado, setFactorSeleccionado] = useState(null);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState("600");

  useEffect(() => {
    if (tanquesContext?.length > 0 && NivelesTanquesContext?.length > 0) {
      const ordenExacto600 = ["650", "600A", "600B"];
      const ordenExacto670 = ["670"]; // Agregar tanques nuevos si aplica

      const ordenActual =
        unidadSeleccionada === "600" ? ordenExacto600 : ordenExacto670;

      const tanquesFiltrados = tanquesContext
        .filter((tanque) => ordenActual.includes(tanque.NombreTanque))
        .sort(
          (a, b) =>
            ordenActual.indexOf(a.NombreTanque) -
            ordenActual.indexOf(b.NombreTanque)
        );

      setTanques(tanquesFiltrados); // <-- ESTO TE FALTABA

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

          return ultimo;
        })
        .filter(Boolean);

      setTanquesNivelesFiltered(tanquesUltimos);

      if (tanquesUltimos.length > 0) {
        const ultimoGlobal = tanquesUltimos.reduce((prev, curr) => {
          const fechaPrev = new Date(prev.FechaRegistro);
          const fechaCurr = new Date(curr.FechaRegistro);
          return fechaCurr > fechaPrev ? curr : prev;
        });

        setUltimoRegistroGlobal(ultimoGlobal.FechaRegistro);
      } else {
        setUltimoRegistroGlobal(null);
      }
    } else {
      setTanques([]);
      setTanquesNivelesFiltered([]);
      setUltimoRegistroGlobal(null);
    }
  }, [tanquesContext, NivelesTanquesContext, unidadSeleccionada]);

  const handleDobleClickTanque = (nombreTanque) => {
    const tanque = tanques.find((t) => t.NombreTanque === nombreTanque);

    if (tanque) {
      setTanqueSeleccionado(nombreTanque);
      setFactorSeleccionado(tanque.Factor);
      setModalOpenGraficaTanque(true);
    }
  };

  const obtenerImagenTanque = (nombreTanque) => {
    if (nombreTanque === "650") {
      return "/TanquesAlmacenamiento/tanque650.png";
    }

    if (nombreTanque === "600A") {
      return "/TanquesAlmacenamiento/tanque600A.png";
    }
    if (nombreTanque === "600B") {
      return "/TanquesAlmacenamiento/tanque600B.png";
    }
    if (nombreTanque === "670") {
      return "/TanquesAlmacenamiento/tanque670.png";
    }

    return "/TanquesAlmacenamiento/tanqueDefault.png";
  };

  const obtenerAnchoTanque = (nombreTanque) => {
    if (nombreTanque === "650") return 420;
    if (nombreTanque === "600A") return 345;
    if (nombreTanque === "600B") return 340;
    if (nombreTanque === "670") return 1100;
    return 200;
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={8}>
      <Box
        position="relative"
        display="flex"
        alignItems="center"
        width="100%"
        mb={2}
      >
        {/* Título centrado absoluto */}
        <Typography
          variant="h4"
          sx={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            fontWeight: 600,
            color: "#1A237E",
            letterSpacing: 0.5,
          }}
        >
          Unidad de Almacenamiento Tanques {unidadSeleccionada}
        </Typography>

        {/* Botones a la derecha */}
        <Box ml="auto" display="flex" gap={2}>
          <Button
            variant={unidadSeleccionada === "600" ? "contained" : "outlined"}
            onClick={() => setUnidadSeleccionada("600")}
          >
            Unidad 600
          </Button>

          <Button
            variant={unidadSeleccionada === "670" ? "contained" : "outlined"}
            onClick={() => setUnidadSeleccionada("670")}
          >
            Unidad 670
          </Button>
        </Box>
      </Box>

      <Box
        display="flex"
        gap="110px"
        justifyContent="center"
        alignItems="flex-end"
        mt={26}
      >
        {tanques.map((tanque, index) => (
          <RenderTanque
            key={tanque.NombreTanque}
            nombre={tanque.NombreTanque}
            disposicion={tanque.Disposicion}
            nivel={
              tanquesNivelesFiltered.find(
                (t) => t.NombreTanque === tanque.NombreTanque
              )?.NivelTanque ?? 0
            }
            imagen={obtenerImagenTanque(tanque.NombreTanque)}
            ancho={obtenerAnchoTanque(tanque.NombreTanque)}
            factor={tanque.Factor}
            volumenTotal={tanque.VolumenTotal}
            onDoubleClick={handleDobleClickTanque}
          />
        ))}
      </Box>

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
        {ultimoRegistroGlobal || "Sin datos"}
      </Typography>

      <RenderizarGraficoDiarioPorTanque
        modalIsOpen={modalOpenGraficaTanque}
        onClose={() => setModalOpenGraficaTanque(false)}
        nombreTanque={tanqueSeleccionado}
        factorTanque={factorSeleccionado}
      />
    </Box>
  );
};

export default Unidad600Component;