import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAppTheme } from "../../theme/AppThemeProvider";

const guides = [
  {
    color: "#003B95",
    icon: "cube-outline",
    steps: [
      "Entra a Inventario y toca Agregar producto.",
      "Selecciona categoría, medida, presentación, precio y existencias.",
      "Guarda el producto para que aparezca activo en inventario.",
    ],
    title: "Registrar productos",
  },
  {
    color: "#0F8A45",
    icon: "barcode-outline",
    steps: [
      "Usa Escanear para leer el código de barras.",
      "Si existe, la app abre el producto o lo agrega a la venta.",
      "Si no existe, puedes registrarlo con el código ya cargado.",
    ],
    title: "Codigos de barras",
  },
  {
    color: "#B45309",
    icon: "scale-outline",
    steps: [
      "Unidad sirve para productos contables como huevos o panes.",
      "Volumen usa 1/2 litro como minimo de venta.",
      "Peso usa 1/2 libra como minimo de venta.",
    ],
    title: "Medidas y precios",
  },
  {
    color: "#0284C7",
    icon: "cart-outline",
    steps: [
      "En Ventas toca Nueva venta.",
      "Agrega productos manualmente o con el escaner.",
      "Selecciona el método de pago y guarda para descontar existencias.",
    ],
    title: "Registrar ventas",
  },
  {
    color: "#DC2626",
    icon: "notifications-outline",
    steps: [
      "Bajo stock aparece cuando el producto llega a su minimo.",
      "Vence pronto muestra productos con fecha cercana.",
      "Toca una alerta para revisar el detalle del producto.",
    ],
    title: "Alertas",
  },
  {
    color: "#7C3AED",
    icon: "cloud-upload-outline",
    steps: [
      "En Configuración entra a Respaldo de datos.",
      "Crea un respaldo y guardalo fuera del telefono.",
      "Restaura solo archivos generados por StokMaster.",
    ],
    title: "Respaldos",
  },
];

export default function HelpScreen() {
  const { colors } = useAppTheme();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Ayuda</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Guía rápida para usar las funciones principales de StokMaster.
      </Text>

      {guides.map((guide) => (
        <View
          key={guide.title}
          style={[styles.guideCard, { backgroundColor: colors.card }]}
        >
          <View style={styles.guideHeader}>
            <View style={[styles.iconBox, { backgroundColor: `${guide.color}1A` }]}>
              <Ionicons name={guide.icon} size={26} color={guide.color} />
            </View>
            <Text style={[styles.guideTitle, { color: colors.text }]}>
              {guide.title}
            </Text>
          </View>

          {guide.steps.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: colors.border }]}>
                <Text style={[styles.stepNumberText, { color: colors.text }]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textMuted }]}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  guideCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 14,
    padding: 16,
  },
  guideHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 12,
  },
  guideTitle: {
    color: "#0F172A",
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    marginLeft: 12,
  },
  iconBox: {
    alignItems: "center",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  stepNumber: {
    alignItems: "center",
    backgroundColor: "#E2E8F0",
    borderRadius: 11,
    height: 22,
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1,
    width: 22,
  },
  stepNumberText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
  },
  stepRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginTop: 8,
  },
  stepText: {
    color: "#475569",
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  subtitle: {
    color: "#64748B",
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 18,
  },
  title: {
    color: "#0F172A",
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 6,
  },
});
