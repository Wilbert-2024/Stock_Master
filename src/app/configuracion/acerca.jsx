import { Image, StyleSheet, Text, View } from "react-native";

const logoImage = require("../../../assets/images/stokmaster-logo.png");

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Image source={logoImage} style={styles.logo} />
      <Text style={styles.title}>StokMaster</Text>
      <Text style={styles.version}>Version 1.0.0</Text>
      <Text style={styles.description}>
        Aplicacion offline para gestionar inventario, ventas, alertas y
        reportes de una pulperia.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  description: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 14,
    textAlign: "center",
  },
  logo: {
    borderRadius: 32,
    height: 150,
    marginBottom: 18,
    width: 150,
  },
  title: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
  },
  version: {
    color: "#64748B",
    fontSize: 16,
    marginTop: 8,
  },
});
