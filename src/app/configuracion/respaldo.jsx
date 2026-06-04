import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { crearRespaldo, restaurarRespaldo } from "../../services/backupService";

export default function BackupScreen() {
  const [cargando, setCargando] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState(null);

  const manejarCrearRespaldo = async () => {
    try {
      setCargando(true);
      const resultado = await crearRespaldo();

      if (!resultado) {
        return;
      }

      setUltimoResultado({
        tipo: "respaldo",
        titulo: "Respaldo generado",
        archivo: resultado.fileName,
        resumen: resultado.resumen,
      });
      Alert.alert(
        "Respaldo generado",
        "El archivo se guardo correctamente en la carpeta seleccionada.",
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setCargando(false);
    }
  };

  const confirmarRestauracion = () => {
    Alert.alert(
      "Restaurar respaldo",
      "Esto reemplazara los productos, categorias y ventas actuales por los datos del archivo seleccionado.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "destructive",
          onPress: manejarRestaurarRespaldo,
        },
      ],
    );
  };

  const manejarRestaurarRespaldo = async () => {
    try {
      setCargando(true);
      const resultado = await restaurarRespaldo();

      if (!resultado) {
        return;
      }

      setUltimoResultado({
        tipo: "restauracion",
        titulo: "Respaldo restaurado",
        archivo: resultado.fileName,
        resumen: resultado.resumen,
      });
      Alert.alert(
        "Datos restaurados",
        "El respaldo se cargo correctamente en la base de datos local.",
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Respaldo de datos</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons name="cloud-offline-outline" size={28} color="#003B95" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Tus datos siguen en el telefono</Text>
          <Text style={styles.infoText}>
            Crea un respaldo para guardar una copia de productos, categorias y
            ventas. Luego puedes restaurarlo si cambias de telefono o borras la
            app.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        disabled={cargando}
        style={[styles.actionButton, styles.primaryButton, cargando && styles.disabled]}
        onPress={manejarCrearRespaldo}
      >
        <Ionicons name="download-outline" size={24} color="#fff" />
        <View style={styles.buttonTextBox}>
          <Text style={styles.primaryButtonText}>Crear respaldo</Text>
          <Text style={styles.primaryButtonSubtext}>Guardar archivo JSON</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        disabled={cargando}
        style={[styles.actionButton, cargando && styles.disabled]}
        onPress={confirmarRestauracion}
      >
        <Ionicons name="cloud-upload-outline" size={24} color="#003B95" />
        <View style={styles.buttonTextBox}>
          <Text style={styles.secondaryButtonText}>Restaurar respaldo</Text>
          <Text style={styles.secondaryButtonSubtext}>
            Seleccionar archivo guardado
          </Text>
        </View>
      </TouchableOpacity>

      {cargando && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#003B95" />
          <Text style={styles.loadingText}>Procesando datos...</Text>
        </View>
      )}

      {ultimoResultado && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{ultimoResultado.titulo}</Text>
          <Text style={styles.fileName}>{ultimoResultado.archivo}</Text>
          <View style={styles.summaryGrid}>
            <SummaryItem label="Categorias" value={ultimoResultado.resumen.categorias} />
            <SummaryItem label="Productos" value={ultimoResultado.resumen.productos} />
            <SummaryItem label="Ventas" value={ultimoResultado.resumen.ventas} />
            <SummaryItem
              label="Detalles"
              value={ultimoResultado.resumen.detalleVentas}
            />
          </View>
        </View>
      )}

      <View style={styles.warningCard}>
        <Ionicons name="warning-outline" size={22} color="#B45309" />
        <Text style={styles.warningText}>
          Al restaurar, la informacion actual se reemplaza por completo. Haz un
          respaldo nuevo antes de probar otro archivo.
        </Text>
      </View>
    </ScrollView>
  );
}

function SummaryItem({ label, value }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 12,
    padding: 16,
  },
  buttonTextBox: {
    flex: 1,
    marginLeft: 12,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  disabled: {
    opacity: 0.65,
  },
  fileName: {
    color: "#64748B",
    fontSize: 13,
    marginBottom: 12,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    flexDirection: "row",
    marginBottom: 16,
    padding: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoIcon: {
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  infoText: {
    color: "#64748B",
    lineHeight: 20,
    marginTop: 6,
  },
  infoTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  loadingBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    marginTop: 4,
    padding: 16,
  },
  loadingText: {
    color: "#64748B",
    marginLeft: 10,
  },
  primaryButton: {
    backgroundColor: "#0F8A45",
  },
  primaryButtonSubtext: {
    color: "#DCFCE7",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 14,
    padding: 16,
  },
  resultTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },
  secondaryButtonSubtext: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  secondaryButtonText: {
    color: "#003B95",
    fontSize: 17,
    fontWeight: "800",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  summaryItem: {
    backgroundColor: "#F4F7FB",
    borderRadius: 12,
    margin: 4,
    padding: 12,
    width: "47%",
  },
  summaryLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  summaryValue: {
    color: "#003B95",
    fontSize: 22,
    fontWeight: "900",
  },
  title: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 18,
  },
  warningCard: {
    alignItems: "flex-start",
    backgroundColor: "#FEF3C7",
    borderRadius: 14,
    flexDirection: "row",
    marginTop: 14,
    padding: 14,
  },
  warningText: {
    color: "#78350F",
    flex: 1,
    lineHeight: 19,
    marginLeft: 10,
  },
});
