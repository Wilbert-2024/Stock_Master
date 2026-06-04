import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { formatCurrency } from "../../constants/measurements";
import { listarCategorias } from "../../services/categoryService";
import { listarProductos } from "../../services/productService";
import { useAppTheme } from "../../theme/AppThemeProvider";

const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "bajo_stock", label: "Bajo stock" },
  { id: "por_vencer", label: "Por vencer" },
];
const SEARCH_MODES = [
  { id: "nombre", label: "Nombre", placeholder: "Buscar por nombre" },
  { id: "codigo", label: "Codigo", placeholder: "Buscar por codigo de barras" },
  { id: "precio", label: "Precio", placeholder: "Buscar por precio" },
  { id: "categoria", label: "Categoria", placeholder: "Buscar por categoria" },
];

export default function InventarioScreen() {
  const { colors } = useAppTheme();
  const [busqueda, setBusqueda] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [categoriaId, setCategoriaId] = useState("todas");
  const [filtro, setFiltro] = useState("todos");
  const [productos, setProductos] = useState([]);
  const [tipoBusqueda, setTipoBusqueda] = useState("nombre");

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      const [productosData, categoriasData] = await Promise.all([
        listarProductos(),
        listarCategorias(),
      ]);

      setProductos(productosData);
      setCategorias(categoriasData);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [cargarDatos]),
  );

  const productosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();

    return productos.filter((producto) => {
      const coincideBusqueda = coincideConBusqueda(producto, term, tipoBusqueda);
      const coincideCategoria =
        categoriaId === "todas" || Number(producto.categoria_id) === Number(categoriaId);
      const coincideFiltro =
        filtro === "todos" ||
        (filtro === "bajo_stock" && producto.stock <= producto.stock_minimo) ||
        (filtro === "por_vencer" && productoVencePronto(producto.fecha_vencimiento));

      return coincideBusqueda && coincideCategoria && coincideFiltro;
    });
  }, [busqueda, categoriaId, filtro, productos, tipoBusqueda]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoriaId("todas");
    setFiltro("todos");
    setTipoBusqueda("nombre");
  };
  const selectedSearchMode =
    SEARCH_MODES.find((item) => item.id === tipoBusqueda) ?? SEARCH_MODES[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Inventario</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {productosFiltrados.length} de {productos.length} productos
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addIconButton}
          onPress={() => router.push("/inventario/registrar")}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchModeRow}>
        {SEARCH_MODES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.searchModeButton,
              { borderColor: colors.border },
              tipoBusqueda === item.id && styles.searchModeButtonActive,
            ]}
            onPress={() => {
              setTipoBusqueda(item.id);
              setBusqueda("");
            }}
          >
            <Text
              style={[
                styles.searchModeText,
                { color: colors.textMuted },
                tipoBusqueda === item.id && styles.searchModeTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View
        style={[
          styles.searchBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          keyboardType={tipoBusqueda === "precio" ? "numeric" : "default"}
          placeholder={selectedSearchMode.placeholder}
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda ? (
          <TouchableOpacity onPress={() => setBusqueda("")}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.filterButton,
              { borderColor: colors.border },
              filtro === item.id && styles.filterActive,
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

      <FlatList
        horizontal
        data={[{ id: "todas", nombre: "Todas" }, ...categorias]}
        keyExtractor={(item) => String(item.id)}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              { backgroundColor: colors.card, borderColor: colors.border },
              String(categoriaId) === String(item.id) && styles.categoryChipActive,
            ]}
            onPress={() => setCategoriaId(item.id)}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: colors.textMuted },
                String(categoriaId) === String(item.id) &&
                  styles.categoryChipTextActive,
              ]}
            >
              {item.nombre}
            </Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.secondaryAction, { backgroundColor: colors.iconSoft }]}
          onPress={() => router.push("/inventario/desactivados")}
        >
          <Ionicons name="archive-outline" size={18} color={colors.primaryDark} />
          <Text style={[styles.secondaryActionText, { color: colors.primaryDark }]}>
            Desactivados
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryAction, { backgroundColor: colors.iconSoft }]}
          onPress={limpiarFiltros}
        >
          <Ionicons name="refresh-outline" size={18} color={colors.primaryDark} />
          <Text style={[styles.secondaryActionText, { color: colors.primaryDark }]}>
            Limpiar filtros
          </Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={[styles.loadingBox, { backgroundColor: colors.card }]}>
          <ActivityIndicator color="#003B95" />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Cargando inventario...
          </Text>
        </View>
      ) : (
        <FlatList
          data={productosFiltrados}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <View style={[styles.emptyBox, { backgroundColor: colors.card }]}>
              <Ionicons name="cube-outline" size={42} color="#94A3B8" />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Sin resultados
              </Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Cambia la busqueda o limpia los filtros.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/inventario/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.productInfo}>
                  <HighlightedText
                    highlight={tipoBusqueda === "nombre" ? busqueda : ""}
                    style={[styles.productName, { color: colors.text }]}
                    text={item.nombre}
                  />
                  <HighlightedText
                    highlight={tipoBusqueda === "categoria" ? busqueda : ""}
                    style={[styles.categoryText, { color: colors.primaryDark }]}
                    text={item.categoria_nombre}
                  />
                </View>
                {item.stock <= item.stock_minimo ? (
                  <StatusBadge color="#B45309" text="Bajo stock" />
                ) : productoVencePronto(item.fecha_vencimiento) ? (
                  <StatusBadge color="#DC2626" text="Por vencer" />
                ) : null}
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  <HighlightedText
                    highlight={tipoBusqueda === "precio" ? busqueda : ""}
                    style={[styles.metaText, { color: colors.textMuted }]}
                    text={formatCurrency(item.precio)}
                  />{" "}
                  / {item.presentacion_nombre}
                </Text>
                <Text style={styles.stockText}>
                  {item.stock} x {item.unidad_base}
                </Text>
              </View>

              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                Minimo:{" "}
                <HighlightedText
                  highlight={tipoBusqueda === "precio" ? busqueda : ""}
                  style={[styles.metaText, { color: colors.textMuted }]}
                  text={formatCurrency(item.precio_base)}
                />{" "}
                por {item.unidad_base}
              </Text>

              {item.codigo_barras ? (
                <Text style={[styles.codeText, { color: colors.textMuted }]}>
                  Codigo:{" "}
                  <HighlightedText
                    highlight={tipoBusqueda === "codigo" ? busqueda : ""}
                    style={[styles.codeText, { color: colors.textMuted }]}
                    text={item.codigo_barras}
                  />
                </Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function coincideConBusqueda(producto, term, tipoBusqueda) {
  if (!term) {
    return true;
  }

  if (tipoBusqueda === "codigo") {
    return producto.codigo_barras?.toLowerCase().includes(term);
  }

  if (tipoBusqueda === "precio") {
    const precio = String(producto.precio ?? "").toLowerCase();
    const precioBase = String(producto.precio_base ?? "").toLowerCase();
    const precioFormateado = formatCurrency(Number(producto.precio)).toLowerCase();
    const precioBaseFormateado = formatCurrency(Number(producto.precio_base)).toLowerCase();

    return (
      precio.includes(term) ||
      precioBase.includes(term) ||
      precioFormateado.includes(term) ||
      precioBaseFormateado.includes(term)
    );
  }

  if (tipoBusqueda === "categoria") {
    return producto.categoria_nombre?.toLowerCase().includes(term);
  }

  return producto.nombre?.toLowerCase().includes(term);
}

function HighlightedText({ highlight, style, text }) {
  const value = String(text ?? "");
  const query = highlight.trim();

  if (!query) {
    return <Text style={style}>{value}</Text>;
  }

  const lowerValue = value.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts = [];
  let cursor = 0;
  let index = lowerValue.indexOf(lowerQuery, cursor);

  while (index !== -1) {
    if (index > cursor) {
      parts.push({ text: value.slice(cursor, index), match: false });
    }

    parts.push({
      text: value.slice(index, index + query.length),
      match: true,
    });
    cursor = index + query.length;
    index = lowerValue.indexOf(lowerQuery, cursor);
  }

  if (cursor < value.length) {
    parts.push({ text: value.slice(cursor), match: false });
  }

  return (
    <Text style={style}>
      {parts.map((part, partIndex) => (
        <Text
          key={`${part.text}-${partIndex}`}
          style={part.match ? styles.highlightText : null}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
}

function productoVencePronto(fechaVencimiento) {
  if (!fechaVencimiento) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiration = new Date(`${fechaVencimiento}T12:00:00`);
  const diffDays = Math.ceil((expiration - today) / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays <= 30;
}

function StatusBadge({ color, text }) {
  return (
    <View style={[styles.statusBadge, { backgroundColor: `${color}1A` }]}>
      <Text style={[styles.statusBadgeText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  addIconButton: {
    alignItems: "center",
    backgroundColor: "#0F8A45",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 10,
    padding: 14,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  categoryChip: {
    backgroundColor: "#fff",
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  categoryChipActive: {
    backgroundColor: "#003B95",
    borderColor: "#003B95",
  },
  categoryChipText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  categoryList: {
    flexGrow: 0,
    marginBottom: 10,
  },
  categoryText: {
    color: "#003B95",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  codeText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  emptyBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 12,
    padding: 24,
  },
  emptyText: {
    color: "#64748B",
    marginTop: 5,
    textAlign: "center",
  },
  emptyTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 10,
  },
  filterActive: {
    backgroundColor: "#003B95",
    borderColor: "#003B95",
  },
  filterButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  filterText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  filterTextActive: {
    color: "#fff",
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
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
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  metaText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  productInfo: {
    flex: 1,
    paddingRight: 10,
  },
  productName: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "900",
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: "#0F172A",
    flex: 1,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 10,
  },
  searchModeButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  searchModeButtonActive: {
    backgroundColor: "#0F8A45",
    borderColor: "#0F8A45",
  },
  searchModeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  searchModeText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  searchModeTextActive: {
    color: "#fff",
  },
  secondaryAction: {
    alignItems: "center",
    backgroundColor: "#EAF2FF",
    borderRadius: 12,
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 11,
  },
  secondaryActionText: {
    color: "#003B95",
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 6,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "900",
  },
  stockText: {
    color: "#0F8A45",
    fontSize: 14,
    fontWeight: "900",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3,
  },
  title: {
    color: "#0F172A",
    fontSize: 30,
    fontWeight: "900",
  },
  highlightText: {
    backgroundColor: "#DCFCE7",
    color: "#0F8A45",
    fontWeight: "900",
  },
});
