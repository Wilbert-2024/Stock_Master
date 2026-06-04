import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { formatCurrency } from "../constants/measurements";
import { listarAlertasInventario } from "../services/productService";
import { useAppTheme } from "../theme/AppThemeProvider";

const filters = [
  { id: "todas", label: "Todas" },
  { id: "bajo_stock", label: "Bajo stock" },
  { id: "vencimiento", label: "Vencen pronto" },
];

export default function AlertsScreen() {
  const { colors } = useAppTheme();
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("todas");

  const cargarAlertas = useCallback(async () => {
    try {
      setCargando(true);
      const data = await listarAlertasInventario();
      setAlertas(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarAlertas();
    }, [cargarAlertas]),
  );

  const conteos = useMemo(
    () => ({
      bajo_stock: alertas.filter((alerta) => alerta.tipo === "bajo_stock")
        .length,
      criticas: alertas.filter((alerta) => Number(alerta.prioridad) === 0)
        .length,
      todas: alertas.length,
      vencimiento: alertas.filter((alerta) => alerta.tipo === "vencimiento")
        .length,
    }),
    [alertas],
  );

  const alertasFiltradas = useMemo(() => {
    if (filtro === "todas") {
      return alertas;
    }

    return alertas.filter((alerta) => alerta.tipo === filtro);
  }, [alertas, filtro]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Alertas</Text>

      <View style={styles.urgentCard}>
        <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
        <View style={styles.urgentTextBox}>
          <Text style={styles.urgentTitle}>{conteos.criticas} criticas</Text>
          <Text style={styles.urgentSubtitle}>
            Sin stock o productos que vencen hoy aparecen primero.
          </Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <SummaryBox label="Todas" value={conteos.todas} color="#2563EB" />
        <SummaryBox label="Bajo stock" value={conteos.bajo_stock} color="#F59E0B" />
        <SummaryBox label="Por vencer" value={conteos.vencimiento} color="#DC2626" />
      </View>

      <View style={styles.filterRow}>
        {filters.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.filterButton,
              { borderColor: colors.border },
              filtro === item.id && styles.filterButtonActive,
            ]}
            onPress={() => setFiltro(item.id)}
          >
            <Text
              style={[
                styles.filterText,
                { color: colors.textMuted },
                filtro === item.id && styles.filterTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {cargando ? (
        <View style={[styles.loadingBox, { backgroundColor: colors.card }]}>
          <ActivityIndicator color="#003B95" />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Cargando alertas...
          </Text>
        </View>
      ) : (
        <FlatList
          data={alertasFiltradas}
          keyExtractor={(item, index) => `${item.tipo}-${item.id}-${index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={[styles.emptyBox, { backgroundColor: colors.card }]}>
              <Ionicons name="checkmark-circle-outline" size={44} color="#0F8A45" />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Sin alertas
              </Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No hay productos que requieran atencion en este filtro.
              </Text>
            </View>
          }
          renderItem={({ item }) => <AlertCard alerta={item} />}
        />
      )}
    </View>
  );
}

function SummaryBox({ color, label, value }) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.summaryBox, { backgroundColor: colors.card }]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function AlertCard({ alerta }) {
  const { colors } = useAppTheme();
  const isStock = alerta.tipo === "bajo_stock";
  const iconName = isStock ? "warning-outline" : "calendar-outline";
  const color = getUrgencyColor(alerta.prioridad, alerta.tipo);
  const diasTexto = getDaysText(alerta.dias_restantes);
  const stockTexto =
    isStock && Number(alerta.cantidad_faltante) > 0
      ? `Faltan ${alerta.cantidad_faltante} x ${alerta.unidad_base} para llegar al minimo`
      : isStock
        ? "Sin unidades disponibles"
        : null;

  return (
    <TouchableOpacity
      style={[styles.alertCard, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/inventario/${alerta.id}`)}
    >
      <View style={[styles.iconBox, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={iconName} size={28} color={color} />
      </View>

      <View style={styles.alertBody}>
        <View style={styles.alertHeader}>
          <Text style={[styles.alertTitle, { color: colors.text }]}>
            {alerta.nombre}
          </Text>
          <View style={[styles.alertTagBox, { backgroundColor: `${color}1A` }]}>
            <Text style={[styles.alertTag, { color }]}>{alerta.urgencia}</Text>
          </View>
        </View>

        <Text style={[styles.categoryText, { color: colors.primaryDark }]}>
          {alerta.categoria_nombre}
        </Text>
        <Text style={[styles.alertKind, { color }]}>{alerta.titulo}</Text>
        <Text style={[styles.detailText, { color: colors.textMuted }]}>
          {alerta.detalle}
        </Text>
        {stockTexto ? <Text style={styles.actionText}>{stockTexto}</Text> : null}
        {diasTexto ? (
          <Text style={[styles.actionText, { color }]}>{diasTexto}</Text>
        ) : null}
        <Text style={[styles.priceText, { color: colors.textMuted }]}>
          {formatCurrency(alerta.precio)} / {alerta.presentacion_nombre}
        </Text>

        <View style={styles.openRow}>
          <Text style={[styles.openText, { color: colors.primaryDark }]}>
            Ver producto
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function getDaysText(days) {
  if (days === null || days === undefined) {
    return null;
  }

  const value = Number(days);

  if (value <= 0) {
    return "Vence hoy";
  }

  if (value === 1) {
    return "Falta 1 dia";
  }

  return `Faltan ${value} dias`;
}

function getUrgencyColor(priority, type) {
  const value = Number(priority);

  if (value === 0) {
    return "#DC2626";
  }

  if (value === 1) {
    return "#F59E0B";
  }

  return type === "bajo_stock" ? "#B45309" : "#7C3AED";
}

const styles = StyleSheet.create({
  actionText: {
    color: "#B45309",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 5,
  },
  alertKind: {
    fontSize: 14,
    fontWeight: "900",
    marginTop: 6,
  },
  alertBody: {
    flex: 1,
  },
  alertCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 12,
    padding: 14,
  },
  alertHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  alertTag: {
    fontSize: 12,
    fontWeight: "800",
  },
  alertTagBox: {
    borderRadius: 999,
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  alertTitle: {
    color: "#0F172A",
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
  },
  categoryText: {
    color: "#003B95",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  detailText: {
    color: "#334155",
    fontSize: 14,
    marginTop: 6,
  },
  emptyBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 22,
  },
  emptyText: {
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
  },
  emptyTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
  },
  filterButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    marginRight: 8,
    paddingVertical: 10,
  },
  filterButtonActive: {
    backgroundColor: "#003B95",
    borderColor: "#003B95",
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  filterText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
  },
  filterTextActive: {
    color: "#fff",
  },
  iconBox: {
    alignItems: "center",
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    marginRight: 12,
    width: 48,
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    padding: 16,
  },
  loadingText: {
    color: "#64748B",
    marginLeft: 10,
  },
  priceText: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 5,
  },
  openRow: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    marginTop: 8,
  },
  openText: {
    color: "#003B95",
    fontSize: 13,
    fontWeight: "900",
    marginRight: 3,
  },
  summaryBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    flex: 1,
    marginRight: 8,
    paddingVertical: 14,
  },
  summaryLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "900",
  },
  title: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 18,
  },
  urgentCard: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 14,
    padding: 14,
  },
  urgentSubtitle: {
    color: "#7F1D1D",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  urgentTextBox: {
    flex: 1,
    marginLeft: 10,
  },
  urgentTitle: {
    color: "#991B1B",
    fontSize: 17,
    fontWeight: "900",
  },
});
