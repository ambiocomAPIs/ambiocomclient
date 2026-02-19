import { React, Fragment } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

//contexto Auth
import { AuthProvider } from "./utils/Context/AuthContext/AuthContext";
//modulo que proteje la ruta segun el rol
import RequireRole from "./utils/Context/AuthContext/RequireRole";
//* contextos
import { TanquesProvider } from "./utils/Context/TanquesContext";
import { NivelesDiariosTanquesProvider } from "./utils/Context/NivelesDiariosTanquesContext";
import { EmpleadosProvider } from "./utils/Context/EmpleadosContext";
//* Terminan los contextos

import SGMRC from "./components/Insumos_Modulo/SGMRC";
import MesesCerrados from "./components/Insumos_Modulo/MesesCerrados";
import UploadFile from "./components/Insumos_Modulo/Utils_Insumos/page/UploadFile";
import SeguimientoTKJornaleros from "./components/SeguimientoTanquesJornaleros/SeguimientoTKJornaleros";
import CodificacionDeColoresComponent from "./components/CodificacionColores/CodificacionDeColores";
import BitacoraComponentProduccion from "./components/Bitacora/BitacoraComponentesProduccion";
import PanelHoras from "./components/PanelHoras";
import LoginPrivateAccess from "../src/Login/LoginPrivateAccess";
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
          {/* contexto que pasa el login y autenticacion */}
          <AuthProvider>
            <CombinedProviders>
              <Routes>
                <Route path="/" element={<LoginPrivateAccess />} />
                <Route path="/principal" element={
                  // <RequireRole roles={["admin", "supervisor"]}>   esto solo permite el ingreso a estos modulos
                  <ComponentePrincipalSlidebar />
                  // </RequireRole>
                } />
                <Route path="/seguimientoinsumos" element={<SGMRC />} />
                <Route path="/panelhoras" element={<PanelHoras />} />
                <Route path="/upload/:rowId" element={<UploadFile />} />
                <Route path="/colors" element={<CodificacionDeColoresComponent />} />
                <Route path="/mesescerrados" element={<MesesCerrados />} />
                {/* <Route path="/seguimientotanquesjornaleros" element={
                  <RequireRole roles={["admin", "developer", "liderlogistica"]}>
                    <SeguimientoTKJornaleros />
                  </RequireRole>}
                /> */}
                <Route path="/cargamasivatanquesjornaleros" element={<CargarMasivaTanquesDiariosExcel />} />
                <Route path="/bitacoradeturnosproduccion" element={<BitacoraComponentProduccion />} />
              </Routes>
            </CombinedProviders>
          </AuthProvider>
        </BrowserRouter>
      </Fragment>
    </div>
  );
}

export default App;
