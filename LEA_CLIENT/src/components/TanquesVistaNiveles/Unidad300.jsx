import React from "react";
import Typography from "@mui/material/Typography";

const tanques = [
    { nombre: "TK300A", nivel: 70, imagen: "/TanquesAlmacenamiento/tanque1.png", ancho: 230 },
    { nombre: "TK300B", nivel: 40, imagen: "/TanquesAlmacenamiento/tanque1.png", ancho: 250 },
    { nombre: "TK300C", nivel: 90, imagen: "/TanquesAlmacenamiento/tanque1.png", ancho: 250 },
    { nombre: "TK300D", nivel: 55, imagen: "/TanquesAlmacenamiento/tanque1.png", ancho: 250 },
    { nombre: "TK300E", nivel: 80, imagen: "/TanquesAlmacenamiento/tanque1.png", ancho: 250 },
    { nombre: "TK300F", nivel: 30, imagen: "/TanquesAlmacenamiento/tanque1.png", ancho: 250 },
];

const TanquesUnidadTreCientos = () => {
    const contenedorAltura = 320; // altura fija para alinear los tanques

    return (
        <div style={{ marginTop: 80, textAlign: "center" }}>
            <Typography
                variant="h4"
                gutterBottom
                sx={{
                    fontWeight: 600,
                    color: '#1A237E',
                    letterSpacing: 0.5,
                    textTransform: 'none'
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
                    marginTop: 230,
                }}
            >

                {tanques.map(({ nombre, nivel, imagen, ancho }, index) => (
                    <div
                        key={index}
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
                        {/* Barra vertical posicionada absolute encima */}
                        <div
                            style={{
                                position: "absolute",
                                top: -20,
                                left: "20%",
                                transform: "translateX(-50%)",
                                width: "16px",
                                height: "80%", // ocupará la altura completa del contenedor (mismo que la imagen)
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
                                    height: `${nivel}%`,
                                    width: "100%",
                                    backgroundColor: nivel > 50 ? "blue" : "orange",
                                    transition: "height 0.5s ease",
                                }}
                            />
                        </div>
                        <Typography variant="h6" style={{ marginBottom: "-30px", fontSize: "16px" }} >
                            F: 285071,42
                        </Typography>
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

                        <div style={{ marginTop: 8, zIndex: 3 }}>{nivel * 1000}L</div>
                        <div style={{ marginTop: 5, zIndex: 3 }}>{nivel} cm</div>


                        <input
                            type="text"
                            readOnly
                            value={nombre}
                            style={{
                                position: "absolute",
                                top: "10%",
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

                    </div>
                ))}
            </div>
        </div>
    );
};

export default TanquesUnidadTreCientos;
