import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { crearProducto } from "../../services/productService";
import { listarCategorias } from "../../services/categoryService";
import {
  MEASUREMENT_TYPES,
  formatBaseQuantity,
  formatCurrency,
  getMeasurementType,
  getPresentation,
  getPresentationOptions,
} from "../../constants/measurements";
import { useAppTheme } from "../../theme/AppThemeProvider";

export default function RegistrarProductoScreen() {
  const { colors } = useAppTheme();
  const { codigo_barras } = useLocalSearchParams();
  const scrollRef = useRef(null);
  const fieldPositions = useRef({});
  const [nombre, setNombre] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState(null);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [precio, setPrecio] = useState("");
  const [precioCompra, setPrecioCompra] = useState("");
  const [stock, setStock] = useState("");
  const [stockMinimo, setStockMinimo] = useState("1");
  const [tipoMedida, setTipoMedida] = useState("unidad");
  const [presentacionId, setPresentacionId] = useState("unidad");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [errores, setErrores] = useState({});

  const measurementType = getMeasurementType(tipoMedida);
  const presentationOptions = getPresentationOptions(tipoMedida);
  const presentation = getPresentation(tipoMedida, presentacionId);
  const precioNumber = Number(precio);
  const precioCompraNumber = Number(precioCompra);
  const stockNumber = Number(stock);
  const stockMinimoNumber = Number(stockMinimo);
  const cantidadPorPresentacion = presentation?.baseUnits ?? 1;
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
  const themedMutedText = { color: colors.textMuted };

  const cargarCategorias = useCallback(async () => {
    try {
      setCargandoCategorias(true);
      const data = await listarCategorias();
      setCategorias(data);

      setCategoriaId((current) => {
        if (data.length === 0) {
          return null;
        }

        const currentStillExists = data.some(
          (categoria) => Number(categoria.id) === Number(current),
        );

        if (current && currentStillExists) {
          return current;
        }

        return data[data.length - 1].id;
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setCargandoCategorias(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarCategorias();
    }, [cargarCategorias]),
  );

  useEffect(() => {
    if (codigo_barras) {
      setCodigoBarras(String(codigo_barras));
    }
  }, [codigo_barras]);

  const formatearFecha = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const fechaSeleccionada = fechaVencimiento
    ? new Date(`${fechaVencimiento}T12:00:00`)
    : new Date();

  const seleccionarFecha = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setMostrarCalendario(false);
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    setFechaVencimiento(formatearFecha(selectedDate));
  };

  const seleccionarTipoMedida = (typeId) => {
    const [firstPresentation] = getPresentationOptions(typeId);

    setTipoMedida(typeId);
    setPresentacionId(firstPresentation.id);
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

  const validarFormulario = () => {
    const nextErrors = {};
    const precioValidado = Number(precio);
    const precioCompraValidado = Number(precioCompra);
    const stockValidado = Number(stock);
    const stockMinimoValidado = Number(stockMinimo);

    if (!nombre.trim()) {
      nextErrors.nombre = "La casilla de nombre no puede estar vacia";
    }

    if (!categoriaId) {
      nextErrors.categoria = "Selecciona una categoria";
    }

    if (!precio.trim()) {
      nextErrors.precio = "La casilla de precio no puede estar vacia";
    } else if (!Number.isFinite(precioValidado) || precioValidado <= 0) {
      nextErrors.precio = "El precio debe ser mayor que cero";
    }

    if (!precioCompra.trim()) {
      nextErrors.precioCompra =
        "La casilla de precio de compra no puede estar vacia";
    } else if (
      !Number.isFinite(precioCompraValidado) ||
      precioCompraValidado <= 0
    ) {
      nextErrors.precioCompra = "El precio de compra debe ser mayor que cero";
    }

    if (!stock.trim()) {
      nextErrors.stock = "La casilla de stock inicial no puede estar vacia";
    } else if (!Number.isInteger(stockValidado) || stockValidado < 0) {
      nextErrors.stock = "El stock inicial debe ser un numero entero";
    }

    if (!stockMinimo.trim()) {
      nextErrors.stockMinimo = "La casilla de stock minimo no puede estar vacia";
    } else if (!Number.isInteger(stockMinimoValidado) || stockMinimoValidado < 0) {
      nextErrors.stockMinimo = "El stock minimo debe ser un numero entero";
    }

    setErrores(nextErrors);

    const firstError = [
      "nombre",
      "categoria",
      "precio",
      "precioCompra",
      "stock",
      "stockMinimo",
    ].find((field) => nextErrors[field]);

    if (firstError) {
      irAlCampo(firstError);
      Alert.alert("Campo requerido", nextErrors[firstError]);
      return false;
    }

    return true;
  };

  const guardarProducto = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      await crearProducto({
        categoria_id: categoriaId,
        codigo_barras: codigoBarras,
        fecha_vencimiento: fechaVencimiento,
        nombre,
        precio: parseFloat(precio),
        precio_compra: parseFloat(precioCompra),
        presentacion_id: presentacionId,
        stock_minimo_presentaciones: parseInt(stockMinimo, 10),
        stock_presentaciones: parseInt(stock, 10),
        tipo_medida: tipoMedida,
      });

      Alert.alert("Exito", "Producto guardado correctamente");
      router.back();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: colors.text }]}>Registrar Producto</Text>

      <TextInput
        onLayout={registrarPosicion("nombre")}
        placeholder="Nombre"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, themedInputStyle, errores.nombre && styles.inputError]}
        value={nombre}
        onChangeText={(value) => {
          setNombre(value);
          limpiarError("nombre");
        }}
      />
      {errores.nombre ? <Text style={styles.errorText}>{errores.nombre}</Text> : null}

      <TextInput
        placeholder="Codigo de barras (opcional)"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, themedInputStyle]}
        value={codigoBarras}
        onChangeText={setCodigoBarras}
      />

      <Text style={[styles.label, { color: colors.text }]}>Categoria</Text>
      {cargandoCategorias ? (
        <View
          style={[
            styles.categoryLoading,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ActivityIndicator color="#003B95" />
          <Text style={[styles.categoryLoadingText, themedMutedText]}>
            Cargando categorias...
          </Text>
        </View>
      ) : (
        <View
          onLayout={registrarPosicion("categoria")}
          style={[styles.optionGrid, errores.categoria && styles.optionGridError]}
        >
          {categorias.map((categoria) => (
            <TouchableOpacity
              key={categoria.id}
              style={[
                styles.optionButton,
                themedOptionStyle,
                categoriaId === categoria.id && styles.optionButtonActive,
                categoriaId === categoria.id && themedOptionActiveStyle,
              ]}
              onPress={() => {
                setCategoriaId(categoria.id);
                limpiarError("categoria");
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: colors.text },
                  categoriaId === categoria.id && styles.optionTextActive,
                  categoriaId === categoria.id && { color: colors.success },
                ]}
              >
                {categoria.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {errores.categoria ? (
        <Text style={styles.errorText}>{errores.categoria}</Text>
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
        placeholderTextColor={colors.textMuted}
        style={[styles.input, themedInputStyle, errores.precio && styles.inputError]}
        keyboardType="numeric"
        value={precio}
        onChangeText={(value) => {
          setPrecio(value);
          limpiarError("precio");
        }}
      />
      {errores.precio ? <Text style={styles.errorText}>{errores.precio}</Text> : null}

      <TextInput
        onLayout={registrarPosicion("precioCompra")}
        placeholder="Precio de compra de la presentacion"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          themedInputStyle,
          errores.precioCompra && styles.inputError,
        ]}
        keyboardType="numeric"
        value={precioCompra}
        onChangeText={(value) => {
          setPrecioCompra(value);
          limpiarError("precioCompra");
        }}
      />
      {errores.precioCompra ? (
        <Text style={styles.errorText}>{errores.precioCompra}</Text>
      ) : null}

      <Text style={[styles.label, { color: colors.text }]}>Tipo de medida</Text>
      <View style={styles.segmentGroup}>
        {MEASUREMENT_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.segmentButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              tipoMedida === type.id && styles.segmentButtonActive,
            ]}
            onPress={() => seleccionarTipoMedida(type.id)}
          >
            <Text
              style={[
                styles.segmentText,
                { color: colors.text },
                tipoMedida === type.id && styles.segmentTextActive,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.helperText, themedMutedText]}>
        {measurementType.description}
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>Presentacion</Text>
      <View style={styles.optionGrid}>
        {presentationOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionButton,
              themedOptionStyle,
              presentacionId === option.id && styles.optionButtonActive,
              presentacionId === option.id && themedOptionActiveStyle,
            ]}
            onPress={() => setPresentacionId(option.id)}
          >
            <Text
              style={[
                styles.optionText,
                { color: colors.text },
                presentacionId === option.id && styles.optionTextActive,
                presentacionId === option.id && { color: colors.success },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View
        onLayout={(event) => {
          fieldPositions.current.stock = event.nativeEvent.layout.y;
          fieldPositions.current.stockMinimo = event.nativeEvent.layout.y;
        }}
        style={styles.row}
      >
        <TextInput
          placeholder="Stock inicial"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            themedInputStyle,
            styles.halfInput,
            errores.stock && styles.inputError,
          ]}
          keyboardType="numeric"
          value={stock}
          onChangeText={(value) => {
            setStock(value);
            limpiarError("stock");
          }}
        />

        <TextInput
          placeholder="Stock minimo"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            themedInputStyle,
            styles.halfInput,
            errores.stockMinimo && styles.inputError,
          ]}
          keyboardType="numeric"
          value={stockMinimo}
          onChangeText={(value) => {
            setStockMinimo(value);
            limpiarError("stockMinimo");
          }}
        />
      </View>
      {errores.stock ? <Text style={styles.errorText}>{errores.stock}</Text> : null}
      {errores.stockMinimo ? (
        <Text style={styles.errorText}>{errores.stockMinimo}</Text>
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
          {formatBaseQuantity(cantidadPorPresentacion, measurementType.baseLabel)}
        </Text>
        <Text style={[styles.calculationText, { color: colors.textMuted }]}>
          Precio por {measurementType.baseLabel}: {formatCurrency(precioBase)}
        </Text>
        <Text style={[styles.calculationText, { color: colors.textMuted }]}>
          Costo por {measurementType.baseLabel}: {formatCurrency(precioCompraBase)}
        </Text>
        <Text style={[styles.calculationText, { color: colors.textMuted }]}>
          Ganancia por {measurementType.baseLabel}: {formatCurrency(gananciaBase)}
        </Text>
        <Text style={[styles.calculationText, { color: colors.textMuted }]}>
          Stock guardado: {formatBaseQuantity(stockBase, measurementType.baseLabel)}
        </Text>
        <Text style={[styles.calculationText, { color: colors.textMuted }]}>
          Alerta bajo stock:{" "}
          {formatBaseQuantity(stockMinimoBase, measurementType.baseLabel)}
        </Text>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Fecha de vencimiento</Text>
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
            !fechaVencimiento && styles.datePlaceholder,
            !fechaVencimiento && { color: colors.textMuted },
          ]}
        >
          {fechaVencimiento || "Seleccionar fecha"}
        </Text>
      </TouchableOpacity>

      {fechaVencimiento ? (
        <TouchableOpacity
          style={styles.clearDateButton}
          onPress={() => setFechaVencimiento("")}
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

      <Button title="Guardar Producto" onPress={guardarProducto} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
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
  categoryLoading: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    padding: 13,
  },
  categoryLoadingText: {
    color: "#64748B",
    marginLeft: 10,
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
  halfInput: {
    width: "48%",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: -8,
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
