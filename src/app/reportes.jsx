import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { formatCurrency } from "../constants/measurements";
import { exportarReporteVentasPdf } from "../services/reportExportService";
import { obtenerReporteVentasPeriodo } from "../services/salesService";
import { useAppTheme } from "../theme/AppThemeProvider";

const PERIODS = [
  { id: "dia", label: "Dia" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "anio", label: "Año" },
];

export default function ReportsScreen() {
  const { colors } = useAppTheme();
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [fecha, setFecha] = useState(formatDate(new Date()));
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [periodo, setPeriodo] = useState("dia");
  const [reporte, setReporte] = useState({
    productos: [],
    resumen: {
      gananciaTotal: 0,
      montoTotal: 0,
      productosVendidos: 0,
      totalVentas: 0,
    },
    ventas: [],
  });

  const fechaSeleccionada = useMemo(
    () => new Date(`${fecha}T12:00:00`),
    [fecha],
  );
  const rango = useMemo(
    () => obtenerRangoPeriodo(fechaSeleccionada, periodo),
    [fechaSeleccionada, periodo],
  );

  const cargarReporte = useCallback(async () => {
    try {
      setCargando(true);
      const data = await obtenerReporteVentasPeriodo({
        fechaFin: rango.fechaFin,
        fechaInicio: rango.fechaInicio,
      });
      setReporte(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setCargando(false);
    }
  }, [rango.fechaFin, rango.fechaInicio]);

  useFocusEffect(
    useCallback(() => {
      cargarReporte();
    }, [cargarReporte]),
  );

  const seleccionarFecha = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setMostrarCalendario(false);
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    setFecha(formatDate(selectedDate));
  };

  const exportarPdf = async () => {
    try {
      setExportando(true);
      const resultado = await exportarReporteVentasPdf({
        periodo: rango.titulo,
        rango,
        reporte,
      });

      if (!resultado) {
        return;
      }

      Alert.alert(
        "Reporte generado",
        `El reporte se guardo correctamente como ${resultado.fileName}.`,
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setExportando(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Reportes</Text>

      <View style={styles.segmented}>
        {PERIODS.map((item) => {
          const active = item.id === periodo;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.segment,
                { borderColor: colors.border },
                active && styles.segmentActive,
              ]}
              onPress={() => setPeriodo(item.id)}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: colors.textMuted },
                  active && styles.segmentTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.dateButton, { backgroundColor: colors.card }]}
        onPress={() => setMostrarCalendario(true)}
      >
        <Ionicons name="calendar-outline" size={22} color={colors.primaryDark} />
        <View style={styles.dateCopy}>
          <Text style={[styles.dateText, { color: colors.text }]}>
            {rango.titulo}
          </Text>
          <Text style={[styles.dateSubtext, { color: colors.textMuted }]}>
            {rango.subtitulo}
          </Text>
        </View>
      </TouchableOpacity>

      {mostrarCalendario && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          value={fechaSeleccionada}
          onChange={seleccionarFecha}
        />
      )}

      <TouchableOpacity
        disabled={cargando || exportando}
        style={[
          styles.exportButton,
          (cargando || exportando) && styles.exportButtonDisabled,
        ]}
        onPress={exportarPdf}
      >
        <Ionicons name="document-text-outline" size={22} color="#fff" />
        <Text style={styles.exportButtonText}>
          {exportando ? "Generando PDF..." : "Exportar PDF"}
        </Text>
      </TouchableOpacity>

      {cargando ? (
        <View style={[styles.loadingBox, { backgroundColor: colors.card }]}>
          <ActivityIndicator color="#003B95" />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Generando reporte...
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <SummaryCard label="Ventas" value={reporte.resumen.totalVentas} />
            <SummaryCard
              label="Productos"
              value={reporte.resumen.productosVendidos}
            />
          </View>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total vendido</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(reporte.resumen.montoTotal)}
            </Text>
          </View>

          <View style={styles.profitCard}>
            <Text style={styles.profitLabel}>Ganancia estimada</Text>
            <Text style={styles.profitValue}>
              {formatCurrency(reporte.resumen.gananciaTotal)}
            </Text>
          </View>

          <SectionTitle title="Productos mas vendidos" />
          {reporte.productos.length === 0 ? (
            <EmptyState text="No hay productos vendidos en este periodo." />
          ) : (
            reporte.productos.map((producto, index) => (
              <View
                key={producto.producto_id}
                style={[styles.productCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.productRank}>
                  <Text style={styles.productRankText}>{index + 1}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]}>
                    {producto.producto_nombre}
                  </Text>
                  <Text style={[styles.productMeta, { color: colors.textMuted }]}>
                    {producto.cantidad_base} x {producto.unidad_base}
                  </Text>
                </View>
                <Text style={styles.productTotal}>
                  {formatCurrency(producto.total_vendido)}
                </Text>
              </View>
            ))
          )}

          <SectionTitle title="Ventas del periodo" />
          <FlatList
            data={reporte.ventas}
            scrollEnabled={false}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <EmptyState text="No hay ventas registradas en este periodo." />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.saleCard, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/ventas/${item.id}`)}
              >
                <View style={styles.saleInfo}>
                  <Text style={[styles.saleTitle, { color: colors.text }]}>
                    Venta #{item.id}
                  </Text>
                  <Text style={[styles.saleDate, { color: colors.textMuted }]}>
                    {formatSaleDateTime(item.fecha)}
                  </Text>
                </View>
                <Text style={styles.saleTotal}>{formatCurrency(item.total)}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </ScrollView>
  );
}

function obtenerRangoPeriodo(date, periodo) {
  const base = new Date(date);
  let start = new Date(base);
  let end = new Date(base);
  let titulo = "";

  if (periodo === "semana") {
    const day = base.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start = addDays(base, diffToMonday);
    end = addDays(start, 6);
    titulo = "Semana";
  } else if (periodo === "mes") {
    start = new Date(base.getFullYear(), base.getMonth(), 1, 12);
    end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 12);
    titulo = "Mes";
  } else if (periodo === "anio") {
    start = new Date(base.getFullYear(), 0, 1, 12);
    end = new Date(base.getFullYear(), 11, 31, 12);
    titulo = "Año";
  } else {
    titulo = "Dia";
  }

  return {
    fechaFin: formatDate(end),
    fechaInicio: formatDate(start),
    subtitulo:
      formatDate(start) === formatDate(end)
        ? formatDate(start)
        : `${formatDate(start)} al ${formatDate(end)}`,
    titulo,
  };
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  copy.setHours(12, 0, 0, 0);
  return copy;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseSaleDateTime(value) {
  if (!value) {
    return null;
  }

  const rawValue = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return new Date(`${rawValue}T12:00:00`);
  }

  const isoValue = rawValue.includes("T")
    ? rawValue
    : rawValue.replace(" ", "T");
  const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(isoValue);
  const date = new Date(hasTimezone ? isoValue : `${isoValue}Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatSaleDateTime(value) {
  const date = parseSaleDateTime(value);

  if (!date) {
    return value || "Sin fecha";
  }

  return `${formatDate(date)} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function SummaryCard({ label, value }) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.summaryValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title }) {
  const { colors } = useAppTheme();

  return <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>;
}

function EmptyState({ text }) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.emptyBox, { backgroundColor: colors.card }]}>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  dateButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 16,
    padding: 14,
  },
  dateCopy: {
    flex: 1,
    marginLeft: 10,
  },
  dateSubtext: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  dateText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
  },
  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    padding: 16,
  },
  emptyText: {
    color: "#64748B",
  },
  exportButton: {
    alignItems: "center",
    backgroundColor: "#0F8A45",
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    padding: 14,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 8,
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
  productCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 10,
    padding: 14,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profitCard: {
    backgroundColor: "#0F8A45",
    borderRadius: 16,
    marginBottom: 10,
    padding: 18,
  },
  profitLabel: {
    color: "#DCFCE7",
    fontSize: 15,
    fontWeight: "800",
  },
  profitValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 6,
  },
  productMeta: {
    color: "#64748B",
    marginTop: 3,
  },
  productName: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  productRank: {
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    borderRadius: 14,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  productRankText: {
    color: "#003B95",
    fontWeight: "900",
  },
  productTotal: {
    color: "#0F8A45",
    fontSize: 15,
    fontWeight: "900",
  },
  saleCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: 14,
  },
  saleDate: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 3,
  },
  saleInfo: {
    flex: 1,
    paddingRight: 12,
  },
  saleTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  saleTotal: {
    color: "#0F8A45",
    fontSize: 17,
    fontWeight: "900",
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
    marginTop: 12,
  },
  segment: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  segmentActive: {
    backgroundColor: "#003B95",
    borderColor: "#003B95",
  },
  segmentText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  segmentTextActive: {
    color: "#fff",
  },
  segmented: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    flex: 1,
    marginRight: 10,
    padding: 16,
  },
  summaryLabel: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  summaryValue: {
    color: "#003B95",
    fontSize: 24,
    fontWeight: "900",
  },
  title: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 18,
  },
  totalCard: {
    backgroundColor: "#003B95",
    borderRadius: 16,
    marginBottom: 10,
    padding: 18,
  },
  totalLabel: {
    color: "#DBEAFE",
    fontSize: 15,
    fontWeight: "800",
  },
  totalValue: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 6,
  },
});
