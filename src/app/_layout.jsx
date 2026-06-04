import { Stack } from "expo-router";
import { useEffect } from "react";

import AppAlertProvider from "../components/ui/AppAlertProvider";
import AutoHideBottomNav from "../components/ui/AutoHideBottomNav";
import { initDatabase } from "../database/migrations/initDatabase";
import { AppThemeProvider, useAppTheme } from "../theme/AppThemeProvider";

export default function Layout() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <AppThemeProvider>
      <ThemedLayout />
    </AppThemeProvider>
  );
}

function ThemedLayout() {
  const { colors } = useAppTheme();

  return (
    <AppAlertProvider>
      <AutoHideBottomNav>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.header },
            headerTintColor: colors.textOnPrimary,
            headerTitleStyle: { fontWeight: "700" },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="inventario/index" options={{ title: "Inventario" }} />
          <Stack.Screen
            name="inventario/registrar"
            options={{ title: "Agregar producto" }}
          />
          <Stack.Screen name="inventario/[id]" options={{ title: "Producto" }} />
          <Stack.Screen
            name="inventario/desactivados"
            options={{ title: "Productos desactivados" }}
          />
          <Stack.Screen name="ventas/index" options={{ title: "Ventas" }} />
          <Stack.Screen name="ventas/nueva" options={{ title: "Nueva venta" }} />
          <Stack.Screen
            name="ventas/historial"
            options={{ title: "Historial de ventas" }}
          />
          <Stack.Screen name="ventas/[id]" options={{ title: "Detalle de venta" }} />
          <Stack.Screen name="escaner" options={{ title: "Escanear codigo" }} />
          <Stack.Screen name="alertas" options={{ title: "Alertas" }} />
          <Stack.Screen name="reportes" options={{ title: "Reportes" }} />
          <Stack.Screen name="categorias" options={{ title: "Categorias" }} />
          <Stack.Screen
            name="configuracion/index"
            options={{ title: "Configuracion" }}
          />
          <Stack.Screen
            name="configuracion/unidades"
            options={{ title: "Unidades de medida" }}
          />
          <Stack.Screen
            name="configuracion/respaldo"
            options={{ title: "Respaldo de datos" }}
          />
          <Stack.Screen
            name="configuracion/ayuda"
            options={{ title: "Ayuda" }}
          />
          <Stack.Screen
            name="configuracion/acerca"
            options={{ title: "Acerca de la app" }}
          />
        </Stack>
      </AutoHideBottomNav>
    </AppAlertProvider>
  );
}
