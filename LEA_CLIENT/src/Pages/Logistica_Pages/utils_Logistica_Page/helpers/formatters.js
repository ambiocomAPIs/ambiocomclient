export const formatNumber1D = (n) => {
  const x = Number(n);
  if (Number.isNaN(x)) return "0,0";
  return x.toLocaleString("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
};

export const formatNumber = (n) => {
  const x = Number(n);
  if (Number.isNaN(x)) return "0,00";

  return x.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
};

export const getApiErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Ocurrió un error inesperado.";
