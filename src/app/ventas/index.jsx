import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { formatCurrency } from "../../constants/measurements";
import { obtenerDatosVentas } from "../../services/salesService";
import { useAppTheme } from "../../theme/AppThemeProvider";

export default function SalesScreen() {
  const { colors } = useAppTheme();
  const [resumen, setResumen] = useState({
    montoTotal: 0,
    productosVendidos: 0,
    totalVentas: 0,
  });

  const cargarResumen = useCallback(async () => {
    const data = await obtenerDatosVentas();
    setResumen(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarResumen();
    }, [cargarResumen]),
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Ventas</Text>

      <View style={styles.summaryRow}>
        <SummaryCard label="Ventas hoy" value={resumen.totalVentas} />
        <SummaryCard
          label="Total vendido"
          value={formatCurrency(resumen.montoTotal)}
        />
      </View>

      <View style={[styles.summaryWide, { backgroundColor: colors.card }]}>
        <Text style={[styles.summaryValue, { color: colors.primary }]}>
          {resumen.productosVendidos}
        </Text>
        <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
          unidades mínimas vendidas hoy
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.actionButton, styles.primaryButton]}
        onPress={() => router.push("/ventas/nueva")}
      >
        <Ionicons name="cart-outline" size={24} color="#fff" />
        <Text style={styles.primaryButtonText}>Nueva venta</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.card }]}
        onPress={() => router.push("/ventas/historial")}
      >
        <Ionicons name="receipt-outline" size={24} color={colors.primaryDark} />
        <Text style={[styles.secondaryButtonText, { color: colors.primaryDark }]}>
          Historial de ventas
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function SummaryCard({ label, value }) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.summaryValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    marginTop: 12,
    padding: 16,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  primaryButton: {
    backgroundColor: "#0F8A45",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    marginLeft: 10,
  },
  secondaryButtonText: {
    color: "#003B95",
    fontSize: 17,
    fontWeight: "800",
    marginLeft: 10,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    flex: 1,
    marginRight: 10,
    padding: 16,
  },
  summaryLabel: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  summaryValue: {
    color: "#003B95",
    fontSize: 24,
    fontWeight: "900",
  },
  summaryWide: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 10,
    padding: 16,
  },
  title: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 18,
  },
});
