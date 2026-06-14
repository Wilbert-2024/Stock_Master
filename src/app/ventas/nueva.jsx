import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { formatCurrency } from "../../constants/measurements";
import {
  buscarProductoPorCodigo,
  listarProductos,
} from "../../services/productService";
import { crearVenta } from "../../services/salesService";
import { useAppTheme } from "../../theme/AppThemeProvider";

const BARCODE_TYPES = [
  "aztec",
  "codabar",
  "code128",
  "code39",
  "code93",
  "datamatrix",
  "ean13",
  "ean8",
  "itf14",
  "pdf417",
  "qr",
  "upc_a",
  "upc_e",
];

const tienePresentacionAdicional = (producto) =>
  Number(producto?.cantidad_por_presentacion ?? 1) > 1 &&
  producto?.presentacion_nombre !== producto?.unidad_base;

export default function NewSaleScreen() {
  const { colors } = useAppTheme();
  const [carrito, setCarrito] = useState([]);
  const [escaneando, setEscaneando] = useState(false);
  const [escaneoBloqueado, setEscaneoBloqueado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [linternaEncendida, setLinternaEncendida] = useState(false);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [permission, requestPermission] = useCameraPermissions();
  const [productos, setProductos] = useState([]);
  const [recibido, setRecibido] = useState("");

  const cargarProductos = useCallback(async () => {
    const data = await listarProductos();
    setProductos(data.filter((producto) => producto.stock > 0));
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarProductos();
    }, [cargarProductos]),
  );

  const total = useMemo(
    () => carrito.reduce((sum, item) => sum + item.subtotal, 0),
    [carrito],
  );
  const recibidoNumber = Number(recibido || 0);
  const cambio =
    metodoPago === "efectivo" && recibidoNumber >= total
      ? recibidoNumber - total
      : 0;
  const carritoValido =
    carrito.length > 0 &&
    carrito.every(
      (item) =>
        item.cantidad_presentaciones > 0 &&
        item.cantidad_base > 0 &&
        item.subtotal > 0,
    );
  const inputTheme = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    color: colors.text,
  };

  const cantidadEnCarrito = (productoId, current = carrito, exceptKey = null) =>
    current
      .filter((item) => item.producto_id === productoId)
      .filter((item) => item.key !== exceptKey)
      .reduce((sum, item) => sum + item.cantidad_base, 0);

  const agregarProducto = (producto, modo) => {
    const esPresentacion = modo === "presentacion";
    const cantidadBase = esPresentacion ? producto.cantidad_por_presentacion : 1;
    const precioUnitario = esPresentacion ? producto.precio : producto.precio_base;
    const presentacionNombre = esPresentacion
      ? producto.presentacion_nombre
      : producto.unidad_base;
    const key = `${producto.id}-${modo}`;

    setCarrito((current) => {
      const cantidadActual = cantidadEnCarrito(producto.id, current);

      if (cantidadActual + cantidadBase > producto.stock) {
        Alert.alert(
          "Stock insuficiente",
          `Solo quedan ${producto.stock - cantidadActual} x ${producto.unidad_base} disponibles de ${producto.nombre}.`,
        );
        return current;
      }

      const existing = current.find((item) => item.key === key);

      if (!existing) {
        return [
          ...current,
          {
            cantidad_base: cantidadBase,
            cantidad_presentaciones: 1,
            cantidad_texto: "1",
            key,
            paso_base: cantidadBase,
            precio_unitario: precioUnitario,
            producto_id: producto.id,
            producto_nombre: producto.nombre,
            presentacion_nombre: presentacionNombre,
            stock_disponible: producto.stock,
            subtotal: precioUnitario,
            unidad_base: producto.unidad_base,
          },
        ];
      }

      return current.map((item) =>
        item.key === key
          ? {
              ...item,
              cantidad_base: item.cantidad_base + cantidadBase,
              cantidad_presentaciones: item.cantidad_presentaciones + 1,
              cantidad_texto: String(item.cantidad_presentaciones + 1),
              subtotal: item.subtotal + precioUnitario,
            }
          : item,
      );
    });
  };

  const actualizarCantidadCarrito = (key, cantidadTexto) => {
    const soloNumeros = cantidadTexto.replace(/[^0-9]/g, "");

    setCarrito((current) =>
      current.map((item) => {
        if (item.key !== key) {
          return item;
        }

        if (!soloNumeros) {
          return {
            ...item,
            cantidad_base: 0,
            cantidad_presentaciones: 0,
            cantidad_texto: "",
            subtotal: 0,
          };
        }

        const cantidadSolicitada = Number(soloNumeros);
        const otrasCantidades = cantidadEnCarrito(item.producto_id, current, key);
        const maximoPermitido = Math.floor(
          (item.stock_disponible - otrasCantidades) / item.paso_base,
        );
        const cantidadFinal = Math.min(cantidadSolicitada, maximoPermitido);

        if (cantidadSolicitada > maximoPermitido) {
          Alert.alert(
            "Stock insuficiente",
            `Solo puedes vender ${maximoPermitido} x ${item.presentacion_nombre} de ${item.producto_nombre}.`,
          );
        }

        return {
          ...item,
          cantidad_base: cantidadFinal * item.paso_base,
          cantidad_presentaciones: cantidadFinal,
          cantidad_texto: String(cantidadFinal),
          subtotal: cantidadFinal * item.precio_unitario,
        };
      }),
    );
  };

  const quitarProducto = (key) => {
    const item = carrito.find((cartItem) => cartItem.key === key);

    if (!item) {
      return;
    }

    if (item.cantidad_presentaciones <= 1) {
      eliminarProductoCarrito(key);
      return;
    }

    actualizarCantidadCarrito(key, String(item.cantidad_presentaciones - 1));
  };

  const eliminarProductoCarrito = (key) => {
    setCarrito((current) => current.filter((item) => item.key !== key));
  };

  const stockRestante = (item) =>
    item.stock_disponible - cantidadEnCarrito(item.producto_id);

  const abrirEscaner = async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();

      if (!result.granted) {
        Alert.alert(
          "Permiso de cámara",
          "Necesitamos acceso a la cámara para escanear códigos de barras.",
        );
        return;
      }
    }

    setEscaneoBloqueado(false);
    setLinternaEncendida(false);
    setEscaneando(true);
  };

  const manejarCodigoEscaneado = async ({ data }) => {
    if (escaneoBloqueado) {
      return;
    }

    setEscaneoBloqueado(true);

    try {
      const producto = await buscarProductoPorCodigo(data);

      if (!producto) {
        Alert.alert(
          "Producto no encontrado",
          `No existe un producto activo con el código ${data}.`,
          [
            {
              text: "Escanear otra vez",
              onPress: () => setEscaneoBloqueado(false),
            },
            {
              style: "cancel",
              text: "Cerrar",
              onPress: () => setEscaneando(false),
            },
          ],
        );
        return;
      }

      if (producto.stock <= 0) {
        Alert.alert("Sin stock", `${producto.nombre} no tiene stock disponible.`, [
          { text: "Escanear otra vez", onPress: () => setEscaneoBloqueado(false) },
          { style: "cancel", text: "Cerrar", onPress: () => setEscaneando(false) },
        ]);
        return;
      }

      const accionesProducto = [
        {
          text: `Agregar ${producto.unidad_base}`,
          onPress: () => {
            agregarProducto(producto, "minima");
            setEscaneando(false);
          },
        },
        {
          style: "cancel",
          text: "Escanear otra vez",
          onPress: () => setEscaneoBloqueado(false),
        },
      ];

      if (tienePresentacionAdicional(producto)) {
        accionesProducto.splice(1, 0, {
          text: `Agregar ${producto.presentacion_nombre}`,
          onPress: () => {
            agregarProducto(producto, "presentacion");
            setEscaneando(false);
          },
        });
      }

      Alert.alert("Producto encontrado", producto.nombre, accionesProducto);
    } catch (error) {
      Alert.alert("Error", error.message, [
        { text: "Intentar de nuevo", onPress: () => setEscaneoBloqueado(false) },
        { style: "cancel", text: "Cerrar", onPress: () => setEscaneando(false) },
      ]);
    }
  };

  const confirmarVenta = () => {
    if (!carritoValido) {
      Alert.alert("Carrito incompleto", "Revisa las cantidades antes de guardar.");
      return;
    }

    Alert.alert(
      "Confirmar venta",
      `Total: ${formatCurrency(total)}\nProductos en carrito: ${carrito.length}\nMétodo: ${metodoPago}`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Guardar", onPress: guardarVenta },
      ],
    );
  };

  const guardarVenta = async () => {
    try {
      setGuardando(true);
      const ventaId = await crearVenta({
        carrito,
        metodo_pago: metodoPago,
        recibido: metodoPago === "efectivo" ? recibido : total,
      });

      Alert.alert("Éxito", "Venta guardada correctamente");
      router.replace(`/ventas/${ventaId}`);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setGuardando(false);
    }
  };

  if (escaneando) {
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          active={escaneando}
          barcodeScannerSettings={{
            barcodeTypes: BARCODE_TYPES,
          }}
          enableTorch={linternaEncendida}
          facing="back"
          onMountError={({ message }) => {
            Alert.alert(
              "Error",
              message || "No se pudo iniciar la cámara del escáner.",
            );
          }}
          onBarcodeScanned={
            escaneoBloqueado ? undefined : manejarCodigoEscaneado
          }
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.scannerOverlay}>
          <TouchableOpacity
            style={styles.closeScannerButton}
            onPress={() => {
              setLinternaEncendida(false);
              setEscaneando(false);
            }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.torchButton,
              linternaEncendida && styles.torchButtonActive,
            ]}
            onPress={() => setLinternaEncendida((current) => !current)}
          >
            <Ionicons
              name={linternaEncendida ? "flash" : "flash-off-outline"}
              size={24}
              color="#fff"
            />
            <Text style={styles.torchText}>
              {linternaEncendida ? "Flash encendido" : "Flash apagado"}
            </Text>
          </TouchableOpacity>

          <View style={styles.scanBox} />

          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>Escanear para vender</Text>
            <Text style={styles.instructionsText}>
              Alinea el código de barras dentro del recuadro.
            </Text>
            {escaneoBloqueado ? (
              <Button
                title="Escanear otra vez"
                onPress={() => setEscaneoBloqueado(false)}
              />
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: colors.text }]}>Nueva venta</Text>

      <TouchableOpacity
        style={[styles.scanActionButton, { backgroundColor: colors.header }]}
        onPress={abrirEscaner}
      >
        <Ionicons name="barcode-outline" size={24} color="#fff" />
        <View style={styles.scanActionTextBox}>
          <Text style={styles.scanActionTitle}>Escanear producto</Text>
          <Text style={styles.scanActionSubtitle}>
            Buscar por código y agregar al carrito
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Productos</Text>
      {productos.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No hay productos disponibles
          </Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Registra productos con stock para poder vender.
          </Text>
        </View>
      ) : (
        productos.map((producto) => {
          const mostrarPresentacion = tienePresentacionAdicional(producto);

          return (
            <View
              key={producto.id}
              style={[styles.productCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.productHeader}>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]}>
                    {producto.nombre}
                  </Text>
                  <Text style={[styles.productMeta, { color: colors.textMuted }]}>
                    Stock: {producto.stock} x {producto.unidad_base}
                  </Text>
                </View>
                <View style={[styles.stockPill, { backgroundColor: colors.iconSoft }]}>
                  <Text style={[styles.stockPillText, { color: colors.primary }]}>
                    {producto.categoria_nombre}
                  </Text>
                </View>
              </View>

              {mostrarPresentacion ? (
                <Text style={[styles.productMeta, { color: colors.textMuted }]}>
                  {formatCurrency(producto.precio)} / {producto.presentacion_nombre}
                </Text>
              ) : null}
              <Text style={[styles.productMeta, { color: colors.textMuted }]}>
                {formatCurrency(producto.precio_base)} / {producto.unidad_base}
              </Text>

              <View style={styles.productActions}>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.welcome }]}
                  onPress={() => agregarProducto(producto, "minima")}
                >
                  <Text style={[styles.addButtonText, { color: colors.success }]}>
                    + {producto.unidad_base}
                  </Text>
                </TouchableOpacity>

                {mostrarPresentacion ? (
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.welcome }]}
                    onPress={() => agregarProducto(producto, "presentacion")}
                  >
                    <Text style={[styles.addButtonText, { color: colors.success }]}>
                      + {producto.presentacion_nombre}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Carrito</Text>
      {carrito.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Carrito vacio
          </Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Agrega productos para cobrar.
          </Text>
        </View>
      ) : (
        carrito.map((item) => (
          <View
            key={item.key}
            style={[styles.cartItem, { backgroundColor: colors.card }]}
          >
            <View style={styles.cartHeader}>
              <View style={styles.cartInfo}>
                <Text style={[styles.cartName, { color: colors.text }]}>
                  {item.producto_nombre}
                </Text>
                <Text style={[styles.cartMeta, { color: colors.textMuted }]}>
                  {item.presentacion_nombre} - {formatCurrency(item.precio_unitario)}
                </Text>
                <Text style={[styles.cartMeta, { color: colors.textMuted }]}>
                  Equivale a {item.cantidad_base} x {item.unidad_base}
                </Text>
                <Text style={styles.stockRemaining}>
                  Restante: {stockRestante(item)} x {item.unidad_base}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.deleteItemButton,
                  { backgroundColor: "rgba(220, 38, 38, 0.14)" },
                ]}
                onPress={() => eliminarProductoCarrito(item.key)}
              >
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>

            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: colors.iconSoft }]}
                onPress={() => quitarProducto(item.key)}
              >
                <Ionicons name="remove" size={22} color={colors.primary} />
              </TouchableOpacity>

              <TextInput
                keyboardType="number-pad"
                onChangeText={(value) => actualizarCantidadCarrito(item.key, value)}
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.quantityInput,
                  {
                    backgroundColor: colors.cardMuted,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={item.cantidad_texto}
              />

              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: colors.iconSoft }]}
                onPress={() =>
                  actualizarCantidadCarrito(
                    item.key,
                    String(item.cantidad_presentaciones + 1),
                  )
                }
              >
                <Ionicons name="add" size={22} color={colors.primary} />
              </TouchableOpacity>

              <View style={styles.cartAmount}>
                <Text style={[styles.cartSubtotal, { color: colors.text }]}>
                  {formatCurrency(item.subtotal)}
                </Text>
                <Text style={[styles.cartUnitCount, { color: colors.textMuted }]}>
                  {item.cantidad_presentaciones || 0} x {item.presentacion_nombre}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}

      <View style={[styles.totalBox, { backgroundColor: colors.header }]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Cobro</Text>
      <View style={styles.paymentRow}>
        {["efectivo", "tarjeta", "otro"].map((method) => (
          <TouchableOpacity
            key={method}
            style={[
              styles.paymentButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              metodoPago === method && styles.paymentButtonActive,
              metodoPago === method && {
                backgroundColor: colors.primaryDark,
                borderColor: colors.primaryDark,
              },
            ]}
            onPress={() => setMetodoPago(method)}
          >
            <Text
              style={[
                styles.paymentText,
                { color: colors.text },
                metodoPago === method && styles.paymentTextActive,
              ]}
            >
              {method}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {metodoPago === "efectivo" ? (
        <>
          <TextInput
            keyboardType="numeric"
            onChangeText={setRecibido}
            placeholder="Monto recibido"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, inputTheme]}
            value={recibido}
          />
          <View style={[styles.changeBox, { backgroundColor: colors.welcome }]}>
            <Text style={[styles.changeLabel, { color: colors.success }]}>
              Cambio
            </Text>
            <Text style={[styles.changeText, { color: colors.success }]}>
              {formatCurrency(cambio)}
            </Text>
          </View>
        </>
      ) : null}

      <TouchableOpacity
        disabled={guardando || !carritoValido}
        onPress={confirmarVenta}
        style={[
          styles.saveButton,
          (guardando || !carritoValido) && styles.saveButtonDisabled,
        ]}
      >
        <Text style={styles.saveButtonText}>
          {guardando ? "Guardando..." : "Confirmar venta"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: "center",
    backgroundColor: "#EAF8EA",
    borderRadius: 10,
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    padding: 10,
  },
  addButtonText: {
    color: "#0F8A45",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  cartAmount: {
    alignItems: "flex-end",
    flex: 1,
  },
  cartHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  cartInfo: {
    flex: 1,
  },
  cartItem: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 10,
    padding: 14,
  },
  cartMeta: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 2,
  },
  cartName: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  cartSubtotal: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "900",
  },
  cartUnitCount: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
    textAlign: "right",
  },
  changeBox: {
    alignItems: "center",
    backgroundColor: "#EAF8EA",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    padding: 14,
  },
  changeLabel: {
    color: "#166534",
    fontSize: 15,
    fontWeight: "800",
  },
  changeText: {
    color: "#0F8A45",
    fontSize: 18,
    fontWeight: "900",
  },
  closeScannerButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    position: "absolute",
    right: 18,
    top: 44,
    width: 48,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  deleteItemButton: {
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 11,
    height: 38,
    justifyContent: "center",
    marginLeft: 10,
    width: 38,
  },
  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 14,
    padding: 16,
  },
  emptyText: {
    color: "#64748B",
    marginTop: 4,
  },
  emptyTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  instructionsBox: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    borderRadius: 16,
    bottom: 44,
    left: 20,
    padding: 18,
    position: "absolute",
    right: 20,
  },
  instructionsText: {
    color: "#D1D5DB",
    fontSize: 14,
    marginBottom: 10,
    marginTop: 6,
    textAlign: "center",
  },
  instructionsTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  paymentButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    marginRight: 8,
    paddingVertical: 11,
  },
  paymentButtonActive: {
    backgroundColor: "#003B95",
    borderColor: "#003B95",
  },
  paymentRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  paymentText: {
    color: "#334155",
    fontWeight: "800",
    textTransform: "capitalize",
  },
  paymentTextActive: {
    color: "#fff",
  },
  productActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    padding: 14,
  },
  productHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  productInfo: {
    flex: 1,
  },
  productMeta: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 3,
  },
  productName: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "800",
  },
  quantityButton: {
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    borderRadius: 10,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  quantityInput: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
    height: 42,
    marginHorizontal: 8,
    textAlign: "center",
    width: 58,
  },
  quantityRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 14,
  },
  scanActionButton: {
    alignItems: "center",
    backgroundColor: "#003B95",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 10,
    padding: 16,
  },
  scanActionSubtitle: {
    color: "#DBEAFE",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  scanActionTextBox: {
    flex: 1,
    marginLeft: 12,
  },
  scanActionTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
  },
  scanBox: {
    alignSelf: "center",
    borderColor: "#22C55E",
    borderRadius: 16,
    borderWidth: 3,
    height: 220,
    width: "78%",
  },
  scannerContainer: {
    backgroundColor: "#000",
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: "center",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#0F8A45",
    borderRadius: 12,
    marginTop: 10,
    padding: 15,
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
    marginTop: 12,
  },
  stockPill: {
    backgroundColor: "#E0F2FE",
    borderRadius: 999,
    marginLeft: 10,
    maxWidth: 130,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stockPillText: {
    color: "#0369A1",
    fontSize: 12,
    fontWeight: "900",
  },
  stockRemaining: {
    color: "#B45309",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  title: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  torchButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.62)",
    borderRadius: 999,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 11,
    position: "absolute",
    top: 44,
  },
  torchButtonActive: {
    backgroundColor: "#0F8A45",
  },
  torchText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 8,
  },
  totalBox: {
    alignItems: "center",
    backgroundColor: "#003B95",
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    padding: 16,
  },
  totalLabel: {
    color: "#DBEAFE",
    fontSize: 16,
    fontWeight: "800",
  },
  totalValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
});
