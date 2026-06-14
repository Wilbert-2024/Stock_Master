import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { obtenerDatosInicio } from "../services/productService";
import { useAppTheme } from "../theme/AppThemeProvider";

const logoImage = require("../../assets/images/stokmaster-logo.png");
const DRAWER_WIDTH = Math.min(Dimensions.get("window").width * 0.62, 280);

const quickActions = [
  {
    icon: <Ionicons name="add-circle-outline" size={34} color="#0F8A45" />,
    route: "/inventario/registrar",
    subtitle: "Agregar producto",
    title: "Registrar",
  },
  {
    icon: <Ionicons name="barcode-outline" size={34} color="#2563EB" />,
    route: "/escaner",
    subtitle: "Codigo de barras",
    title: "Escanear",
  },
  {
    icon: (
      <MaterialCommunityIcons
        name="clipboard-list-outline"
        size={34}
        color="#7C3AED"
      />
    ),
    route: "/inventario",
    subtitle: "Ver productos",
    title: "Inventario",
  },
  {
    icon: <Ionicons name="notifications-outline" size={34} color="#F97316" />,
    route: "/alertas",
    subtitle: "Stock y vencimientos",
    title: "Alertas",
  },
  {
    icon: <Ionicons name="cart-outline" size={34} color="#0284C7" />,
    route: "/ventas",
    subtitle: "Nueva venta",
    title: "Ventas",
  },
  {
    icon: <Ionicons name="stats-chart-outline" size={34} color="#0891B2" />,
    route: "/reportes",
    subtitle: "Ventas diarias",
    title: "Reportes",
  },
];

const sideMenuOptions = [
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
    subtitle: "Reactivar o borrar",
    title: "Desactivados",
  },
  {
    color: "#0F8A45",
    icon: "cloud-upload-outline",
    route: "/configuracion/respaldo",
    subtitle: "Crear o restaurar",
    title: "Respaldo",
  },
  {
    color: "#7C3AED",
    icon: "help-circle-outline",
    route: "/configuracion/ayuda",
    subtitle: "Guia rapida",
    title: "Ayuda",
  },
  {
    color: "#0284C7",
    icon: "information-circle-outline",
    route: "/configuracion/acerca",
    subtitle: "Version y detalles",
    title: "Acerca",
  },
];

