import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { formatCurrency } from "../../constants/measurements";
import { obtenerVenta } from "../../services/salesService";

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams();
  const [cargando, setCargando] = useState(true);
  const [detalle, setDetalle] = useState([]);
  const [venta, setVenta] = useState(null);

  const cargarVenta = useCallback(async () => {
    try {
      setCargando(true);
      const data = await obtenerVenta(id);
      setVenta(data.venta);
      setDetalle(data.detalle);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargarVenta();
  }, [cargarVenta]);

  const resumen = useMemo(
    () => ({
      lineas: detalle.length,
      productos: detalle.reduce(
        (sum, item) => sum + Number(item.cantidad_base ?? 0),
        0,
      ),
    }),
    [detalle],
  );

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#003B95" />
        <Text style={styles.loadingText}>Cargando venta...</Text>
      </View>
    );
  }

  if (!venta) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={detalle}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            <View style={styles.headerCard}>
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.title}>Venta #{venta.id}</Text>
                  <Text style={styles.dateText}>{formatDateTime(venta.fecha)}</Text>
                </View>
                <PaymentBadge method={venta.metodo_pago} />
              </View>

              <Text style={styles.totalLabel}>Total cobrado</Text>
              <Text style={styles.totalText}>{formatCurrency(venta.total)}</Text>
            </View>

            <View style={styles.summaryGrid}>
              <SummaryItem
                icon="cube-outline"
                label="Unidades"
                value={resumen.productos}
              />
              <SummaryItem
                icon="list-outline"
                label="Lineas"
                value={resumen.lineas}
              />
            </View>

            <View style={styles.paymentCard}>
              <InfoRow
                label="Metodo de pago"
                value={capitalize(venta.metodo_pago)}
              />
              <InfoRow label="Recibido" value={formatCurrency(venta.recibido)} />
              <InfoRow label="Cambio" value={formatCurrency(venta.cambio)} />
            </View>

            <Text style={styles.sectionTitle}>Productos vendidos</Text>
          </>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.detailCard}>
            <View style={styles.productHeader}>
              <View style={styles.productIcon}>
                <Ionicons name="cube-outline" size={22} color="#003B95" />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.producto_nombre}</Text>
                <Text style={styles.detailText}>
                  {item.cantidad_presentaciones} x {item.presentacion_nombre}
                </Text>
              </View>
              <Text style={styles.subtotalText}>{formatCurrency(item.subtotal)}</Text>
            </View>

            <View style={styles.productMetaBox}>
              <InfoRow
                label="Equivalencia"
                value={`${item.cantidad_base} x ${item.unidad_base}`}
              />
              <InfoRow
                label="Precio unitario"
                value={formatCurrency(item.precio_unitario)}
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function SummaryItem({ icon, label, value }) {
  return (
    <View style={styles.summaryItem}>
      <Ionicons name={icon} size={22} color="#003B95" />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function PaymentBadge({ method }) {
  const normalized = method || "efectivo";
  const color = normalized === "efectivo" ? "#0F8A45" : "#003B95";

  return (
    <View style={[styles.paymentBadge, { backgroundColor: `${color}1A` }]}>
      <Text style={[styles.paymentBadgeText, { color }]}>
        {capitalize(normalized)}
      </Text>
    </View>
  );
}

function capitalize(value) {
  const text = String(value || "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDateTime(value) {
  if (!value) {
    return "Sin fecha";
  }

  return String(value).replace("T", " ");
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  dateText: {
    color: "#DBEAFE",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    padding: 14,
  },
  detailText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  headerCard: {
    backgroundColor: "#003B95",
    borderRadius: 18,
    marginBottom: 12,
    padding: 18,
  },
  headerTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },
  infoRow: {
    alignItems: "center",
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  infoValue: {
    color: "#0F172A",
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
  },
  listContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  loadingText: {
    color: "#64748B",
    marginTop: 10,
  },
  paymentBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },
  paymentCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  productHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  productIcon: {
    alignItems: "center",
    backgroundColor: "#EAF2FF",
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    marginRight: 10,
    width: 42,
  },
  productInfo: {
    flex: 1,
    paddingRight: 8,
  },
  productMetaBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  productName: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
    marginTop: 4,
  },
  subtotalText: {
    color: "#0F8A45",
    fontSize: 16,
    fontWeight: "900",
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    flex: 1,
    padding: 14,
  },
  summaryLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  summaryValue: {
    color: "#003B95",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
  },
  totalLabel: {
    color: "#DBEAFE",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 18,
    textTransform: "uppercase",
  },
  totalText: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 4,
  },
});
