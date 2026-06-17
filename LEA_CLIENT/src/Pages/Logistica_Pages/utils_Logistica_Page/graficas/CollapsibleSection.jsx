import React, { useState } from "react";
import { Box, Chip, Collapse, Divider, IconButton, Paper, Stack, Typography } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

const CollapsibleSection = ({
  title,
  subtitle,
  chipLabel,
  defaultOpen = false,
  children,
  paperSx = {},
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Paper
      elevation={2}
      sx={{
        width: "100%",
        boxSizing: "border-box",
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,

        overflow: "visible",

        position: "relative",
        zIndex: open ? 20 : 1,

        border: "1px solid",
        borderColor: open ? "primary.light" : "divider",
        transition: "all 0.25s ease",
        ...paperSx,
      }}
    >
      <Box
        onClick={() => setOpen((prev) => !prev)}
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: 14, md: 16 },
              lineHeight: 1.25,
            }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {chipLabel && (
            <Chip
              size="medium"
              variant="outlined"
              label={chipLabel}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            />
          )}

          <IconButton
            size="small"
            color="primary"
            onClick={() => setOpen((prev) => !prev)}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              "&:hover": {
                backgroundColor: "#eef2ff",
              },
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </Stack>
      </Box>

      <Collapse
        in={open}
        timeout="auto"
        unmountOnExit={false}
        sx={{
          overflow: "visible",
          "& .MuiCollapse-wrapper": {
            overflow: "visible",
          },
          "& .MuiCollapse-wrapperInner": {
            overflow: "visible",
          },
        }}
      >
        <Divider sx={{ my: 2 }} />
        <Box
          sx={{
            position: "relative",
            overflow: "visible",
            zIndex: 2,
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Paper>
  );
};


export default CollapsibleSection;
