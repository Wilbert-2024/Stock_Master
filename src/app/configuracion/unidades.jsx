import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  MEASUREMENT_TYPES,
  PRESENTATION_OPTIONS,
  formatCurrency,
} from "../../constants/measurements";

const DETAILS = {
  peso: {
    color: "#B45309",
    examples: "Arroz, azucar, frijoles, queso",
    icon: "scale-outline",
    sample: {
      base: "1/2 libra",
      baseUnits: 2,
      presentation: "1 libra",
      price: 40,
    },
  },
  unidad: {
    color: "#003B95",
    examples: "Huevos, panes, jabones, sobres",
    icon: "cube-outline",
    sample: {
      base: "unidad",
      baseUnits: 24,
      presentation: "caja de 24",
      price: 240,
    },
  },
  volumen: {
    color: "#0F8A45",
    examples: "Aceite, leche, refresco, cloro",
    icon: "water-outline",
    sample: {
      base: "1/2 litro",
      baseUnits: 2,
      presentation: "1 litro",
      price: 90,
    },
  },
};

export default function UnitsScreen() {
  const [tipoSeleccionado, setTipoSeleccionado] = useState("unidad");
  const tipo = useMemo(
    () =>
      MEASUREMENT_TYPES.find((item) => item.id === tipoSeleccionado) ??
      MEASUREMENT_TYPES[0],
    [tipoSeleccionado],
  );
  const detalle = DETAILS[tipo.id];
  const presentaciones = PRESENTATION_OPTIONS[tipo.id] ?? [];
  const precioBase = detalle.sample.price / detalle.sample.baseUnits;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Unidades de medida</Text>

      <View style={styles.segmented}>
        {MEASUREMENT_TYPES.map((item) => {
          const active = item.id === tipoSeleccionado;
          const itemDetail = DETAILS[item.id];

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => setTipoSeleccionado(item.id)}
            >
              <Ionicons
                name={itemDetail.icon}
                size={20}
                color={active ? "#fff" : itemDetail.color}
              />
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.headerCard}>
        <View style={[styles.iconBox, { backgroundColor: `${detalle.color}1A` }]}>
          <Ionicons name={detalle.icon} size={30} color={detalle.color} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.typeTitle}>{tipo.label}</Text>
          <Text style={styles.typeDescription}>{tipo.description}</Text>
          <Text style={styles.examples}>{detalle.examples}</Text>
        </View>
      </View>

      <View style={styles.baseBand}>
        <Text style={styles.baseLabel}>Unidad minima de venta</Text>
        <Text style={styles.baseValue}>{tipo.baseLabel}</Text>
      </View>

      <Text style={styles.sectionTitle}>Presentaciones permitidas</Text>
      {presentaciones.map((presentation) => (
        <View key={presentation.id} style={styles.presentationCard}>
          <View style={styles.presentationLeft}>
            <Text style={styles.presentationTitle}>{presentation.label}</Text>
            <Text style={styles.presentationMeta}>
              Equivale a {presentation.baseUnits} x {tipo.baseLabel}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>x{presentation.baseUnits}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Ejemplo de precio</Text>
      <View style={styles.exampleCard}>
        <View style={styles.exampleRow}>
          <Text style={styles.exampleLabel}>Presentacion</Text>
          <Text style={styles.exampleValue}>{detalle.sample.presentation}</Text>
        </View>
        <View style={styles.exampleRow}>
          <Text style={styles.exampleLabel}>Precio registrado</Text>
          <Text style={styles.exampleValue}>
            {formatCurrency(detalle.sample.price)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.exampleRow}>
          <Text style={styles.exampleResultLabel}>
            Precio por {detalle.sample.base}
          </Text>
          <Text style={styles.exampleResult}>{formatCurrency(precioBase)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    borderRadius: 12,
    justifyContent: "center",
    minWidth: 52,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  badgeText: {
    color: "#0369A1",
    fontSize: 14,
    fontWeight: "900",
  },
  baseBand: {
    backgroundColor: "#003B95",
    borderRadius: 16,
    marginBottom: 18,
    padding: 18,
  },
  baseLabel: {
    color: "#DBEAFE",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  baseValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 5,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  divider: {
    backgroundColor: "#E2E8F0",
    height: 1,
    marginVertical: 12,
  },
  exampleCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  exampleLabel: {
    color: "#64748B",
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  exampleResult: {
    color: "#0F8A45",
    fontSize: 20,
    fontWeight: "900",
  },
  exampleResultLabel: {
    color: "#0F172A",
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
  },
  exampleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  exampleValue: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  examples: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
  },
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    flexDirection: "row",
    marginBottom: 14,
    padding: 16,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  iconBox: {
    alignItems: "center",
    borderRadius: 16,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  presentationCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: 14,
  },
  presentationLeft: {
    flex: 1,
    paddingRight: 12,
  },
  presentationMeta: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  presentationTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
    marginTop: 4,
  },
  segment: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 8,
  },
  segmentActive: {
    backgroundColor: "#003B95",
    borderColor: "#003B95",
  },
  segmentText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 6,
  },
  segmentTextActive: {
    color: "#fff",
  },
  segmented: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  title: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 18,
  },
  typeDescription: {
    color: "#64748B",
    lineHeight: 20,
    marginTop: 4,
  },
  typeTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
  },
});
