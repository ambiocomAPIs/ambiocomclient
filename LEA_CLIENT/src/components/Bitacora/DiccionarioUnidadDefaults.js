
const DiccionarioUnidadDefault = {
  "TRASLADO" : `
   ㅤ
   se inicia traslado del tanque 402AB al 801AB
   ◉ Hora Inicio: 00:00 
    ➡️ TANQUE 402AB : Inicio=  m Final= m V=  L.
    ➡️ TANQUE 402AB : Inicio=  m Final= m V=  L
   ◉ Hora Finaliza: 00:00 
   ➤ Registrado con Recibo : 240825T3 ✔
   `,
  "RECIRCULACION" : `
   ㅤ
   se inicia recirculacion del tanque 402AB
   ◉ Hora Inicio: 00:00 
   ◉ Hora Finaliza: 00:00 
   `,
  "AGUAS" : ` 
   ㅤ
   ♦ Potable: ppm   lb/d
   ♦ Proceso: ppm   lb/d
   ♦ Balsa 950: 
   ♦ sahara y 921 Op.Normal Niv Bajo-Alto
   ♦ P: Bar
   `,
  U100: "Sin Texto predefinido",
  U200: "Sin Texto predefinido.",
  U300: `
  ㅤ
  ♦ Alimentando Tanque a un flujo de  L/h  
  ♦ Nivel:  m. 
  ♦ Bomba P30x Operando \n`,
  U350: "Bomba 3xx A/B operando",
  U400: `
  ㅤ
  Alimentando del TK  a  L/h nivel:  m. 

  ♦ C403= ♦ C404= ♦ C405= ♦ CB= ♦ CA= .

   ➡️ EXTRANEUTRO:  TK402 AB=  m. 
   ➡️ INDUSTRIAL:   TK403AB=  m \n`,
  U450: "TK402AB llenando, nivel= m  || Bomba MP41 operando || TK402AB Recirculando, nivel= m || TK402AB Trasladando, nivel antes del traslado= m ",
  U500: `
  ㅤ
 ➤ Presión: Psi
 ➤ Domo: %
 ➤ Desaireador: %
 ➤ THogar: °C
 ➤ Tvapor: °C
 ➤ Flujo vapor: lb/h
 ➤ Tolva principal: Toneladas
 ➤ Compuertas:
      ➡️ #1 - 100
      ➡️ #2 - 100
      ➡️ #3 - 50
      ➡️ #4 - 0
 ➤ Lavador de gases: Fuera de línea \n`,
  U550: "Verificación de presión.",
  U600: "Cambio de filtros.",
  U650: "Revisión de sensores.",
  U700: "Análisis de fallas previas.",
  U800: "Limpieza de sistema.",
  U900: "Verificar niveles.",
  U950: "Prueba de rendimiento.",
};


export default DiccionarioUnidadDefault ;