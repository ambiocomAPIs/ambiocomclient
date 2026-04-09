import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  Divider,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

const styleModal = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "95%",
  maxWidth: "450px",
  bgcolor: "background.paper",
  borderRadius: "16px",
  boxShadow: 24,
  p: 3,
};

const ModalClonarDia = ({ open, onClose, onConfirm, loading }) => {
  const [fechaOrigen, setFechaOrigen] = useState("");
  const [fechaDestino, setFechaDestino] = useState("");

  const [loadingOrigen, setLoadingOrigen] = useState(false);
  const [loadingDestino, setLoadingDestino] = useState(false);

  const [origenDisponible, setOrigenDisponible] = useState(null);
  const [destinoDisponible, setDestinoDisponible] = useState(null);

  console.log("monitoreando");
  
  useEffect(() => {
    if (!open) {
      setFechaOrigen("");
      setFechaDestino("");
      setOrigenDisponible(null);
      setDestinoDisponible(null);
      setLoadingOrigen(false);
      setLoadingDestino(false);
    }
  }, [open]);

  useEffect(() => {
    const validarFechaOrigen = async () => {
      if (!fechaOrigen) {
        setOrigenDisponible(null);
        return;
      }

      setLoadingOrigen(true);
      try {
        const res = await axios.get(
          `https://ambiocomserver.onrender.com/api/tanquesjornaleros/porfecha/${fechaOrigen}`
        );

        setOrigenDisponible(res.data?.length > 0);
      } catch (error) {
        console.error("Error validando fecha origen:", error);
        setOrigenDisponible(false);
      } finally {
        setLoadingOrigen(false);
      }
    };

    validarFechaOrigen();
  }, [fechaOrigen]);

  useEffect(() => {
    const validarFechaDestino = async () => {
      if (!fechaDestino) {
        setDestinoDisponible(null);
        return;
      }

      if (fechaOrigen && fechaDestino === fechaOrigen) {
        setDestinoDisponible(false);
        return;
      }

      setLoadingDestino(true);
      try {
        const res = await axios.get(
          `https://ambiocomserver.onrender.com/api/tanquesjornaleros/porfecha/${fechaDestino}`
        );

        setDestinoDisponible(!(res.data?.length > 0));
      } catch (error) {
        console.error("Error validando fecha destino:", error);
        setDestinoDisponible(false);
      } finally {
        setLoadingDestino(false);
      }
    };

    validarFechaDestino();
  }, [fechaDestino, fechaOrigen]);

  const handleConfirm = () => {
    if (!fechaOrigen || !fechaDestino) return;
    if (!origenDisponible) return;
    if (!destinoDisponible) return;

    onConfirm(fechaOrigen, fechaDestino);
  };

  const botonDeshabilitado =
    loading ||
    loadingOrigen ||
    loadingDestino ||
    !fechaOrigen ||
    !fechaDestino ||
    !origenDisponible ||
    !destinoDisponible;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={styleModal}>
        <Typography variant="h6" fontWeight="bold" color="primary" mb={2}>
          Clonar registro de un día
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <TextField
          label="Día a clonar"
          type="date"
          fullWidth
          size="small"
          value={fechaOrigen}
          onChange={(e) => setFechaOrigen(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 1 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {loadingOrigen ? (
                  <CircularProgress size={18} />
                ) : origenDisponible === true ? (
                  <CheckCircleIcon color="success" />
                ) : origenDisponible === false ? (
                  <ErrorIcon color="error" />
                ) : null}
              </InputAdornment>
            ),
          }}
        />

        {fechaOrigen && !loadingOrigen && origenDisponible === true && (
          <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
            ✓ Sí hay datos disponibles para clonar en esa fecha
          </Typography>
        )}

        {fechaOrigen && !loadingOrigen && origenDisponible === false && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            ✗ No hay datos disponibles en esa fecha
          </Typography>
        )}

        <TextField
          label="Guardar clon en fecha"
          type="date"
          fullWidth
          size="small"
          value={fechaDestino}
          onChange={(e) => setFechaDestino(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{
            max: new Date().toLocaleDateString("en-CA"),
          }}
          sx={{ mb: 1 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {loadingDestino ? (
                  <CircularProgress size={18} />
                ) : destinoDisponible === true ? (
                  <CheckCircleIcon color="success" />
                ) : destinoDisponible === false ? (
                  <ErrorIcon color="error" />
                ) : null}
              </InputAdornment>
            ),
          }}
        />

        {fechaDestino &&
          !loadingDestino &&
          fechaOrigen &&
          fechaDestino === fechaOrigen && (
            <Typography variant="body2" color="error" sx={{ mb: 3 }}>
              ✗ La fecha destino no puede ser igual a la fecha origen
            </Typography>
          )}

        {fechaDestino &&
          !loadingDestino &&
          (!fechaOrigen || fechaDestino !== fechaOrigen) &&
          destinoDisponible === true && (
            <Typography variant="body2" color="success.main" sx={{ mb: 3 }}>
              ✓ Fecha disponible
            </Typography>
          )}

        {fechaDestino &&
          !loadingDestino &&
          (!fechaOrigen || fechaDestino !== fechaOrigen) &&
          destinoDisponible === false && (
            <Typography variant="body2" color="error" sx={{ mb: 3 }}>
              ✗ Esa fecha ya tiene datos registrados
            </Typography>
          )}

        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" color="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={botonDeshabilitado}
            endIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            Clonar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ModalClonarDia;