import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";

const GRID_COLUMNS = 28;
const GRID_ROWS = 16;

const INITIAL_SPEED = 140;
const SPEED_STEP = 6;
const MAX_SPEED = 65;

// Ajusta esto al alto real de tu header fijo
const HEADER_HEIGHT = 72;

const directionMap = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const oppositeDirections = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT",
};

const getRandomCell = (snake) => {
  while (true) {
    const cell = {
      x: Math.floor(Math.random() * GRID_COLUMNS),
      y: Math.floor(Math.random() * GRID_ROWS),
    };

    const overlapsSnake = snake.some(
      (segment) => segment.x === cell.x && segment.y === cell.y
    );

    if (!overlapsSnake) return cell;
  }
};

const createInitialState = () => {
  const centerX = Math.floor(GRID_COLUMNS / 2);
  const centerY = Math.floor(GRID_ROWS / 2);

  const snake = [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
  ];

  return {
    snake,
    food: getRandomCell(snake),
    direction: "RIGHT",
    pendingDirection: "RIGHT",
    score: 0,
    highScore: Number(localStorage.getItem("snake-high-score") || 0),
    isRunning: false,
    isGameOver: false,
    speed: INITIAL_SPEED,
  };
};

export default function SnakeGame() {
  const [game, setGame] = useState(createInitialState);
  const touchStartRef = useRef(null);

  const setDirection = useCallback((nextDirection) => {
    setGame((prev) => {
      if (oppositeDirections[prev.direction] === nextDirection) return prev;

      return {
        ...prev,
        pendingDirection: nextDirection,
        isRunning: true,
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setGame(createInitialState());
  }, []);

  const togglePause = useCallback(() => {
    setGame((prev) => {
      if (prev.isGameOver) return prev;

      return {
        ...prev,
        isRunning: !prev.isRunning,
      };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "enter"].includes(
          key
        )
      ) {
        event.preventDefault();
      }

      if (key === "arrowup" || key === "w") setDirection("UP");
      if (key === "arrowdown" || key === "s") setDirection("DOWN");
      if (key === "arrowleft" || key === "a") setDirection("LEFT");
      if (key === "arrowright" || key === "d") setDirection("RIGHT");
      if (key === " ") togglePause();
      if (key === "enter" && game.isGameOver) resetGame();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [game.isGameOver, resetGame, setDirection, togglePause]);

  useEffect(() => {
    if (!game.isRunning || game.isGameOver) return;

    const timer = setInterval(() => {
      setGame((prev) => {
        const direction = prev.pendingDirection;
        const delta = directionMap[direction];
        const head = prev.snake[0];

        const nextHead = {
          x: head.x + delta.x,
          y: head.y + delta.y,
        };

        const hitsWall =
          nextHead.x < 0 ||
          nextHead.x >= GRID_COLUMNS ||
          nextHead.y < 0 ||
          nextHead.y >= GRID_ROWS;

        const hitsSelf = prev.snake.some(
          (segment) => segment.x === nextHead.x && segment.y === nextHead.y
        );

        if (hitsWall || hitsSelf) {
          const highScore = Math.max(prev.highScore, prev.score);
          localStorage.setItem("snake-high-score", String(highScore));

          return {
            ...prev,
            isRunning: false,
            isGameOver: true,
            highScore,
          };
        }

        const nextSnake = [nextHead, ...prev.snake];
        const ateFood = nextHead.x === prev.food.x && nextHead.y === prev.food.y;

        let nextFood = prev.food;
        let nextScore = prev.score;
        let nextSpeed = prev.speed;

        if (ateFood) {
          nextScore += 1;
          nextFood = getRandomCell(nextSnake);
          nextSpeed = Math.max(MAX_SPEED, prev.speed - SPEED_STEP);
        } else {
          nextSnake.pop();
        }

        const nextHighScore = Math.max(prev.highScore, nextScore);
        if (nextHighScore !== prev.highScore) {
          localStorage.setItem("snake-high-score", String(nextHighScore));
        }

        return {
          ...prev,
          snake: nextSnake,
          food: nextFood,
          direction,
          pendingDirection: direction,
          score: nextScore,
          highScore: nextHighScore,
          speed: nextSpeed,
        };
      });
    }, game.speed);

    return () => clearInterval(timer);
  }, [game.isRunning, game.isGameOver, game.speed]);

  const cells = useMemo(() => {
    const snakeSet = new Set(game.snake.map((cell) => `${cell.x}-${cell.y}`));
    const headKey = game.snake[0]
      ? `${game.snake[0].x}-${game.snake[0].y}`
      : "";
    const foodKey = `${game.food.x}-${game.food.y}`;

    return Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, index) => {
      const x = index % GRID_COLUMNS;
      const y = Math.floor(index / GRID_COLUMNS);
      const key = `${x}-${y}`;

      return {
        key,
        isHead: key === headKey,
        isSnake: snakeSet.has(key),
        isFood: key === foodKey,
      };
    });
  }, [game.food, game.snake]);

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    if (!touchStartRef.current) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      setDirection(dx > 0 ? "RIGHT" : "LEFT");
    } else {
      setDirection(dy > 0 ? "DOWN" : "UP");
    }
  };

  return (
    <Container
      maxWidth={false}
      sx={{
        px: { xs: 1, sm: 2, md: 3 },
        pt: `calc(${HEADER_HEIGHT}px + 12px)`,
        pb: 2,
      }}
    >
      <Box
        sx={{
          minHeight: `calc(100vh - ${HEADER_HEIGHT}px - 24px)`,
          borderRadius: 6,
          p: { xs: 1.5, md: 2.5 },
          background:
            "radial-gradient(circle at top, rgba(0,255,170,0.18), transparent 30%), linear-gradient(135deg, #07111f 0%, #0f172a 55%, #111827 100%)",
        }}
      >
        <Stack
          direction={{ xs: "column", xl: "row" }}
          spacing={2}
          alignItems="stretch"
          sx={{ minHeight: "100%" }}
        >
          <Card
            elevation={0}
            sx={{
              width: { xs: "100%", xl: 340 },
              flexShrink: 0,
              borderRadius: 5,
              color: "white",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
            }}
          >
            <CardContent sx={{ p: 3, height: "100%" }}>
              <Stack spacing={3} sx={{ height: "100%" }}>
                <Box>
                  <Typography
                    variant="overline"
                    sx={{ color: "#6ee7b7", letterSpacing: 2 }}
                  >
                    Mini juego
                  </Typography>
                  <Typography variant="h4" fontWeight={800}>
                    Snake Neon
                  </Typography>
                </Box>

                <Stack direction="row" spacing={2}>
                  <Box
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: 4,
                      bgcolor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                      Puntaje
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {game.score}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: 4,
                      bgcolor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                      Récord
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {game.highScore}
                    </Typography>
                  </Box>
                </Stack>

                <Stack spacing={1.5}>
                  <Button
                    variant="contained"
                    onClick={togglePause}
                    sx={{
                      borderRadius: 3,
                      py: 1.4,
                      textTransform: "none",
                      fontWeight: 700,
                      background:
                        "linear-gradient(135deg, #34d399 0%, #22c55e 100%)",
                      color: "#04130b",
                    }}
                  >
                    {game.isRunning
                      ? "Pausar"
                      : game.isGameOver
                      ? "Juego terminado"
                      : "Iniciar / Continuar"}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={resetGame}
                    sx={{
                      borderRadius: 3,
                      py: 1.4,
                      textTransform: "none",
                      fontWeight: 700,
                      color: "white",
                      borderColor: "rgba(255,255,255,0.18)",
                    }}
                  >
                    Reiniciar
                  </Button>
                </Stack>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 4,
                    bgcolor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Typography variant="h6" fontWeight={700} mb={1}>
                    Cómo jugar
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#cbd5e1", mb: 1 }}>
                    Usa flechas del teclado o W A S D.
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#cbd5e1", mb: 1 }}>
                    En celular, desliza sobre el tablero.
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#cbd5e1", mb: 1 }}>
                    Cada fruta aumenta el puntaje y acelera el juego.
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#cbd5e1" }}>
                    Barra espaciadora para pausar.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card
            elevation={0}
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              borderRadius: 5,
              color: "white",
              position: "relative",
              overflow: "hidden",
              background:
                "radial-gradient(circle at 20% 20%, rgba(34,211,238,0.16), transparent 25%), radial-gradient(circle at 80% 10%, rgba(168,85,247,0.16), transparent 30%), radial-gradient(circle at 50% 100%, rgba(16,185,129,0.18), transparent 35%), rgba(2,6,23,0.75)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 2, md: 3 },
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Box>
                  <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                    Estado
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {game.isGameOver
                      ? "Perdiste"
                      : game.isRunning
                      ? "Jugando"
                      : "Listo para empezar"}
                  </Typography>
                </Box>

                <Chip
                  label={`Velocidad ${Math.round(
                    (INITIAL_SPEED / game.speed) * 100
                  )}%`}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.08)",
                    color: "white",
                    borderRadius: 2,
                  }}
                />
              </Stack>

              <Box
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 1200,
                  mx: "auto",
                  aspectRatio: `${GRID_COLUMNS} / ${GRID_ROWS}`,
                  minHeight: { xs: 240, md: 360, xl: 420 },
                  borderRadius: 5,
                  p: 1.2,
                  bgcolor: "rgba(0,0,0,0.28)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  userSelect: "none",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
                    gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
                    gap: "3px",
                    width: "100%",
                    height: "100%",
                    borderRadius: 4,
                    p: "3px",
                    bgcolor: "rgba(255,255,255,0.05)",
                  }}
                >
                  {cells.map((cell, index) => {
                    let background =
                      index % 2 === 0
                        ? "rgba(15,23,42,0.9)"
                        : "rgba(30,41,59,0.75)";

                    let boxShadow = "none";

                    if (cell.isFood) {
                      background =
                        "radial-gradient(circle, #fef08a 0%, #fb7185 65%, #ef4444 100%)";
                      boxShadow = "0 0 14px rgba(251,113,133,0.7)";
                    }

                    if (cell.isSnake) {
                      background =
                        "linear-gradient(135deg, #34d399 0%, #22c55e 100%)";
                      boxShadow = "0 0 8px rgba(52,211,153,0.45)";
                    }

                    if (cell.isHead) {
                      background =
                        "linear-gradient(135deg, #67e8f9 0%, #22c55e 100%)";
                      boxShadow = "0 0 12px rgba(103,232,249,0.75)";
                    }

                    return (
                      <Box
                        key={cell.key}
                        sx={{
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.04)",
                          background,
                          boxShadow,
                        }}
                      />
                    );
                  })}
                </Box>

                {(!game.isRunning || game.isGameOver) && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 3,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: 420,
                        textAlign: "center",
                        borderRadius: 5,
                        px: 4,
                        py: 4,
                        bgcolor: "rgba(2,6,23,0.86)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <Typography variant="h4" fontWeight={800} mb={1}>
                        {game.isGameOver ? "Juego terminado" : "¿Listo para jugar?"}
                      </Typography>

                      <Typography variant="body1" sx={{ color: "#cbd5e1", mb: 3 }}>
                        {game.isGameOver
                          ? `Tu puntaje fue ${game.score}. Reinicia para volver a intentarlo.`
                          : "Come la fruta, evita chocar y supera tu récord."}
                      </Typography>

                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        justifyContent="center"
                      >
                        {!game.isGameOver && (
                          <Button
                            variant="contained"
                            onClick={togglePause}
                            sx={{
                              borderRadius: 3,
                              textTransform: "none",
                              fontWeight: 700,
                              background:
                                "linear-gradient(135deg, #34d399 0%, #22c55e 100%)",
                              color: "#04130b",
                            }}
                          >
                            Empezar
                          </Button>
                        )}

                        <Button
                          variant="outlined"
                          onClick={resetGame}
                          sx={{
                            borderRadius: 3,
                            textTransform: "none",
                            fontWeight: 700,
                            color: "white",
                            borderColor: "rgba(255,255,255,0.18)",
                          }}
                        >
                          Reiniciar
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  mt: 2,
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    md: "repeat(4, 1fr)",
                  },
                  gap: 1.5,
                }}
              >
                {[
                  { label: "Arriba", action: () => setDirection("UP") },
                  { label: "Izquierda", action: () => setDirection("LEFT") },
                  { label: "Abajo", action: () => setDirection("DOWN") },
                  { label: "Derecha", action: () => setDirection("RIGHT") },
                ].map((control) => (
                  <Button
                    key={control.label}
                    variant="outlined"
                    onClick={control.action}
                    sx={{
                      borderRadius: 3,
                      py: 1.2,
                      textTransform: "none",
                      fontWeight: 700,
                      color: "white",
                      borderColor: "rgba(255,255,255,0.14)",
                      bgcolor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    {control.label}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Container>
  );
}