import {React, Fragment} from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom'

import SGMRC from './components/SGMRC';
import MesesCerrados from './components/MesesCerrados';
import UploadFile from './components/UploadFile'
import SeguimientoTKJornaleros from './components/SeguimientoTKJornaleros';
import CodificacionDeColoresComponent from './components/CodificacionDeColores';
import UploadExcelTanquesDiariosMasivo from './utils/Functions/UploadExcelTanquesDiariosMasivo'
import BitacoraComponentProduccion from './components/Bitacora/BitacoraComponentesProduccion'
import PanelHoras from './components/PanelHoras'
import IngresoPrivado from './components/IngresoPrivado'
import ComponentePrincipalSlidebar from './components/PaginaPrincipal/ComponentePrincipalSlideBar'
import { Typography } from '@mui/material';


function App() {
  return (
    <div>
     <Fragment>   
      <BrowserRouter>
       <Routes>
        <Route path='/' element = {<IngresoPrivado/>}/>
        <Route path='/principal' element = {<ComponentePrincipalSlidebar/>}/>
        <Route path='/seguimientoinsumos' element = {<SGMRC/>}/>
        <Route path='/panelhoras' element = {<PanelHoras/>}/>
        <Route path="/upload/:rowId" element = {<UploadFile/>}/>
        <Route path="/colors" element = {<CodificacionDeColoresComponent/>}/>
        <Route path="/mesescerrados" element = {<MesesCerrados/>}/>
        <Route path="/seguimientotanquesjornaleros" element = {<SeguimientoTKJornaleros/>}/>
        <Route path="/cargamasivatanquesjornaleros" element = {<UploadExcelTanquesDiariosMasivo/>}/>
        <Route path="/bitacoradeturnosproduccion" element = {<BitacoraComponentProduccion/>}/>
       </Routes>
      </BrowserRouter>
     </Fragment>
    </div>
  );
}

export default App;
