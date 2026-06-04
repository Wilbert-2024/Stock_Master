import DateTimePicker from "@react-native-community/datetimepicker";
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

export default function ProductDetailScreen() {
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
  const stockNumber = Number(form.stock_presentaciones);
  const stockMinimoNumber = Number(form.stock_minimo_presentaciones);
  const precioBase =
    Number.isFinite(precioNumber) && precioNumber > 0
      ? precioNumber / cantidadPorPresentacion
      : 0;
  const stockBase =
    Number.isInteger(stockNumber) && stockNumber >= 0
      ? stockNumber * cantidadPorPresentacion
      : 0;
  const stockMinimoBase =
    Number.isInteger(stockMinimoNumber) && stockMinimoNumber >= 0
      ? stockMinimoNumber * cantidadPorPresentacion
      : 0;

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
    const stockValidado = Number(form.stock_presentaciones);
    const stockMinimoValidado = Number(form.stock_minimo_presentaciones);

    if (!form.nombre.trim()) {
      nextErrors.nombre = "La casilla de nombre no puede estar vacia";
    }

    if (!form.categoria_id) {
      nextErrors.categoria_id = "Selecciona una categoria";
    }

    if (!form.precio.trim()) {
      nextErrors.precio = "La casilla de precio no puede estar vacia";
    } else if (!Number.isFinite(precioValidado) || precioValidado <= 0) {
      nextErrors.precio = "El precio debe ser mayor que cero";
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
      Alert.alert("Exito", "Producto actualizado correctamente");
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#003B95" />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );
  }

  if (!producto) {
    return null;
  }

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
      {editando ? (
        <>
          <Text style={styles.title}>Editar producto</Text>

          <TextInput
            onLayout={registrarPosicion("nombre")}
            placeholder="Nombre"
            style={[styles.input, errores.nombre && styles.inputError]}
            value={form.nombre}
            onChangeText={(value) => actualizarCampo("nombre", value)}
          />
          {errores.nombre ? (
            <Text style={styles.errorText}>{errores.nombre}</Text>
          ) : null}

          <TextInput
            placeholder="Codigo de barras (opcional)"
            style={styles.input}
            value={form.codigo_barras}
            onChangeText={(value) => actualizarCampo("codigo_barras", value)}
          />

          <Text style={styles.label}>Categoria</Text>
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
                  form.categoria_id === categoria.id &&
                    styles.optionButtonActive,
                ]}
                onPress={() => actualizarCampo("categoria_id", categoria.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    form.categoria_id === categoria.id &&
                      styles.optionTextActive,
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
            <Text style={styles.manageCategoriesText}>Gestionar categorias</Text>
          </TouchableOpacity>

          <TextInput
            onLayout={registrarPosicion("precio")}
            placeholder="Precio de la presentacion"
            style={[styles.input, errores.precio && styles.inputError]}
            keyboardType="numeric"
            value={form.precio}
            onChangeText={(value) => actualizarCampo("precio", value)}
          />
          {errores.precio ? (
            <Text style={styles.errorText}>{errores.precio}</Text>
          ) : null}

          <Text style={styles.label}>Tipo de medida</Text>
          <View style={styles.segmentGroup}>
            {MEASUREMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.segmentButton,
                  form.tipo_medida === type.id && styles.segmentButtonActive,
                ]}
                onPress={() => seleccionarTipoMedida(type.id)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    form.tipo_medida === type.id && styles.segmentTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.helperText}>{measurementType.description}</Text>

          <Text style={styles.label}>Presentacion</Text>
          <View style={styles.optionGrid}>
            {presentationOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  form.presentacion_id === option.id &&
                    styles.optionButtonActive,
                ]}
                onPress={() => actualizarCampo("presentacion_id", option.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    form.presentacion_id === option.id &&
                      styles.optionTextActive,
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
              style={[
                styles.input,
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
              style={[
                styles.input,
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

          <View style={styles.calculationBox}>
            <Text style={styles.calculationTitle}>Calculo de medida</Text>
            <Text style={styles.calculationText}>
              Unidad minima: {measurementType.baseLabel}
            </Text>
            <Text style={styles.calculationText}>
              1 {presentation.label} ={" "}
              {formatBaseQuantity(
                cantidadPorPresentacion,
                measurementType.baseLabel,
              )}
            </Text>
            <Text style={styles.calculationText}>
              Precio por {measurementType.baseLabel}:{" "}
              {formatCurrency(precioBase)}
            </Text>
            <Text style={styles.calculationText}>
              Stock guardado:{" "}
              {formatBaseQuantity(stockBase, measurementType.baseLabel)}
            </Text>
            <Text style={styles.calculationText}>
              Alerta bajo stock:{" "}
              {formatBaseQuantity(stockMinimoBase, measurementType.baseLabel)}
            </Text>
          </View>

          <Text style={styles.label}>Fecha de vencimiento</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setMostrarCalendario(true)}
          >
            <Text
              style={[
                styles.dateText,
                !form.fecha_vencimiento && styles.datePlaceholder,
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
          <View style={styles.headerCard}>
            <Text style={styles.title}>{producto.nombre}</Text>
            <Text style={styles.categoryText}>{producto.categoria_nombre}</Text>
          </View>

          <View style={styles.detailCard}>
            <DetailRow
              label="Codigo de barras"
              value={producto.codigo_barras || "Sin codigo"}
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
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
