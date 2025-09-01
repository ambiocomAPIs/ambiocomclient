import { React, Fragment } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

//* contextos
import { TanquesProvider } from "./utils/Context/TanquesContext";
import { NivelesDiariosTanquesProvider } from "./utils/Context/NivelesDiariosTanquesContext";
import { EmpleadosProvider } from "./utils/Context/EmpleadosContext";
//* Terminan los contextos

import SGMRC from "./components/SGMRC";
import MesesCerrados from "./components/MesesCerrados";
import UploadFile from "./components/UploadFile";
import SeguimientoTKJornaleros from "./components/SeguimientoTKJornaleros";
import CodificacionDeColoresComponent from "./components/CodificacionDeColores";
import BitacoraComponentProduccion from "./components/Bitacora/BitacoraComponentesProduccion";
import PanelHoras from "./components/PanelHoras";
import IngresoPrivado from "./components/IngresoPrivado";
import ComponentePrincipalSlidebar from "./components/PaginaPrincipal/ComponentePrincipalSlideBar";
import { Typography } from "@mui/material";
import CargarMasivaTanquesDiariosExcel from "./utils/Functions/CargaMasivaNivelesTanques/CargaMasivaNivelesTanquesJornaleros";


export const CombinedProviders = ({ children }) => {
  return (
    <TanquesProvider>
      <NivelesDiariosTanquesProvider>
      <EmpleadosProvider>
        {children}
      </EmpleadosProvider>
      </NivelesDiariosTanquesProvider>
    </TanquesProvider>
  );
};

function App() {
  return (
    <div>
      <Fragment>
        <BrowserRouter>
        <CombinedProviders>

          <Routes>
            <Route path="/" element={<IngresoPrivado />} />

            <Route
              path="/principal"
              element={
                  <ComponentePrincipalSlidebar />
              }
            />

            <Route path="/seguimientoinsumos" element={<SGMRC />} />
            <Route path="/panelhoras" element={<PanelHoras />} />
            <Route path="/upload/:rowId" element={<UploadFile />} />
            <Route
              path="/colors"
              element={<CodificacionDeColoresComponent />}
            />
            <Route path="/mesescerrados" element={<MesesCerrados />} />
            <Route
              path="/seguimientotanquesjornaleros"
              element={<SeguimientoTKJornaleros />}
            />
            <Route
              path="/cargamasivatanquesjornaleros"
              element={<CargarMasivaTanquesDiariosExcel />}
            />
            <Route
              path="/bitacoradeturnosproduccion"
              element={<BitacoraComponentProduccion />}
            />
          </Routes>
          </CombinedProviders>

        </BrowserRouter>
      </Fragment>
    </div>
  );
}

export default App;
