import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { formatBaseQuantity } from "../../../constants/measurements";
import { listarMovimientosProducto } from "../../../services/movementService";
import { obtenerProducto } from "../../../services/productService";
import { useAppTheme } from "../../../theme/AppThemeProvider";
import { formatLocalSaleDateTime } from "../../../utils/saleDateTime";

const MOVEMENT_CONFIG = {
  ajuste: {
    color: "#2563EB",
    icon: "options-outline",
    label: "Ajuste",
  },
  entrada: {
    color: "#0F8A45",
    icon: "arrow-down-circle-outline",
    label: "Entrada",
  },
  salida: {
    color: "#DC2626",
    icon: "arrow-up-circle-outline",
    label: "Salida",
  },
};

export default function ProductMovementsScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams();
  const [cargando, setCargando] = useState(true);
  const [movimientos, setMovimientos] = useState([]);
  const [producto, setProducto] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      const [productoData, movimientosData] = await Promise.all([
        obtenerProducto(id),
        listarMovimientosProducto(id),
      ]);

      setProducto(productoData);
      setMovimientos(movimientosData);
    } catch (error) {
      Alert.alert("Error", error.message);
      router.back();
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  if (cargando) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Cargando movimientos...
        </Text>
      </View>
    );
  }

  if (!producto) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.productCard, { backgroundColor: colors.card }]}>
        <View style={[styles.productIcon, { backgroundColor: colors.iconSoft }]}>
          <Ionicons name="cube-outline" size={25} color={colors.primary} />
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]}>
            {producto.nombre}
          </Text>
          <Text style={[styles.productStock, { color: colors.textMuted }]}>
            Stock actual: {formatBaseQuantity(producto.stock, producto.unidad_base)}
          </Text>
        </View>
      </View>

      <FlatList
        data={movimientos}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Ionicons
              name="swap-vertical-outline"
              size={42}
              color={colors.textMuted}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Sin movimientos registrados
            </Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Los próximos cambios de stock aparecerán aquí.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <MovementCard
            item={item}
            unidadBase={producto.unidad_base}
          />
        )}
      />
    </View>
  );
}

function MovementCard({ item, unidadBase }) {
  const { colors } = useAppTheme();
  const config = MOVEMENT_CONFIG[item.tipo] ?? MOVEMENT_CONFIG.ajuste;
  const cantidad = Number(item.cantidad_movida ?? 0);
  const cantidadText = `${cantidad > 0 ? "+" : ""}${cantidad} x ${unidadBase}`;

  return (
    <View style={[styles.movementCard, { backgroundColor: colors.card }]}>
      <View style={styles.movementHeader}>
        <View style={[styles.typeIcon, { backgroundColor: `${config.color}1A` }]}>
          <Ionicons name={config.icon} size={25} color={config.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.typeLabel, { color: config.color }]}>
            {config.label}
          </Text>
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {formatLocalSaleDateTime(item.fecha)}
          </Text>
        </View>
        <Text style={[styles.quantityText, { color: config.color }]}>
          {cantidadText}
        </Text>
      </View>

      <View style={[styles.stockChange, { backgroundColor: colors.cardMuted }]}>
        <StockValue
          label="Anterior"
          value={formatBaseQuantity(item.cantidad_anterior, unidadBase)}
        />
        <Ionicons name="arrow-forward" size={18} color={colors.textMuted} />
        <StockValue
          label="Nuevo"
          value={formatBaseQuantity(item.cantidad_nueva, unidadBase)}
        />
      </View>

      <InfoRow label="Motivo" value={item.motivo} />
      <InfoRow label="Responsable" value={item.responsable} />

      {item.origen === "venta" && item.referencia_id ? (
        <TouchableOpacity
          style={[styles.saleLink, { borderColor: colors.border }]}
          onPress={() => router.push(`/ventas/${item.referencia_id}`)}
        >
          <Ionicons name="receipt-outline" size={18} color={colors.primary} />
          <Text style={[styles.saleLinkText, { color: colors.primary }]}>
            Ver venta #{item.referencia_id}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function StockValue({ label, value }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.stockValue}>
      <Text style={[styles.stockLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.stockNumber, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function InfoRow({ label, value }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  dateText: {
    fontSize: 12,
    marginTop: 3,
  },
  emptyCard: {
    alignItems: "center",
    borderRadius: 14,
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 10,
  },
  headerText: {
    flex: 1,
    marginLeft: 10,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  infoRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 14,
    textAlign: "right",
  },
  listContent: {
    paddingBottom: 28,
  },
  loadingText: {
    marginTop: 10,
  },
  movementCard: {
    borderRadius: 14,
    marginBottom: 12,
    padding: 14,
  },
  movementHeader: {
    alignItems: "center",
    flexDirection: "row",
  },
  productCard: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 14,
    padding: 14,
  },
  productIcon: {
    alignItems: "center",
    borderRadius: 13,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 19,
    fontWeight: "900",
  },
  productStock: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "900",
    marginLeft: 8,
  },
  saleLink: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 13,
    minHeight: 42,
    paddingHorizontal: 11,
  },
  saleLinkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
  },
  stockChange: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 13,
    padding: 12,
  },
  stockLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  stockNumber: {
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3,
  },
  stockValue: {
    flex: 1,
  },
  typeIcon: {
    alignItems: "center",
    borderRadius: 12,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: "900",
  },
});
