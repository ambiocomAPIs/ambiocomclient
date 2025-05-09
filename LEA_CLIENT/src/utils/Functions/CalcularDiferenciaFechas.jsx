// CalcularDiferenciaFechas.js
export const calcularDiferenciaEnMeses = (fecha1, fecha2) => {
    const fecha1Obj = new Date(fecha1);
    const fecha2Obj = new Date(fecha2);
  
    const diferenciaEnAnios = fecha2Obj.getFullYear() - fecha1Obj.getFullYear();
    const diferenciaEnMeses = fecha2Obj.getMonth() - fecha1Obj.getMonth();
  
    const diferenciaTotalMeses = diferenciaEnAnios * 12 + diferenciaEnMeses;
  
    return diferenciaTotalMeses;
  };
  