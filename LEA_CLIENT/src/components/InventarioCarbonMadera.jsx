import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Slider,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';


const CarbonDisplay = ({ progress }) => {
    let imageLevel = 0;

    if (progress < 20) {
        imageLevel = 0;
    } else if (progress < 40) {
        imageLevel = 25;
    } else if (progress < 60) {
        imageLevel = 50;
    } else if (progress < 80) {
        imageLevel = 75;
    } else {
        imageLevel = 100;
    }

    const imagePath = `/CarbonMadera/piladecarbon${imageLevel}.png`;

    return (
        <Paper
            elevation={6}
            sx={{
                position: 'relative',
                p: 2,
                textAlign: 'center',
                width: '40vw',
                height: '70vh',
                maxWidth: '40vw',
                maxHeight: '80vh',
                minWidth: '40vw',
                minHeight: '40vh',
                backgroundColor: '#ffffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
                boxSizing: 'border-box',
                borderRadius: 5,
                background: `linear-gradient(to bottom, #f4fbfeff 65%, #e3e3e3ff 35%)`,
            }}
        >
            {progress < 25 && (
                <WarningAmberIcon
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: '#d32f2f',
                        fontSize: 40,
                        animation: 'pulseZoom 0.6s ease-in-out infinite',
                        '@keyframes pulseZoom': {
                            '0%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.4)' },
                            '100%': { transform: 'scale(1)' },
                        },
                        zIndex: 10,
                    }}
                />
            )}
            <Typography variant="h5"
                sx={{
                    mb: 5,
                    mt: 5,
                    fontWeight: 600,
                    color: '#1A237E',
                    letterSpacing: 0.5,
                    textTransform: 'none'
                }}>
                Carbón Granular
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'end',
                    height: "95%",
                }}
            >
                <Box
                    component="img"
                    src={imagePath}
                    alt={`Carbón al ${imageLevel}%`}
                    sx={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                    }}
                />
            </Box>

            <Typography variant="body1" sx={{ mt: 1 }}>
                Progreso: {progress}%
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
                Toneladas: {progress * 1000}
            </Typography>
        </Paper>
    );
};

const WoodDisplay = ({ progress }) => {
    let imageLevel = 0;

    if (progress < 20) {
        imageLevel = 0;
    } else if (progress < 40) {
        imageLevel = 25;
    } else if (progress < 60) {
        imageLevel = 50;
    } else if (progress < 80) {
        imageLevel = 75;
    } else {
        imageLevel = 100;
    }

    const imagePath = `/CarbonMadera/pilademadera${imageLevel}.png`;

    return (
        <Paper
            elevation={6}
            sx={{
                position: "relative",
                p: 2,
                textAlign: 'center',
                width: '40vw',
                height: '70vh',
                maxWidth: '40vw',
                maxHeight: '80vh',
                minWidth: '40vw',
                minHeight: '40vh',
                backgroundColor: '#ffffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
                boxSizing: 'border-box',
                borderRadius: 5,
                background: `linear-gradient(to bottom, #f4fbfeff 65%, #e3e3e3ff 35%)`,
            }}
        >
            {progress < 25 && (
                <WarningAmberIcon
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: '#d32f2f',
                        fontSize: 40,
                        animation: 'pulseZoom 0.6s ease-in-out infinite',
                        '@keyframes pulseZoom': {
                            '0%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.4)' },
                            '100%': { transform: 'scale(1)' },
                        },
                        zIndex: 10,
                    }}
                />
            )}
            <Typography variant="h5" sx={{
                mb: 5,
                mt: 5,
                fontWeight: 600,
                color: '#1A237E',
                letterSpacing: 0.5,
                textTransform: 'none'
            }}>
                Astillas de Madera
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'end',
                    height: "95%",
                }}
            >
                <Box
                    component="img"
                    src={imagePath}
                    alt={`Madera al ${imageLevel}%`}
                    sx={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                    }}
                />
            </Box>

            <Typography variant="body1" sx={{ mt: 1 }}>
                Progreso: {progress}%
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
                Toneladas: {progress * 1000}
            </Typography>
        </Paper>
    );
};

const InventarioCarbonMadera = () => {
    const [carbonProgress, setCarbonProgress] = useState(60);
    const [woodProgress, setWoodProgress] = useState(40);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: '#eaeff1',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                px: 4,
            }}
        >
            <Typography
                variant="h4"
                align="center"
                gutterBottom
                sx={{
                    mb: 5,
                    mt: 5,
                    fontWeight: 600,
                    color: '#1A237E',
                    letterSpacing: 0.5,
                    textTransform: 'none'
                }}
            >
                Monitoreo de Materia Prima Comburente
            </Typography>

            <Grid container spacing={6} justifyContent="center" alignItems="center">
                <Grid item xs={12} md={6}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <CarbonDisplay progress={carbonProgress} />
                        <Slider
                            value={carbonProgress}
                            onChange={(e, val) => setCarbonProgress(val)}
                            step={10}
                            min={0}
                            max={100}
                            valueLabelDisplay="auto"
                            sx={{ width: '80%' }}
                        />
                    </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <WoodDisplay progress={woodProgress} />
                        <Slider
                            value={woodProgress}
                            onChange={(e, val) => setWoodProgress(val)}
                            step={10}
                            min={0}
                            max={100}
                            valueLabelDisplay="auto"
                            sx={{ width: '80%' }}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default InventarioCarbonMadera;
