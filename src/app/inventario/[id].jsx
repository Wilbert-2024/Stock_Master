import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  MEASUREMENT_TYPES,
  formatBaseQuantity,
  formatCurrency,
  getMeasurementType,
  getPresentation,
  getPresentationOptions,
} from "../../constants/measurements";
import { listarCategorias } from "../../services/categoryService";
import {
  editarProducto,
  eliminarProducto,
  obtenerProducto,
} from "../../services/productService";
import { useAppTheme } from "../../theme/AppThemeProvider";

export default function ProductDetailScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams();
  const scrollRef = useRef(null);
  const fieldPositions = useRef({});
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [producto, setProducto] = useState(null);
  const [form, setForm] = useState({
    categoria_id: null,
    codigo_barras: "",
    fecha_vencimiento: "",
    nombre: "",
    precio: "",
    precio_compra: "",
    presentacion_id: "unidad",
    stock_minimo_presentaciones: "1",
    stock_presentaciones: "0",
    tipo_medida: "unidad",
  });

  const measurementType = getMeasurementType(form.tipo_medida);
  const presentationOptions = getPresentationOptions(form.tipo_medida);
  const presentation = getPresentation(form.tipo_medida, form.presentacion_id);
  const cantidadPorPresentacion = presentation?.baseUnits ?? 1;
  const precioNumber = Number(form.precio);
  const precioCompraNumber = Number(form.precio_compra);
  const stockNumber = Number(form.stock_presentaciones);
  const stockMinimoNumber = Number(form.stock_minimo_presentaciones);
  const precioBase =
    Number.isFinite(precioNumber) && precioNumber > 0
      ? precioNumber / cantidadPorPresentacion
      : 0;
  const precioCompraBase =
    Number.isFinite(precioCompraNumber) && precioCompraNumber > 0
      ? precioCompraNumber / cantidadPorPresentacion
      : 0;
  const gananciaBase = precioBase - precioCompraBase;
  const stockBase =
    Number.isInteger(stockNumber) && stockNumber >= 0
      ? stockNumber * cantidadPorPresentacion
      : 0;
  const stockMinimoBase =
    Number.isInteger(stockMinimoNumber) && stockMinimoNumber >= 0
      ? stockMinimoNumber * cantidadPorPresentacion
      : 0;
  const themedInputStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    color: colors.text,
  };
  const themedOptionStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border,
  };
  const themedOptionActiveStyle = {
    backgroundColor: colors.welcome,
    borderColor: colors.success,
  };

  const formatearFecha = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const fechaSeleccionada = form.fecha_vencimiento
    ? new Date(`${form.fecha_vencimiento}T12:00:00`)
    : new Date();

  const limpiarError = (field) => {
    setErrores((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const actualizarCampo = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    limpiarError(field);
  };

  const cargarProducto = useCallback(async () => {
    try {
      setCargando(true);
      const [productoData, categoriasData] = await Promise.all([
        obtenerProducto(id),
        listarCategorias(),
      ]);

      setProducto(productoData);
      setCategorias(categoriasData);

      const cantidad = productoData.cantidad_por_presentacion || 1;

      setForm({
        categoria_id:
          productoData.categoria_id ?? categoriasData[0]?.id ?? null,
        codigo_barras: productoData.codigo_barras ?? "",
        fecha_vencimiento: productoData.fecha_vencimiento ?? "",
        nombre: productoData.nombre,
        precio: String(productoData.precio),
        precio_compra: String(productoData.precio_compra ?? ""),
        presentacion_id: productoData.presentacion_id || "unidad",
        stock_minimo_presentaciones: String(
          Math.round(productoData.stock_minimo / cantidad),
        ),
        stock_presentaciones: String(Math.round(productoData.stock / cantidad)),
        tipo_medida: productoData.tipo_medida || "unidad",
      });
      setErrores({});
    } catch (error) {
      Alert.alert("Error", error.message);
      router.back();
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargarProducto();
  }, [cargarProducto]);

  const seleccionarTipoMedida = (typeId) => {
    const [firstPresentation] = getPresentationOptions(typeId);

    setForm((current) => ({
      ...current,
      presentacion_id: firstPresentation.id,
      tipo_medida: typeId,
    }));
  };

  const registrarPosicion = (field) => (event) => {
    fieldPositions.current[field] = event.nativeEvent.layout.y;
  };

  const irAlCampo = (field) => {
    const y = fieldPositions.current[field] ?? 0;

    setTimeout(() => {
      scrollRef.current?.scrollTo({
        animated: true,
        y: Math.max(y - 18, 0),
      });
    }, 80);
  };

  const seleccionarFecha = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setMostrarCalendario(false);
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    actualizarCampo("fecha_vencimiento", formatearFecha(selectedDate));
  };

  const validarFormulario = () => {
    const nextErrors = {};
    const precioValidado = Number(form.precio);
    const precioCompraValidado = Number(form.precio_compra);
    const stockValidado = Number(form.stock_presentaciones);
    const stockMinimoValidado = Number(form.stock_minimo_presentaciones);

    if (!form.nombre.trim()) {
      nextErrors.nombre = "La casilla de nombre no puede estar vacia";
    }

    if (!form.categoria_id) {
      nextErrors.categoria_id = "Selecciona una categoría";
    }

    if (!form.precio.trim()) {
      nextErrors.precio = "La casilla de precio no puede estar vacia";
    } else if (!Number.isFinite(precioValidado) || precioValidado <= 0) {
      nextErrors.precio = "El precio debe ser mayor que cero";
    }

    if (!form.precio_compra.trim()) {
      nextErrors.precio_compra =
        "La casilla de precio de compra no puede estar vacia";
    } else if (
      !Number.isFinite(precioCompraValidado) ||
      precioCompraValidado <= 0
    ) {
      nextErrors.precio_compra =
        "El precio de compra debe ser mayor que cero";
    }

    if (!form.stock_presentaciones.trim()) {
      nextErrors.stock_presentaciones = "La casilla de stock no puede estar vacia";
    } else if (!Number.isInteger(stockValidado) || stockValidado < 0) {
      nextErrors.stock_presentaciones = "El stock debe ser un numero entero";
    }

    if (!form.stock_minimo_presentaciones.trim()) {
      nextErrors.stock_minimo_presentaciones =
        "La casilla de stock minimo no puede estar vacia";
    } else if (!Number.isInteger(stockMinimoValidado) || stockMinimoValidado < 0) {
      nextErrors.stock_minimo_presentaciones =
        "El stock minimo debe ser un numero entero";
    }

    setErrores(nextErrors);

    const firstError = [
      "nombre",
      "categoria_id",
      "precio",
      "precio_compra",
      "stock_presentaciones",
      "stock_minimo_presentaciones",
    ].find((field) => nextErrors[field]);

    if (firstError) {
      irAlCampo(firstError);
      Alert.alert("Campo requerido", nextErrors[firstError]);
      return false;
    }

    return true;
  };

  const guardarCambios = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      setGuardando(true);
      await editarProducto(id, {
        categoria_id: form.categoria_id,
        codigo_barras: form.codigo_barras,
        fecha_vencimiento: form.fecha_vencimiento,
        nombre: form.nombre,
        precio: parseFloat(form.precio),
        precio_compra: parseFloat(form.precio_compra),
        presentacion_id: form.presentacion_id,
        stock_minimo_presentaciones: parseInt(
          form.stock_minimo_presentaciones,
          10,
        ),
        stock_presentaciones: parseInt(form.stock_presentaciones, 10),
        tipo_medida: form.tipo_medida,
      });

      await cargarProducto();
      setEditando(false);
      setErrores({});
      Alert.alert("Éxito", "Producto actualizado correctamente");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminacion = () => {
    Alert.alert(
      "Desactivar producto",
      "El producto pasara a Productos desactivados. Solo se pueden guardar 10 productos en ese apartado.",
      [
        { style: "cancel", text: "Cancelar" },
        {
          style: "destructive",
          text: "Desactivar",
          onPress: async () => {
            try {
              await eliminarProducto(id);
              Alert.alert("Listo", "Producto desactivado");
              router.back();
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
    );
  };

  if (cargando) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Cargando producto...
        </Text>
      </View>
    );
  }

  if (!producto) {
    return null;
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      {editando ? (
        <>
          <Text style={[styles.title, { color: colors.text }]}>
            Editar producto
          </Text>

          <TextInput
            onLayout={registrarPosicion("nombre")}
            placeholder="Nombre"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              themedInputStyle,
              errores.nombre && styles.inputError,
            ]}
            value={form.nombre}
            onChangeText={(value) => actualizarCampo("nombre", value)}
          />
          {errores.nombre ? (
            <Text style={styles.errorText}>{errores.nombre}</Text>
          ) : null}

          <TextInput
            placeholder="Codigo de barras (opcional)"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, themedInputStyle]}
            value={form.codigo_barras}
            onChangeText={(value) => actualizarCampo("codigo_barras", value)}
          />

          <Text style={[styles.label, { color: colors.text }]}>Categoría</Text>
          <View
            onLayout={registrarPosicion("categoria_id")}
            style={[
              styles.optionGrid,
              errores.categoria_id && styles.optionGridError,
            ]}
          >
            {categorias.map((categoria) => (
              <TouchableOpacity
                key={categoria.id}
                style={[
                  styles.optionButton,
                  themedOptionStyle,
                  form.categoria_id === categoria.id &&
                    styles.optionButtonActive,
                  form.categoria_id === categoria.id &&
                    themedOptionActiveStyle,
                ]}
                onPress={() => actualizarCampo("categoria_id", categoria.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.text },
                    form.categoria_id === categoria.id &&
                      styles.optionTextActive,
                    form.categoria_id === categoria.id && {
                      color: colors.success,
                    },
                  ]}
                >
                  {categoria.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errores.categoria_id ? (
            <Text style={styles.errorText}>{errores.categoria_id}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.manageCategoriesButton}
            onPress={() => router.push("/categorias")}
          >
            <Text style={[styles.manageCategoriesText, { color: colors.primary }]}>
              Gestionar categorías
            </Text>
          </TouchableOpacity>

          <TextInput
            onLayout={registrarPosicion("precio")}
            placeholder="Precio de la presentacion"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              themedInputStyle,
              errores.precio && styles.inputError,
            ]}
            keyboardType="numeric"
            value={form.precio}
            onChangeText={(value) => actualizarCampo("precio", value)}
          />
          {errores.precio ? (
            <Text style={styles.errorText}>{errores.precio}</Text>
          ) : null}

          <TextInput
            onLayout={registrarPosicion("precio_compra")}
            placeholder="Precio de compra de la presentacion"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              themedInputStyle,
              errores.precio_compra && styles.inputError,
            ]}
            keyboardType="numeric"
            value={form.precio_compra}
            onChangeText={(value) => actualizarCampo("precio_compra", value)}
          />
          {errores.precio_compra ? (
            <Text style={styles.errorText}>{errores.precio_compra}</Text>
          ) : null}

          <Text style={[styles.label, { color: colors.text }]}>
            Tipo de medida
          </Text>
          <View style={styles.segmentGroup}>
            {MEASUREMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.segmentButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  form.tipo_medida === type.id && styles.segmentButtonActive,
                  form.tipo_medida === type.id && {
                    backgroundColor: colors.primaryDark,
                    borderColor: colors.primaryDark,
                  },
                ]}
                onPress={() => seleccionarTipoMedida(type.id)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: colors.text },
                    form.tipo_medida === type.id && styles.segmentTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            {measurementType.description}
          </Text>

          <Text style={[styles.label, { color: colors.text }]}>
            Presentacion
          </Text>
          <View style={styles.optionGrid}>
            {presentationOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  themedOptionStyle,
                  form.presentacion_id === option.id &&
                    styles.optionButtonActive,
                  form.presentacion_id === option.id &&
                    themedOptionActiveStyle,
                ]}
                onPress={() => actualizarCampo("presentacion_id", option.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.text },
                    form.presentacion_id === option.id &&
                      styles.optionTextActive,
                    form.presentacion_id === option.id && {
                      color: colors.success,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View
            onLayout={(event) => {
              fieldPositions.current.stock_presentaciones =
                event.nativeEvent.layout.y;
              fieldPositions.current.stock_minimo_presentaciones =
                event.nativeEvent.layout.y;
            }}
            style={styles.row}
          >
            <TextInput
              placeholder="Stock"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                themedInputStyle,
                styles.halfInput,
                errores.stock_presentaciones && styles.inputError,
              ]}
              keyboardType="numeric"
              value={form.stock_presentaciones}
              onChangeText={(value) =>
                actualizarCampo("stock_presentaciones", value)
              }
            />

            <TextInput
              placeholder="Stock minimo"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                themedInputStyle,
                styles.halfInput,
                errores.stock_minimo_presentaciones && styles.inputError,
              ]}
              keyboardType="numeric"
              value={form.stock_minimo_presentaciones}
              onChangeText={(value) =>
                actualizarCampo("stock_minimo_presentaciones", value)
              }
            />
          </View>
          {errores.stock_presentaciones ? (
            <Text style={styles.errorText}>{errores.stock_presentaciones}</Text>
          ) : null}
          {errores.stock_minimo_presentaciones ? (
            <Text style={styles.errorText}>
              {errores.stock_minimo_presentaciones}
            </Text>
          ) : null}

          <View
            style={[
              styles.calculationBox,
              { backgroundColor: colors.cardMuted, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.calculationTitle, { color: colors.text }]}>
              Calculo de medida
            </Text>
            <Text style={[styles.calculationText, { color: colors.textMuted }]}>
              Unidad minima: {measurementType.baseLabel}
            </Text>
            <Text style={[styles.calculationText, { color: colors.textMuted }]}>
              1 {presentation.label} ={" "}
              {formatBaseQuantity(
                cantidadPorPresentacion,
                measurementType.baseLabel,
              )}
            </Text>
            <Text style={[styles.calculationText, { color: colors.textMuted }]}>
              Precio por {measurementType.baseLabel}:{" "}
              {formatCurrency(precioBase)}
            </Text>
            <Text style={[styles.calculationText, { color: colors.textMuted }]}>
              Costo por {measurementType.baseLabel}:{" "}
              {formatCurrency(precioCompraBase)}
            </Text>
            <Text style={[styles.calculationText, { color: colors.textMuted }]}>
              Ganancia por {measurementType.baseLabel}:{" "}
              {formatCurrency(gananciaBase)}
            </Text>
            <Text style={[styles.calculationText, { color: colors.textMuted }]}>
              Stock guardado:{" "}
              {formatBaseQuantity(stockBase, measurementType.baseLabel)}
            </Text>
            <Text style={[styles.calculationText, { color: colors.textMuted }]}>
              Alerta bajo stock:{" "}
              {formatBaseQuantity(stockMinimoBase, measurementType.baseLabel)}
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>
            Fecha de vencimiento
          </Text>
          <TouchableOpacity
            style={[
              styles.dateButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setMostrarCalendario(true)}
          >
            <Text
              style={[
                styles.dateText,
                { color: colors.text },
                !form.fecha_vencimiento && styles.datePlaceholder,
                !form.fecha_vencimiento && { color: colors.textMuted },
              ]}
            >
              {form.fecha_vencimiento || "Seleccionar fecha"}
            </Text>
          </TouchableOpacity>

          {form.fecha_vencimiento ? (
            <TouchableOpacity
              style={styles.clearDateButton}
              onPress={() => actualizarCampo("fecha_vencimiento", "")}
            >
              <Text style={styles.clearDateText}>Quitar fecha</Text>
            </TouchableOpacity>
          ) : null}

          {mostrarCalendario && (
            <DateTimePicker
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              value={fechaSeleccionada}
              onChange={seleccionarFecha}
            />
          )}

          <Button
            title={guardando ? "Guardando..." : "Guardar cambios"}
            onPress={guardarCambios}
            disabled={guardando}
          />
          <View style={styles.spacer} />
          <Button
            title="Cancelar"
            color="#64748B"
            onPress={() => {
              setErrores({});
              setEditando(false);
            }}
          />
        </>
      ) : (
        <>
          <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              {producto.nombre}
            </Text>
            <Text style={[styles.categoryText, { color: colors.primary }]}>
              {producto.categoria_nombre}
            </Text>
          </View>

          <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
            <DetailRow
              label="Codigo de barras"
              value={producto.codigo_barras || "Sin código"}
            />
            <DetailRow
              label="Precio por presentacion"
              value={`${formatCurrency(producto.precio)} / ${producto.presentacion_nombre}`}
            />
            <DetailRow
              label="Precio por unidad minima"
              value={`${formatCurrency(producto.precio_base)} / ${producto.unidad_base}`}
            />
            <DetailRow
              label="Costo por presentacion"
              value={`${formatCurrency(producto.precio_compra)} / ${producto.presentacion_nombre}`}
            />
            <DetailRow
              label="Costo por unidad minima"
              value={`${formatCurrency(producto.precio_compra_base)} / ${producto.unidad_base}`}
            />
            <DetailRow
              label="Stock actual"
              value={formatBaseQuantity(producto.stock, producto.unidad_base)}
            />
            <DetailRow
              label="Stock minimo"
              value={formatBaseQuantity(
                producto.stock_minimo,
                producto.unidad_base,
              )}
            />
            <DetailRow label="Tipo de medida" value={producto.tipo_medida} />
            <DetailRow
              label="Presentacion"
              value={`${producto.presentacion_nombre} (${producto.cantidad_por_presentacion} x ${producto.unidad_base})`}
            />
            <DetailRow
              label="Vencimiento"
              value={producto.fecha_vencimiento || "Sin fecha"}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.movementsButton,
              { backgroundColor: colors.card, borderColor: colors.primary },
            ]}
            onPress={() => router.push(`/inventario/movimientos/${producto.id}`)}
          >
            <Ionicons name="swap-vertical-outline" size={21} color={colors.primary} />
            <Text style={[styles.movementsButtonText, { color: colors.primary }]}>
              Movimientos
            </Text>
          </TouchableOpacity>

          <Button title="Editar producto" onPress={() => setEditando(true)} />
          <View style={styles.spacer} />
          <Button
            title="Desactivar producto"
            color="#DC2626"
            onPress={confirmarEliminacion}
          />
        </>
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value }) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  calculationBox: {
    backgroundColor: "#EEF7FF",
    borderColor: "#BFDBFE",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
    padding: 14,
  },
  calculationText: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 21,
  },
  calculationTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  categoryText: {
    color: "#003B95",
    fontSize: 15,
    fontWeight: "800",
  },
  clearDateButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
    marginTop: -4,
    paddingVertical: 4,
  },
  clearDateText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  dateButton: {
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    padding: 15,
  },
  datePlaceholder: {
    color: "#94A3B8",
  },
  dateText: {
    color: "#0F172A",
    fontSize: 16,
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 18,
    padding: 16,
  },
  detailLabel: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },
  detailRow: {
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
    paddingVertical: 11,
  },
  detailValue: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: -8,
  },
  halfInput: {
    width: "48%",
  },
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 14,
    padding: 16,
  },
  helperText: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 15,
    padding: 15,
  },
  inputError: {
    borderColor: "#DC2626",
    borderWidth: 2,
  },
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    color: "#64748B",
    marginTop: 10,
  },
  manageCategoriesButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
    marginTop: -2,
    paddingVertical: 4,
  },
  manageCategoriesText: {
    color: "#003B95",
    fontSize: 14,
    fontWeight: "700",
  },
  movementsButton: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  movementsButtonText: {
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 7,
  },
  optionButton: {
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: "48%",
  },
  optionButtonActive: {
    backgroundColor: "#EAF8EA",
    borderColor: "#0F8A45",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  optionGridError: {
    borderColor: "#DC2626",
    borderRadius: 12,
    borderWidth: 2,
    padding: 8,
  },
  optionText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  optionTextActive: {
    color: "#0F8A45",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  segmentButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    marginRight: 8,
    paddingVertical: 11,
  },
  segmentButtonActive: {
    backgroundColor: "#003B95",
    borderColor: "#003B95",
  },
  segmentGroup: {
    flexDirection: "row",
    marginBottom: 8,
  },
  segmentText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: "#fff",
  },
  spacer: {
    height: 12,
  },
  title: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
});
