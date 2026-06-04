import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAppTheme } from "../../theme/AppThemeProvider";

const HIDE_DELAY_MS = 2000;

const NAV_ITEMS = [
  { icon: "home", label: "Inicio", route: "/", section: "inicio" },
  {
    icon: "cube-outline",
    label: "Inventario",
    route: "/inventario",
    section: "inventario",
  },
  { icon: "cart-outline", label: "Ventas", route: "/ventas", section: "ventas" },
  {
    icon: "bar-chart-outline",
    label: "Reportes",
    route: "/reportes",
    section: "reportes",
  },
  {
    icon: "ellipsis-horizontal",
    label: "Mas",
    route: "/configuracion",
    section: "mas",
  },
];

const getActiveSection = (pathname) => {
  if (pathname === "/") {
    return "inicio";
  }

  if (pathname.startsWith("/inventario")) {
    return "inventario";
  }

  if (pathname.startsWith("/ventas")) {
    return "ventas";
  }

  if (pathname.startsWith("/reportes")) {
    return "reportes";
  }

  return "mas";
};

const shouldShowNav = (pathname) => !pathname.startsWith("/escaner");

export default function AutoHideBottomNav({ children }) {
  const { colors } = useAppTheme();
  const pathname = usePathname();
  const activeSection = useMemo(() => getActiveSection(pathname), [pathname]);
  const navEnabled = shouldShowNav(pathname);
  const translateY = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef(null);
  const [visible, setVisible] = useState(true);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const hideNav = useCallback(() => {
    if (!navEnabled) {
      return;
    }

    setVisible(false);
    Animated.timing(translateY, {
      duration: 220,
      toValue: 96,
      useNativeDriver: true,
    }).start();
  }, [navEnabled, translateY]);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(hideNav, HIDE_DELAY_MS);
  }, [clearHideTimer, hideNav]);

  const showNav = useCallback(() => {
    if (!navEnabled) {
      return;
    }

    setVisible(true);
    Animated.timing(translateY, {
      duration: 180,
      toValue: 0,
      useNativeDriver: true,
    }).start();
    scheduleHide();
  }, [navEnabled, scheduleHide, translateY]);

  useEffect(() => {
    if (!navEnabled) {
      clearHideTimer();
      setVisible(false);
      translateY.setValue(96);
      return;
    }

    showNav();

    return clearHideTimer;
  }, [clearHideTimer, navEnabled, pathname, showNav, translateY]);

  const handleNavPress = (route) => {
    showNav();
    router.push(route);
  };

  return (
    <View style={styles.container} onTouchStart={showNav}>
      {children}

      {navEnabled && (
        <Animated.View
          pointerEvents={visible ? "auto" : "none"}
          style={[
            styles.bottomNav,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              transform: [{ translateY }],
            },
          ]}
        >
          {NAV_ITEMS.map((item) => {
            const active = item.section === activeSection;

            return (
              <TouchableOpacity
                key={item.section}
                style={[styles.bottomItem, active && styles.bottomItemActive]}
                onPress={() => handleNavPress(item.route)}
              >
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={active ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.bottomLabel,
                    { color: active ? colors.primary : colors.textMuted },
                    active && styles.bottomLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomItem: {
    alignItems: "center",
    borderRadius: 14,
    height: 58,
    justifyContent: "center",
    width: 66,
  },
  bottomItemActive: {
    backgroundColor: "rgba(96, 165, 250, 0.14)",
  },
  bottomLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  bottomLabelActive: {
    color: "#2563EB",
    fontWeight: "900",
  },
  bottomNav: {
    alignItems: "center",
    borderTopWidth: 1,
    bottom: 0,
    elevation: 10,
    flexDirection: "row",
    height: 78,
    justifyContent: "space-around",
    left: 0,
    paddingHorizontal: 8,
    position: "absolute",
    right: 0,
    shadowColor: "#0F172A",
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  container: {
    flex: 1,
  },
});
