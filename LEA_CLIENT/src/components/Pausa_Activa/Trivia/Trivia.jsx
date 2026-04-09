import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { triviaQuestions } from "./utils/TriviaData.js";

const GENERAL_CATEGORY = "General";

const shuffleArray = (array) => {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
};

const CompanyTrivia = () => {
  const allCategories = useMemo(() => {
    const categories = Array.from(
      new Set(triviaQuestions.map((item) => item.category).filter(Boolean))
    );

    return categories.sort((a, b) => a.localeCompare(b));
  }, []);

  const topicCards = useMemo(() => {
    const configuredTopics = [
      {
        key: "General",
        title: "General",
        description: "Preguntas aleatorias de todas las áreas.",
        image: "/ImagesTrivia/general.png",
        accent: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
      },
      {
        key: "Seguridad",
        title: "Seguridad",
        description: "Normas, riesgos y actos seguros.",
        image: "/ImagesTrivia/safety.png",
        accent: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
      },
      {
        key: "EPP",
        title: "EPP",
        description: "Protección personal y uso correcto.",
        image: "/ImagesTrivia/epps.png",
        accent: "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
      },
      {
        key: "Calidad",
        title: "Calidad",
        description: "Control, laboratorio y validaciones.",
        image: "/ImagesTrivia/calidad.png",
        accent: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
      },
      {
        key: "Proceso",
        title: "Proceso",
        description: "Fermentación, destilación y operación.",
        image: "/ImagesTrivia/proceso.png",
        accent: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
      },
      {
        key: "Caldera",
        title: "Caldera",
        description: "Vapor, presión y operación segura.",
        image: "/ImagesTrivia/caldera.png",
        accent: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
      },
      {
        key: "Aguas",
        title: "Aguas",
        description: "Tratamiento y control ambiental.",
        image: "/ImagesTrivia/aguas.png",
        accent: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
      },
      {
        key: "Ventas",
        title: "Ventas",
        description: "Clientes, servicio y especificaciones.",
        image: "/ImagesTrivia/ventas.png",
        accent: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
      },
      {
        key: "Sistema",
        title: "Sistema",
        description: "Gestión, auditorías y mejora.",
        image: "/ImagesTrivia/sistema.png",
        accent: "linear-gradient(135deg, #64748b 0%, #334155 100%)",
      },
      {
        key: "Técnico",
        title: "Técnico",
        description: "Información general de operación.",
        image: "/ImagesTrivia/tecnico.png",
        accent: "linear-gradient(135deg, #65a30d 0%, #16a34a 100%)",
      },
    ];

    const configuredKeys = new Set(configuredTopics.map((item) => item.key));

    const dynamicTopics = allCategories
      .filter((category) => !configuredKeys.has(category))
      .map((category) => ({
        key: category,
        title: category,
        description: `Preguntas del área de ${category}.`,
        image: "/images/default-topic.jpg",
        accent: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      }));

    return [...configuredTopics, ...dynamicTopics];
  }, [allCategories]);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;

  const isGeneralSelected = selectedCategories.includes(GENERAL_CATEGORY);

  const toggleCategory = (category) => {
    if (category === GENERAL_CATEGORY) {
      setSelectedCategories((prev) =>
        prev.includes(GENERAL_CATEGORY) ? [] : [GENERAL_CATEGORY]
      );
      return;
    }

    setSelectedCategories((prev) => {
      const withoutGeneral = prev.filter((item) => item !== GENERAL_CATEGORY);

      if (withoutGeneral.includes(category)) {
        return withoutGeneral.filter((item) => item !== category);
      }

      return [...withoutGeneral, category];
    });
  };

  const buildQuestionSet = () => {
    const filteredQuestions = isGeneralSelected
      ? triviaQuestions
      : triviaQuestions.filter((item) =>
          selectedCategories.includes(item.category)
        );

    return shuffleArray(filteredQuestions);
  };

  const startGame = () => {
    const randomizedQuestions = buildQuestionSet();

    setQuestions(randomizedQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
    setFinished(false);
    setGameStarted(true);
  };

  const handleOptionClick = (option) => {
    if (showFeedback) return;

    setSelectedOption(option);
    setShowFeedback(true);

    if (option === currentQuestion.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    const isLastQuestion = currentIndex === questions.length - 1;

    if (isLastQuestion) {
      setFinished(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setShowFeedback(false);
  };

  const resetToCategorySelection = () => {
    setGameStarted(false);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
    setFinished(false);
  };

  const playAgainSameSelection = () => {
    const randomizedQuestions = buildQuestionSet();

    setQuestions(randomizedQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
    setFinished(false);
    setGameStarted(true);
  };

  const getOptionStyles = (option) => {
    const baseStyles = {
      justifyContent: "flex-start",
      py: 1.5,
      px: 2,
      borderRadius: 999,
      textTransform: "none",
      fontWeight: 700,
      borderWidth: 2,
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,247,251,0.95) 100%)",
      boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
      "&:hover": {
        borderWidth: 2,
        transform: "translateY(-2px)",
        boxShadow: "0 14px 28px rgba(15, 23, 42, 0.14)",
      },
    };

    if (!showFeedback) {
      return baseStyles;
    }

    const isCorrect = option === currentQuestion.answer;
    const isSelected = option === selectedOption;

    if (isCorrect) {
      return {
        ...baseStyles,
        borderColor: "success.main",
        background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
        color: "success.dark",
        "&:hover": {
          background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
        },
      };
    }

    if (isSelected) {
      return {
        ...baseStyles,
        borderColor: "error.main",
        background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
        color: "error.dark",
        "&:hover": {
          background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
        },
      };
    }

    return {
      ...baseStyles,
      opacity: 0.65,
    };
  };

  if (!gameStarted) {
    return (
      <Box
        sx={{
          minHeight: "95vh",
          background:
            "radial-gradient(circle at top, #1e3a8a 0%, #0f172a 48%, #020617 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          px: 2,
          py: 7,
        }}
      >
        <Container maxWidth={false} sx={{ width: "90vw", px: "0 !important" }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.12)",
              background:
                "linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(30,41,59,0.9) 100%)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
              backdropFilter: "blur(10px)",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 2, md: 2.5 },
                height: "calc(100vh - 45px)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stack spacing={1.5} sx={{ mb: 2, mt:0 }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  alignItems={{ xs: "flex-start", md: "center" }}
                  justifyContent="space-between"
                  spacing={1.5}
                >
                  <Box>
                    <Typography
                      sx={{
                        color: "#fff",
                        fontSize: { xs: "1.8rem", md: "2.2rem" },
                        fontWeight: 900,
                        lineHeight: 1,
                        letterSpacing: "0.02em",
                        textTransform: "uppercase",
                      }}
                    >
                      Trivia empresarial
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.8,
                        color: "rgba(255,255,255,0.72)",
                        fontSize: { xs: "0.9rem", md: "0.98rem" },
                      }}
                    >
                      Selecciona una o varias áreas para comenzar a demostrar que tanto sabes de la compañia !.
                    </Typography>
                  </Box>

                  <Chip
                    label={
                      selectedCategories.length === 0
                        ? "Elige tus categorías"
                        : isGeneralSelected
                        ? "Modo General activo"
                        : `${selectedCategories.length} seleccionadas`
                    }
                    sx={{
                      height: 40,
                      borderRadius: 999,
                      fontWeight: 800,
                      color: "#fff",
                      background:
                        "linear-gradient(135deg, rgba(34,197,94,0.95) 0%, rgba(59,130,246,0.95) 100%)",
                      boxShadow: "0 12px 28px rgba(37, 99, 235, 0.3)",
                    }}
                  />
                </Stack>
              </Stack>

              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    sm: "repeat(3, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                    lg: "repeat(5, minmax(0, 1fr))",
                  },
                  gap: { xs: 1.1, md: 1.4 },
                  alignContent: "start",
                }}
              >
                {topicCards.map((topic) => {
                  const isSelected = selectedCategories.includes(topic.key);
                  const questionCount =
                    topic.key === GENERAL_CATEGORY
                      ? triviaQuestions.length
                      : triviaQuestions.filter(
                          (item) => item.category === topic.key
                        ).length;

                  if (topic.key !== GENERAL_CATEGORY && questionCount === 0) {
                    return null;
                  }

                  return (
                    <Card
                      key={topic.key}
                      onClick={() => toggleCategory(topic.key)}
                      elevation={0}
                      sx={{
                        cursor: "pointer",
                        position: "relative",
                        borderRadius: 5,
                        overflow: "hidden",
                        minHeight: { xs: 178, md: 300 },
                        border: isSelected
                          ? "2px solid rgba(255,255,255,0.95)"
                          : "1px solid rgba(255,255,255,0.12)",
                        background: topic.accent,
                        transform: isSelected ? "translateY(-6px) scale(1.01)" : "none",
                        boxShadow: isSelected
                          ? "0 20px 36px rgba(0,0,0,0.28)"
                          : "0 12px 24px rgba(0,0,0,0.18)",
                        transition: "all 0.22s ease",
                        display: "flex",
                        flexDirection: "column",
                        "&:before": {
                          content: '""',
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 38%, rgba(0,0,0,0.18) 100%)",
                          pointerEvents: "none",
                        },
                        "&:hover": {
                          transform: "translateY(-6px) rotate(-0.3deg)",
                          boxShadow: "0 22px 40px rgba(0,0,0,0.28)",
                        },
                      }}
                    >
                      <Box sx={{ position: "relative", px: 1.2, pt: 1.2 }}>
                        <CardMedia
                          component="img"
                          image={topic.image}
                          alt={topic.title}
                          sx={{
                            height: { xs: 66, md: 76 },
                            width: "100%",
                            objectFit: "cover",
                            borderRadius: 3,
                            border: "1px solid rgba(255,255,255,0.16)",
                            backgroundColor: "rgba(255,255,255,0.1)",
                          }}
                        />

                        <Chip
                          label={isSelected ? "Lista" : "Tema"}
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            height: 26,
                            borderRadius: 999,
                            fontWeight: 900,
                            color: isSelected ? "#0f172a" : "#fff",
                            background: isSelected
                              ? "linear-gradient(135deg, #fde68a 0%, #facc15 100%)"
                              : "rgba(15,23,42,0.38)",
                            backdropFilter: "blur(8px)",
                          }}
                        />
                      </Box>

                      <CardContent
                        sx={{
                          position: "relative",
                          p: 1.4,
                          pt: 1.15,
                          color: "#fff",
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.8,
                          flex: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: { xs: "0.96rem", md: "1rem" },
                            fontWeight: 900,
                            lineHeight: 1.05,
                            textShadow: "0 2px 10px rgba(0,0,0,0.18)",
                          }}
                        >
                          {topic.title}
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: "0.77rem",
                            lineHeight: 1.2,
                            color: "rgba(255,255,255,0.9)",
                            minHeight: 30,
                          }}
                        >
                          {topic.description}
                        </Typography>

                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mt: "auto" }}
                        >
                          <Chip
                            label={`${questionCount} preguntas`}
                            size="small"
                            sx={{
                              height: 24,
                              borderRadius: 999,
                              color: "#fff",
                              fontWeight: 700,
                              background: "rgba(255,255,255,0.16)",
                            }}
                          />

                          <Box
                            sx={{
                              px: 1.1,
                              py: 0.35,
                              borderRadius: "14px 14px 4px 14px",
                              fontSize: "0.73rem",
                              fontWeight: 900,
                              color: "#fff",
                              background: "rgba(15,23,42,0.35)",
                              border: "1px solid rgba(255,255,255,0.14)",
                            }}
                          >
                            {isSelected ? "✓" : "+"}
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>

              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
                spacing={1.4}
                sx={{ mt: 1.8 }}
              >
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.72)",
                    fontSize: "0.9rem",
                    minHeight: 22,
                  }}
                >
                  {selectedCategories.length === 0
                    ? "No has seleccionado ninguna categoría."
                    : isGeneralSelected
                    ? "Modo General: se mezclarán todas las categorías."
                    : `Seleccionadas: ${selectedCategories.join(", ")}`}
                </Typography>

                <Button
                  variant="contained"
                  size="large"
                  onClick={startGame}
                  disabled={selectedCategories.length === 0}
                  sx={{
                    minWidth: 220,
                    borderRadius: 999,
                    px: 4,
                    py: 1.45,
                    textTransform: "none",
                    fontWeight: 900,
                    fontSize: "1rem",
                    color: "#0f172a",
                    background: "linear-gradient(135deg, #fde047 0%, #f59e0b 100%)",
                    boxShadow: "0 16px 34px rgba(245, 158, 11, 0.35)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #fde047 0%, #f59e0b 100%)",
                      transform: "translateY(-2px)",
                    },
                    "&.Mui-disabled": {
                      color: "rgba(15,23,42,0.45)",
                      background: "rgba(255,255,255,0.28)",
                    },
                  }}
                >
                  Comenzar trivia
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top, #14532d 0%, #0f172a 55%, #020617 100%)",
          px: 2,
        }}
      >
        <Container maxWidth="sm">
          <Card
            elevation={0}
            sx={{
              borderRadius: 8,
              overflow: "hidden",
              color: "#fff",
              background:
                "linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(30,41,59,0.92) 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 28px 70px rgba(0,0,0,0.35)",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3} alignItems="center" textAlign="center">
                <Typography variant="h3" fontWeight={900}>
                  ¡Trivia completada!
                </Typography>

                <Chip
                  label={`Puntaje: ${score} / ${questions.length}`}
                  sx={{
                    fontSize: "1rem",
                    px: 1.2,
                    py: 2.6,
                    borderRadius: 999,
                    fontWeight: 900,
                    color: "#0f172a",
                    background:
                      "linear-gradient(135deg, #fde047 0%, #f59e0b 100%)",
                  }}
                />

                <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.78)" }}>
                  Obtuviste {percentage}% de respuestas correctas.
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={playAgainSameSelection}
                    sx={{
                      borderRadius: 999,
                      px: 4,
                      textTransform: "none",
                      fontWeight: 800,
                    }}
                  >
                    Jugar de nuevo
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    onClick={resetToCategorySelection}
                    sx={{
                      borderRadius: 999,
                      px: 4,
                      textTransform: "none",
                      fontWeight: 800,
                      color: "#fff",
                      borderColor: "rgba(255,255,255,0.22)",
                    }}
                  >
                    Cambiar áreas
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, #7c2d12 0%, #0f172a 55%, #020617 100%)",
        px: 2,
        py: 2,
      }}
    >
      <Container maxWidth={false} sx={{ width: { xs: "94vw", md: "90vw" }, px: 0 }}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
            background:
              "linear-gradient(180deg, rgba(15,23,42,0.93) 0%, rgba(30,41,59,0.92) 100%)",
            boxShadow: "0 28px 70px rgba(0,0,0,0.35)",
          }}
        >
          <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 } }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={1.5}
              sx={{ mb: 1.5 }}
            >
              <Box>
                <Typography sx={{ color: "#fff", fontSize: "1.8rem", fontWeight: 900 }}>
                  Trivia empresarial
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.68)", mt: 0.4 }}>
                  Responde y suma puntos.
                </Typography>
              </Box>

              <Chip
                label={`${currentIndex + 1}/${questions.length}`}
                sx={{
                  borderRadius: 999,
                  fontWeight: 900,
                  color: "#fff",
                  background: "rgba(255,255,255,0.1)",
                }}
              />
            </Stack>

            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 12,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.08)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #fde047 0%, #f97316 100%)",
                },
              }}
            />
          </Box>

          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2.5}>
              <Box
                sx={{
                  p: { xs: 2, md: 2.6 },
                  borderRadius: 5,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Typography sx={{ color: "#93c5fd", fontSize: "0.82rem", fontWeight: 800 }}>
                  {currentQuestion?.category || "Pregunta actual"}
                </Typography>

                <Typography
                  sx={{
                    mt: 1,
                    color: "#fff",
                    fontSize: { xs: "1.25rem", md: "1.55rem" },
                    fontWeight: 800,
                    lineHeight: 1.2,
                  }}
                >
                  {currentQuestion?.question}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                  gap: 1.5,
                }}
              >
                {currentQuestion?.options.map((option) => (
                  <Button
                    key={option}
                    variant="outlined"
                    fullWidth
                    onClick={() => handleOptionClick(option)}
                    sx={getOptionStyles(option)}
                  >
                    {option}
                  </Button>
                ))}
              </Box>

              <Box sx={{ minHeight: 34 }}>
                {showFeedback && (
                  <Typography
                    variant="body1"
                    fontWeight={800}
                    color={
                      selectedOption === currentQuestion.answer
                        ? "success.light"
                        : "error.light"
                    }
                  >
                    {selectedOption === currentQuestion.answer
                      ? "¡Correcto!"
                      : `Incorrecto. La respuesta correcta es: ${currentQuestion.answer}`}
                  </Typography>
                )}
              </Box>

              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
                gap={1.5}
              >
                <Typography sx={{ color: "rgba(255,255,255,0.72)", fontWeight: 700 }}>
                  Puntaje actual: {score}
                </Typography>

                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="outlined"
                    onClick={resetToCategorySelection}
                    sx={{
                      borderRadius: 999,
                      px: 3,
                      textTransform: "none",
                      fontWeight: 800,
                      color: "#fff",
                      borderColor: "rgba(255,255,255,0.22)",
                    }}
                  >
                    Cambiar áreas
                  </Button>

                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!showFeedback}
                    sx={{
                      borderRadius: 999,
                      px: 3,
                      textTransform: "none",
                      fontWeight: 900,
                      color: "#0f172a",
                      background:
                        "linear-gradient(135deg, #fde047 0%, #f59e0b 100%)",
                    }}
                  >
                    {currentIndex === questions.length - 1 ? "Finalizar" : "Siguiente"}
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default CompanyTrivia;
