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

import { formatCurrency } from "../../constants/measurements";
import {
  borrarProductoDesactivado,
  listarProductosDesactivados,
  restaurarProducto,
} from "../../services/productService";

const MAX_DISABLED_PRODUCTS = 10;

const getCapacityColor = (total) => {
  if (total <= 3) {
    return "#0F8A45";
  }

  if (total <= 7) {
    return "#D97706";
  }

  return "#DC2626";
};

export default function DisabledProductsScreen() {
  const [cargando, setCargando] = useState(true);
  const [productos, setProductos] = useState([]);

  const cargarProductos = useCallback(async () => {
    try {
      setCargando(true);
      const data = await listarProductosDesactivados();
      setProductos(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarProductos();
    }, [cargarProductos]),
  );

  const capacidad = useMemo(
    () => ({
      color: getCapacityColor(productos.length),
      disponibles: Math.max(MAX_DISABLED_PRODUCTS - productos.length, 0),
      lleno: productos.length >= MAX_DISABLED_PRODUCTS,
      porcentaje: Math.min(productos.length / MAX_DISABLED_PRODUCTS, 1),
    }),
    [productos.length],
  );

  const confirmarReactivar = (producto) => {
    Alert.alert(
      "Reactivar producto",
      `${producto.nombre} volvera a aparecer en inventario y podra venderse nuevamente.`,
      [
        { style: "cancel", text: "Cancelar" },
        {
          text: "Reactivar",
          onPress: async () => {
            try {
              await restaurarProducto(producto.id);
              await cargarProductos();
              Alert.alert("Listo", "Producto reactivado");
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
    );
  };

  const confirmarBorrado = (producto) => {
    Alert.alert(
      "Borrar definitivamente",
      `Esta accion eliminara ${producto.nombre} de forma permanente. No podras recuperarlo desde productos desactivados.`,
      [
        { style: "cancel", text: "Cancelar" },
        {
          style: "destructive",
          text: "Borrar",
          onPress: async () => {
            try {
              await borrarProductoDesactivado(producto.id);
              await cargarProductos();
              Alert.alert("Listo", "Producto borrado definitivamente");
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextBox}>
          <Text style={styles.title}>Productos desactivados</Text>
          <Text style={[styles.subtitle, { color: capacidad.color }]}>
            {productos.length}/{MAX_DISABLED_PRODUCTS} almacenados
          </Text>
        </View>

        <TouchableOpacity
          style={styles.inventoryButton}
          onPress={() => router.push("/inventario")}
        >
          <Ionicons name="cube-outline" size={18} color="#fff" />
          <Text style={styles.inventoryButtonText}>Inventario</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.capacityCard, capacidad.lleno && styles.capacityFull]}>
        <View style={styles.capacityHeader}>
          <View style={styles.capacityIcon}>
            <Ionicons
              name={capacidad.lleno ? "alert-circle-outline" : "archive-outline"}
              size={26}
              color={capacidad.lleno ? "#DC2626" : "#003B95"}
            />
          </View>
          <View style={styles.capacityCopy}>
            <Text style={styles.capacityTitle}>
              {capacidad.lleno ? "Limite alcanzado" : "Espacio disponible"}
            </Text>
            <Text style={styles.capacityText}>
              {capacidad.lleno
                ? "Borra definitivamente o reactiva un producto antes de desactivar otro."
                : `Puedes almacenar ${capacidad.disponibles} producto(s) desactivado(s) mas.`}
            </Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: capacidad.color },
              { width: `${capacidad.porcentaje * 100}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={22} color="#003B95" />
        <Text style={styles.infoText}>
          Estos productos no aparecen en inventario ni ventas. Reactivalos para
          usarlos otra vez o borralos para liberar espacio.
        </Text>
      </View>

      {cargando ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#003B95" />
          <Text style={styles.loadingText}>Cargando productos...</Text>
        </View>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="archive-outline" size={44} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No hay productos desactivados</Text>
              <Text style={styles.emptyText}>
                Cuando desactives un producto aparecera aqui.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.productIcon}>
                  <Ionicons name="cube-outline" size={23} color="#003B95" />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.nombre}</Text>
                  <Text style={styles.categoryText}>{item.categoria_nombre}</Text>
                </View>
              </View>

              <View style={styles.detailBox}>
                <InfoRow
                  label="Precio"
                  value={`${formatCurrency(item.precio)} / ${item.presentacion_nombre}`}
                />
                <InfoRow
                  label="Stock guardado"
                  value={`${item.stock} x ${item.unidad_base}`}
                />
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.restoreButton]}
                  onPress={() => confirmarReactivar(item)}
                >
                  <Ionicons name="refresh-outline" size={18} color="#0F8A45" />
                  <Text style={styles.restoreText}>Reactivar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => confirmarBorrado(item)}
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  <Text style={styles.deleteText}>Borrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
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

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 44,
    padding: 11,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  capacityCard: {
    backgroundColor: "#fff",
    borderColor: "#DBEAFE",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  capacityCopy: {
    flex: 1,
    marginLeft: 10,
  },
  capacityFull: {
    borderColor: "#FECACA",
  },
  capacityHeader: {
    alignItems: "center",
    flexDirection: "row",
  },
  capacityIcon: {
    alignItems: "center",
    backgroundColor: "#EAF2FF",
    borderRadius: 13,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  capacityText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 3,
  },
  capacityTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "900",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    padding: 15,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
  },
  categoryText: {
    color: "#003B95",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 3,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  deleteButton: {
    backgroundColor: "#FEE2E2",
  },
  deleteText: {
    color: "#DC2626",
    fontWeight: "900",
    marginLeft: 6,
  },
  detailBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginTop: 12,
    paddingHorizontal: 12,
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
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTextBox: {
    flex: 1,
    paddingRight: 10,
  },
  infoCard: {
    alignItems: "flex-start",
    backgroundColor: "#EAF2FF",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 14,
    padding: 13,
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
    paddingVertical: 9,
  },
  infoText: {
    color: "#1E3A8A",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginLeft: 9,
  },
  infoValue: {
    color: "#0F172A",
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
  },
  inventoryButton: {
    alignItems: "center",
    backgroundColor: "#003B95",
    borderRadius: 12,
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inventoryButtonText: {
    color: "#fff",
    fontWeight: "900",
    marginLeft: 6,
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
  productIcon: {
    alignItems: "center",
    backgroundColor: "#EAF2FF",
    borderRadius: 13,
    height: 46,
    justifyContent: "center",
    marginRight: 10,
    width: 46,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },
  progressFill: {
    borderRadius: 999,
    height: 8,
  },
  progressTrack: {
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    height: 8,
    marginTop: 14,
    overflow: "hidden",
  },
  restoreButton: {
    backgroundColor: "#EAF8EA",
  },
  restoreText: {
    color: "#0F8A45",
    fontWeight: "900",
    marginLeft: 6,
  },
  subtitle: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  title: {
    color: "#0F172A",
    fontSize: 26,
    fontWeight: "900",
  },
});
