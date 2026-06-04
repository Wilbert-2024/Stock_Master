import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { formatCurrency } from "../../constants/measurements";
import { listarVentas } from "../../services/salesService";

export default function SalesHistoryScreen() {
  const [cargando, setCargando] = useState(true);
  const [ventas, setVentas] = useState([]);

  const cargarVentas = useCallback(async () => {
    try {
      setCargando(true);
      const data = await listarVentas();
      setVentas(data);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarVentas();
    }, [cargarVentas]),
  );

  const resumen = useMemo(
    () => ({
      productos: ventas.reduce(
        (sum, item) => sum + Number(item.cantidad_productos ?? 0),
        0,
      ),
      total: ventas.reduce((sum, item) => sum + Number(item.total ?? 0), 0),
      ventas: ventas.length,
    }),
    [ventas],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de ventas</Text>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Total historico</Text>
          <Text style={styles.summaryTotal}>{formatCurrency(resumen.total)}</Text>
        </View>

        <View style={styles.summaryRight}>
          <Text style={styles.summaryMini}>{resumen.ventas} ventas</Text>
          <Text style={styles.summaryMini}>{resumen.productos} unidades</Text>
        </View>
      </View>

      {cargando ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#003B95" />
          <Text style={styles.loadingText}>Cargando ventas...</Text>
        </View>
      ) : (
        <FlatList
          data={ventas}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={44} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No hay ventas registradas</Text>
              <Text style={styles.emptyText}>
                Las ventas guardadas apareceran aqui.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/ventas/${item.id}`)}
            >
              <View style={styles.saleIcon}>
                <Ionicons name="receipt-outline" size={24} color="#003B95" />
              </View>

              <View style={styles.saleInfo}>
                <View style={styles.saleHeader}>
                  <Text style={styles.saleTitle}>Venta #{item.id}</Text>
                  <PaymentBadge method={item.metodo_pago} />
                </View>
                <Text style={styles.saleDate}>{formatDateTime(item.fecha)}</Text>
                <Text style={styles.saleMeta}>
                  {item.cantidad_productos} unidades minimas
                </Text>
              </View>

              <View style={styles.saleAmount}>
                <Text style={styles.saleTotal}>{formatCurrency(item.total)}</Text>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function PaymentBadge({ method }) {
  const normalized = method || "efectivo";
  const color = normalized === "efectivo" ? "#0F8A45" : "#003B95";

  return (
    <View style={[styles.paymentBadge, { backgroundColor: `${color}1A` }]}>
      <Text style={[styles.paymentBadgeText, { color }]}>{normalized}</Text>
    </View>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "Sin fecha";
  }

  return String(value).replace("T", " ");
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 12,
    padding: 14,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  emptyBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
  },
  emptyText: {
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
  },
  emptyTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 10,
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
  paymentBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  saleAmount: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  saleDate: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 4,
  },
  saleHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saleIcon: {
    alignItems: "center",
    backgroundColor: "#EAF2FF",
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    marginRight: 12,
    width: 48,
  },
  saleInfo: {
    flex: 1,
  },
  saleMeta: {
    color: "#003B95",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 5,
  },
  saleTitle: {
    color: "#0F172A",
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
    paddingRight: 8,
  },
  saleTotal: {
    color: "#0F8A45",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 4,
  },
  summaryCard: {
    alignItems: "center",
    backgroundColor: "#003B95",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    padding: 18,
  },
  summaryLabel: {
    color: "#DBEAFE",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  summaryMini: {
    color: "#DBEAFE",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  summaryRight: {
    alignItems: "flex-end",
  },
  summaryTotal: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 5,
  },
  title: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 18,
  },
});
