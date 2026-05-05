import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";

const API_URL = "https://ambiocomserver.onrender.com/api/conductores";

const useDebouncedValue = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
};

const normalizeText = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

export default function ConductoresReadOnlyPage() {
  const [conductores, setConductores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebouncedValue(search, 250);

  const fetchConductores = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setConductores(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error cargando conductores:", error);
      setConductores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConductores();
  }, []);

  const conductoresFiltrados = useMemo(() => {
    const q = normalizeText(debouncedSearch).toLowerCase();

    if (!q) return conductores;

    return conductores.filter((c) => {
      const searchable = [
        c.nombres,
        c.apellidos,
        c.placaVehiculo,
        c.empresa,
        c.carroseria,
        c.contacto,
      ]
        .map((v) => normalizeText(v).toLowerCase())
        .join(" ");

      return searchable.includes(q);
    });
  }, [conductores, debouncedSearch]);

  const total = conductores.length;
  const filtrados = conductoresFiltrados.length;
  const conContacto = conductores.filter((c) => c.contacto).length;

  return (
    <Box
      sx={{
        p: 3,
        mt: 5,
        backgroundColor: "#F4F6F8",
        minHeight: "100vh",
      }}
    >
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid #E0E0E0",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* HEADER */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "stretch", md: "center" },
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: "#1A237E",
                  letterSpacing: "-0.3px",
                }}
              >
                Consulta de Conductores
              </Typography>

              <Typography variant="body2" sx={{ color: "#607D8B", mt: 0.5 }}>
                Visualización general de conductores registrados.
              </Typography>

              <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
                <Chip
                  size="small"
                  icon={<BadgeIcon />}
                  label={`Total: ${total}`}
                  sx={{ fontWeight: 700 }}
                />

                <Chip
                  size="small"
                  color={debouncedSearch ? "primary" : "default"}
                  label={`Filtrados: ${filtrados}`}
                  sx={{ fontWeight: 700 }}
                />

                <Chip
                  size="small"
                  icon={<PhoneIcon />}
                  label={`Con contacto: ${conContacto}`}
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
            </Box>

            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conductor, placa, empresa, contacto..."
              size="small"
              sx={{
                minWidth: { xs: "100%", md: 460 },
                backgroundColor: "#FFFFFF",
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearch("")}
                      aria-label="Limpiar búsqueda"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Box>

          {/* TABLA */}
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              mt: 3,
              maxHeight: "68vh",
              borderRadius: 3,
              border: "1px solid #DDE3EA",
              overflow: "auto",
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {[
                    "Conductor",
                    "Placa",
                    "Transportadora",
                    "Carrocería",
                    "Contacto",
                  ].map((head) => (
                    <TableCell
                      key={head}
                      sx={{
                        backgroundColor: "#1A237E",
                        color: "#FFFFFF",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        fontSize: "0.75rem",
                        letterSpacing: "0.4px",
                        py: 1.2,
                      }}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={28} />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Cargando conductores...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : conductoresFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                      <Typography fontWeight={800}>No hay resultados</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Intenta con otro criterio de búsqueda.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  conductoresFiltrados.map((c) => {
                    const nombreCompleto = `${normalizeText(
                      c.nombres
                    )} ${normalizeText(c.apellidos)}`.trim();

                    return (
                      <TableRow
                        key={c._id}
                        hover
                        sx={{
                          "&:nth-of-type(even)": {
                            backgroundColor: "#F8FAFC",
                          },
                          "& td": {
                            py: 1.1,
                            borderBottom: "1px solid #ECEFF1",
                          },
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography sx={{ fontWeight: 800 }}>
                              {nombreCompleto || "-"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {c._id?.slice(-6) || "-"}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={normalizeText(c.placaVehiculo) || "-"}
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>

                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocalShippingIcon
                              fontSize="small"
                              sx={{ color: "#607D8B" }}
                            />
                            <Typography variant="body2">
                              {normalizeText(c.empresa) || "-"}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          {normalizeText(c.carroseria) || "-"}
                        </TableCell>

                        <TableCell>
                          {c.contacto ? (
                            <Tooltip title="Contacto registrado">
                              <Chip
                                size="small"
                                icon={<PhoneIcon />}
                                label={c.contacto}
                                color="success"
                                variant="outlined"
                                sx={{ fontWeight: 700 }}
                              />
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Sin contacto
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}