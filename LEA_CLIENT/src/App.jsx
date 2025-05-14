import {React, Fragment} from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom'

import SGMRC from './components/SGMRC';
import MesesCerrados from './components/MesesCerrados';
import UploadFile from './components/UploadFile'
import SeguimientoTKJornaleros from './components/SeguimientoTKJornaleros';
import CodificacionDeColoresComponent from './components/CodificacionDeColores';
import UploadExcelTanquesDiariosMasivo from './utils/Functions/UploadExcelTanquesDiariosMasivo'
import { Typography } from '@mui/material';


function App() {
  return (
    <div>
     <Fragment>   
      <BrowserRouter>
       <Routes>
        <Route path='/' element = {<SGMRC/>}/>
        <Route path="/upload/:rowId" element = {<UploadFile/>}/>
        <Route path="/colors" element = {<CodificacionDeColoresComponent/>}/>
        <Route path="/mesescerrados" element = {<MesesCerrados/>}/>
        <Route path="/seguimientotanquesjornaleros" element = {<SeguimientoTKJornaleros/>}/>
        <Route path="/cargamasivatanquesjornaleros" element = {<UploadExcelTanquesDiariosMasivo/>}/>
       </Routes>
      </BrowserRouter>
     </Fragment>
    </div>
  );
}

export default App;
