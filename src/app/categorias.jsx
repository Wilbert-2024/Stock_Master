import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import {
  crearCategoria,
  eliminarCategoria,
  listarCategorias,
} from "../services/categoryService";
import { useAppTheme } from "../theme/AppThemeProvider";

export default function CategoriesScreen() {
  const { colors } = useAppTheme();
  const [categorias, setCategorias] = useState([]);
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(true);
  const [eliminandoId, setEliminandoId] = useState(null);

  const cargarCategorias = useCallback(async () => {
    try {
      setCargando(true);
      const data = await listarCategorias();
      setCategorias(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarCategorias();
    }, [cargarCategorias]),
  );

  const guardarCategoria = async () => {
    try {
      setGuardando(true);
      await crearCategoria({ descripcion, nombre });
      setNombre("");
      setDescripcion("");
      await cargarCategorias();
      Alert.alert("Exito", "Categoria guardada correctamente");
    } catch (error) {
      const message =
        error.message?.includes("UNIQUE") || error.message?.includes("unique")
          ? "Ya existe una categoria con ese nombre"
          : error.message;

      Alert.alert("Error", message);
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminarCategoria = (categoria) => {
    const totalAsignados = Number(
      categoria.total_productos_asignados ?? categoria.total_productos ?? 0,
    );

    if (totalAsignados > 0) {
      Alert.alert(
        "Categoria con productos",
        "No se puede eliminar porque tiene productos asignados. Primero cambia esos productos a otra categoria o eliminalos definitivamente.",
      );
      return;
    }

    Alert.alert(
      "Eliminar categoria",
      `Quieres eliminar "${categoria.nombre}"? Esta accion no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              setEliminandoId(categoria.id);
              await eliminarCategoria(categoria.id);
              await cargarCategorias();
              Alert.alert("Listo", "Categoria eliminada correctamente");
            } catch (error) {
              Alert.alert("Error", error.message);
            } finally {
              setEliminandoId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Categorias</Text>

      <View style={[styles.form, { backgroundColor: colors.card }]}>
        <TextInput
          placeholder="Nombre de la categoria"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text },
          ]}
          value={nombre}
          onChangeText={setNombre}
        />

        <TextInput
          placeholder="Descripcion (opcional)"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text },
          ]}
          value={descripcion}
          onChangeText={setDescripcion}
        />

        <TouchableOpacity
          disabled={guardando}
          style={[styles.saveButton, guardando && styles.saveButtonDisabled]}
          onPress={guardarCategoria}
        >
          <Ionicons name="add-circle-outline" size={22} color="#fff" />
          <Text style={styles.saveButtonText}>
            {guardando ? "Guardando..." : "Agregar categoria"}
          </Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={[styles.loadingBox, { backgroundColor: colors.card }]}>
          <ActivityIndicator color="#003B95" />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Cargando categorias...
          </Text>
        </View>
      ) : (
        <FlatList
          data={categorias}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const totalAsignados = Number(
              item.total_productos_asignados ?? item.total_productos ?? 0,
            );
            const puedeEliminar = totalAsignados === 0;
            const eliminando = eliminandoId === item.id;

            return (
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={[styles.iconBox, { backgroundColor: colors.iconSoft }]}>
                  <Ionicons
                    name="pricetag-outline"
                    size={22}
                    color={colors.primaryDark}
                  />
                </View>

                <View style={styles.cardBody}>
                  <Text style={[styles.categoryName, { color: colors.text }]}>
                    {item.nombre}
                  </Text>
                  {item.descripcion ? (
                    <Text style={[styles.description, { color: colors.textMuted }]}>
                      {item.descripcion}
                    </Text>
                  ) : null}
                  <Text
                    style={[
                      styles.deleteHint,
                      puedeEliminar && styles.deleteHintEnabled,
                    ]}
                  >
                    {puedeEliminar
                      ? "Sin productos asignados"
                      : "No eliminable: tiene productos"}
                  </Text>
                </View>

                <View style={styles.rightActions}>
                  <View style={styles.countBox}>
                    <Text style={[styles.countNumber, { color: colors.primaryDark }]}>
                      {item.total_productos}
                    </Text>
                    <Text style={[styles.countLabel, { color: colors.textMuted }]}>
                      activos
                    </Text>
                  </View>

                  <TouchableOpacity
                    disabled={eliminando}
                    style={[
                      styles.deleteButton,
                      !puedeEliminar && styles.deleteButtonBlocked,
                      eliminando && styles.deleteButtonDisabled,
                    ]}
                    onPress={() => confirmarEliminarCategoria(item)}
                  >
                    {eliminando ? (
                      <ActivityIndicator color="#DC2626" size="small" />
                    ) : (
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={puedeEliminar ? "#DC2626" : "#94A3B8"}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 12,
    padding: 14,
  },
  cardBody: {
    flex: 1,
  },
  categoryName: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "800",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  countBox: {
    alignItems: "center",
    minWidth: 72,
  },
  countLabel: {
    color: "#64748B",
    fontSize: 11,
  },
  countNumber: {
    color: "#003B95",
    fontSize: 20,
    fontWeight: "800",
  },
  description: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 3,
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    marginTop: 8,
    width: 44,
  },
  deleteButtonBlocked: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  deleteButtonDisabled: {
    opacity: 0.65,
  },
  deleteHint: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 7,
  },
  deleteHintEnabled: {
    color: "#0F8A45",
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 18,
    padding: 14,
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: "#EEF4FF",
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    marginRight: 12,
    width: 42,
  },
  input: {
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    padding: 13,
  },
  listContent: {
    paddingBottom: 20,
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
  rightActions: {
    alignItems: "center",
    marginLeft: 10,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#0F8A45",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    padding: 13,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 8,
  },
  title: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 18,
  },
});
