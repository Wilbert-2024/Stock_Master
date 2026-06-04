import { createContext, useContext, useEffect, useMemo, useState } from "react";

import db from "../database/connection/database";
import { initDatabase } from "../database/migrations/initDatabase";

const LIGHT_COLORS = {
  background: "#F4F7FB",
  border: "#E2E8F0",
  card: "#FFFFFF",
  cardMuted: "#F8FAFC",
  header: "#003B95",
  iconSoft: "#EAF2FF",
  primary: "#2563EB",
  primaryDark: "#003B95",
  success: "#0F8A45",
  text: "#0F172A",
  textMuted: "#64748B",
  textOnPrimary: "#FFFFFF",
  warningSoft: "#FFF8E8",
  welcome: "#EAF8EA",
};

const DARK_COLORS = {
  background: "#07111F",
  border: "#1E2B3D",
  card: "#101B2C",
  cardMuted: "#0B1626",
  header: "#031A3A",
  iconSoft: "#122A4A",
  primary: "#60A5FA",
  primaryDark: "#1D4ED8",
  success: "#34D399",
  text: "#F8FAFC",
  textMuted: "#A8B3C7",
  textOnPrimary: "#FFFFFF",
  warningSoft: "#2A210E",
  welcome: "#0B2A1E",
};

const ThemeContext = createContext(null);

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    let mounted = true;

    const cargarTema = async () => {
      await initDatabase();
      const result = await db.getFirstAsync(
        "SELECT valor FROM app_metadata WHERE clave = ?",
        ["theme_mode"],
      );

      if (mounted && result?.valor === "dark") {
        setMode("dark");
      }
    };

    cargarTema().catch((error) => {
      console.log("Error cargando tema:", error);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(() => {
    const isDark = mode === "dark";
    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

    const toggleTheme = async () => {
      const nextMode = isDark ? "light" : "dark";
      setMode(nextMode);

      try {
        await initDatabase();
        await db.runAsync(
          `INSERT INTO app_metadata (clave, valor)
           VALUES (?, ?)
           ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`,
          ["theme_mode", nextMode],
        );
      } catch (error) {
        console.log("Error guardando tema:", error);
      }
    };

    return {
      colors,
      isDark,
      mode,
      toggleTheme,
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useAppTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme debe usarse dentro de AppThemeProvider");
  }

  return context;
};
