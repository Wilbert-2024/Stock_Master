import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAppTheme } from "../../theme/AppThemeProvider";

const logoImage = require("../../../assets/images/stokmaster-logo.png");

const options = [
  {
    color: "#003B95",
    icon: "scale-outline",
    route: "/configuracion/unidades",
    subtitle: "Unidad, volumen y peso",
    title: "Unidades de medida",
  },
  {
    color: "#B45309",
    icon: "archive-outline",
    route: "/inventario/desactivados",
    subtitle: "Reactivar o borrar productos",
    title: "Productos desactivados",
  },
  {
    color: "#0F8A45",
    icon: "cloud-upload-outline",
    route: "/configuracion/respaldo",
    subtitle: "Crear o restaurar una copia",
    title: "Respaldo de datos",
  },
  {
    color: "#7C3AED",
    icon: "help-circle-outline",
    route: "/configuracion/ayuda",
    subtitle: "Guia rapida de uso",
    title: "Ayuda",
  },
  {
    color: "#0284C7",
    icon: "information-circle-outline",
    route: "/configuracion/acerca",
    subtitle: "Version y detalles",
    title: "Acerca de la app",
  },
];

export default function SettingsScreen() {
  const { colors } = useAppTheme();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
        <Image source={logoImage} style={styles.logo} />
        <View style={styles.headerTextBox}>
          <Text style={[styles.title, { color: colors.text }]}>
            Configuración
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Ajustes y herramientas para mantener la aplicación ordenada.
          </Text>
        </View>
      </View>

      {options.map((option) => (
        <TouchableOpacity
          key={option.route}
          style={[styles.optionCard, { backgroundColor: colors.card }]}
          onPress={() => router.push(option.route)}
        >
          <View style={[styles.iconBox, { backgroundColor: `${option.color}1A` }]}>
            <Ionicons name={option.icon} size={27} color={option.color} />
          </View>

          <View style={styles.optionTextBox}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>
              {option.title}
            </Text>
            <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>
              {option.subtitle}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  headerCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    flexDirection: "row",
    marginBottom: 18,
    padding: 16,
  },
  headerTextBox: {
    flex: 1,
    marginLeft: 14,
  },
  iconBox: {
    alignItems: "center",
    borderRadius: 14,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  logo: {
    borderRadius: 18,
    height: 70,
    width: 70,
  },
  optionCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 12,
    padding: 14,
  },
  optionSubtitle: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  optionTextBox: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "900",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  title: {
    color: "#0F172A",
    fontSize: 26,
    fontWeight: "900",
  },
});