export default function HomeScreen() {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const drawerTranslateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [resumen, setResumen] = useState({
    bajoStock: 0,
    porVencer: 0,
    totalProductos: 0,
  });

  const cargarInicio = useCallback(async () => {
    try {
      setCargando(true);
      const data = await obtenerDatosInicio();
      setResumen(data.resumen);
      setAlertas(data.alertas);
    } catch (error) {
      console.log("Error cargando inicio:", error);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarInicio();
    }, [cargarInicio]),
  );

  const totalAlertas = resumen.bajoStock + resumen.porVencer;

  const abrirMenu = () => {
    setMenuVisible(true);
    drawerTranslateX.setValue(-DRAWER_WIDTH);
    Animated.timing(drawerTranslateX, {
      duration: 220,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const cerrarMenu = (despuesDeCerrar) => {
    Animated.timing(drawerTranslateX, {
      duration: 190,
      toValue: -DRAWER_WIDTH,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
      despuesDeCerrar?.();
    });
  };

  const navegarDesdeMenu = (route) => {
    cerrarMenu(() => router.push(route));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.header} barStyle="light-content" />

      <View style={[styles.header, { backgroundColor: colors.header }]}>
        <TouchableOpacity onPress={abrirMenu}>
          <Ionicons name="menu" size={30} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image source={logoImage} style={styles.headerLogo} />
          <Text style={styles.logo}>StokMaster</Text>
          <Text style={styles.subLogo}>Gestion de Inventario Offline</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notification}
            onPress={() => router.push("/alertas")}
          >
            <Ionicons name="notifications-outline" size={25} color="#fff" />
            {totalAlertas > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalAlertas}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <View style={[styles.welcomeCard, { backgroundColor: colors.welcome }]}>
          <View style={styles.welcomeCopy}>
            <Text style={[styles.welcomeTitle, { color: colors.success }]}>
              Bienvenido
            </Text>
            <Text style={[styles.welcomeText, { color: colors.success }]}>
              Administra tu inventario de pulpería de forma fácil y sin
              internet.
            </Text>
          </View>

        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumen</Text>

        <View style={styles.summaryRow}>
          <SummaryCard
            backgroundColor="#EEF4FF"
            icon={<Feather name="box" size={30} color="#2563EB" />}
            label="Productos"
            value={resumen.totalProductos}
          />
          <SummaryCard
            backgroundColor="#FFF8E8"
            icon={<Ionicons name="warning-outline" size={30} color="#F59E0B" />}
            label="Bajo stock"
            value={resumen.bajoStock}
          />
          <SummaryCard
            backgroundColor="#FFF1F2"
            icon={<Ionicons name="calendar-outline" size={30} color="#DC2626" />}
            label="Por vencer"
            value={resumen.porVencer}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Acciones rapidas
        </Text>

        <View style={styles.grid}>
          {quickActions.map((action) => (
            <ActionCard key={action.route} {...action} />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Últimas alertas
        </Text>

        {cargando ? (
          <View style={[styles.alertBox, { backgroundColor: colors.card }]}>
            <ActivityIndicator color="#2563EB" />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Actualizando resumen...
            </Text>
          </View>
        ) : alertas.length === 0 ? (
          <View style={[styles.alertBox, { backgroundColor: colors.card }]}>
            <Ionicons name="information-circle" size={42} color="#2563EB" />

            <View style={styles.alertCopy}>
              <Text style={[styles.alertTitle, { color: colors.text }]}>
                Sin alertas por ahora
              </Text>
              <Text style={[styles.alertDescription, { color: colors.textMuted }]}>
                Cuando registres productos aparecerán aquí.
              </Text>
            </View>
          </View>
        ) : (
          alertas.map((alerta) => (
            <View
              key={`${alerta.tipo}-${alerta.id}`}
              style={[styles.alertBox, { backgroundColor: colors.card }]}
            >
              <Ionicons
                name={
                  alerta.tipo === "bajo_stock"
                    ? "warning-outline"
                    : "calendar-outline"
                }
                size={42}
                color={alerta.tipo === "bajo_stock" ? "#F59E0B" : "#DC2626"}
              />

              <View style={styles.alertCopy}>
                <Text style={[styles.alertTitle, { color: colors.text }]}>
                  {alerta.nombre}
                </Text>
                <Text style={[styles.alertDescription, { color: colors.textMuted }]}>
                  {alerta.detalle}
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        animationType="none"
        transparent
        visible={menuVisible}
        onRequestClose={() => cerrarMenu()}
      >
        <View style={styles.drawerOverlay}>
          <Pressable style={styles.drawerScrim} onPress={() => cerrarMenu()} />

          <Animated.View
            style={[
              styles.sideDrawer,
              {
                backgroundColor: colors.background,
                transform: [{ translateX: drawerTranslateX }],
                width: DRAWER_WIDTH,
              },
            ]}
          >
            <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
              <Image source={logoImage} style={styles.drawerLogo} />
              <View style={styles.drawerTitleBox}>
                <Text style={[styles.drawerTitle, { color: colors.text }]}>
                  StokMaster
                </Text>
                <Text style={[styles.drawerSubtitle, { color: colors.textMuted }]}>
                  Menu
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.drawerClose, { backgroundColor: colors.cardMuted }]}
                onPress={() => cerrarMenu()}
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.drawerContent}
              showsVerticalScrollIndicator={false}
            >
              {sideMenuOptions.map((option) => (
                <TouchableOpacity
                  key={option.route}
                  style={[
                    styles.drawerOption,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => navegarDesdeMenu(option.route)}
                >
                  <View
                    style={[
                      styles.drawerIconBox,
                      { backgroundColor: `${option.color}1A` },
                    ]}
                  >
                    <Ionicons name={option.icon} size={22} color={option.color} />
                  </View>
                  <View style={styles.drawerOptionText}>
                    <Text style={[styles.drawerOptionTitle, { color: colors.text }]}>
                      {option.title}
                    </Text>
                    <Text
                      style={[
                        styles.drawerOptionSubtitle,
                        { color: colors.textMuted },
                      ]}
                    >
                      {option.subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ActionCard({ icon, route, title, subtitle }) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: colors.card }]}
      onPress={() => router.push(route)}
    >
      {icon}
      <Text style={[styles.actionTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

function SummaryCard({ backgroundColor, icon, label, value }) {
  const { colors, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.summaryCard,
        { backgroundColor: isDark ? colors.card : backgroundColor },
      ]}
    >
      {icon}
      <Text style={[styles.summaryNumber, { color: colors.text }]}>
        {String(value)}
      </Text>
      <Text style={[styles.summaryText, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 14,
    padding: 16,
    width: "48%",
  },
  actionSubtitle: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 5,
  },
  actionTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 10,
  },
  alertBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    flexDirection: "row",
    marginBottom: 10,
    padding: 18,
  },
  alertCopy: {
    flex: 1,
    marginLeft: 14,
  },
  alertDescription: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 4,
  },
  alertTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
  },
  badge: {
    alignItems: "center",
    backgroundColor: "#EF4444",
    borderRadius: 10,
    height: 20,
    justifyContent: "center",
    position: "absolute",
    right: -5,
    top: -5,
    width: 20,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  bottomSpacer: {
    height: 96,
  },
  container: {
    backgroundColor: "#F4F7FB",
    flex: 1,
  },
  content: {
    padding: 16,
  },
  drawerClose: {
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  drawerContent: {
    padding: 12,
    paddingBottom: 22,
  },
  drawerHeader: {
    alignItems: "center",
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingBottom: 14,
    paddingHorizontal: 12,
    paddingTop: 48,
  },
  drawerIconBox: {
    alignItems: "center",
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  drawerLogo: {
    borderRadius: 12,
    height: 46,
    width: 46,
  },
  drawerOption: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 10,
    padding: 10,
  },
  drawerOptionSubtitle: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  drawerOptionText: {
    flex: 1,
    marginLeft: 10,
  },
  drawerOptionTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  drawerScrim: {
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  drawerSubtitle: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 1,
  },
  drawerTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },
  drawerTitleBox: {
    flex: 1,
    marginLeft: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#003B95",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 45,
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  headerActions: {
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    minWidth: 36,
  },
  headerLogo: {
    borderRadius: 12,
    height: 42,
    marginBottom: 4,
    width: 42,
  },
  logo: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  loadingText: {
    color: "#64748B",
    fontSize: 14,
    marginLeft: 12,
  },
  notification: {
    position: "relative",
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
  },
  sideDrawer: {
    backgroundColor: "#F8FAFC",
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
  },
  subLogo: {
    color: "#D6E4FF",
    fontSize: 13,
  },
  themeButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  summaryCard: {
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 16,
    width: "31%",
  },
  summaryNumber: {
    color: "#0F172A",
    fontSize: 26,
    fontWeight: "800",
    marginVertical: 5,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  summaryText: {
    color: "#475569",
    fontSize: 13,
    textAlign: "center",
  },
  welcomeCard: {
    alignItems: "center",
    backgroundColor: "#EAF8EA",
    borderRadius: 18,
    justifyContent: "center",
    marginBottom: 24,
    padding: 18,
  },
  welcomeCopy: {
    alignItems: "center",
  },
  welcomeText: {
    color: "#0F8A45",
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
  },
  welcomeTitle: {
    color: "#0F8A45",
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
});
