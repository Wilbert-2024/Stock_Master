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
const NAV_HEIGHT = 78;

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
  const navHeight = useRef(new Animated.Value(NAV_HEIGHT)).current;
  const navOpacity = useRef(new Animated.Value(1)).current;
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
    Animated.parallel([
      Animated.timing(navHeight, {
        duration: 220,
        toValue: 0,
        useNativeDriver: false,
      }),
      Animated.timing(navOpacity, {
        duration: 160,
        toValue: 0,
        useNativeDriver: false,
      }),
    ]).start();
  }, [navEnabled, navHeight, navOpacity]);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(hideNav, HIDE_DELAY_MS);
  }, [clearHideTimer, hideNav]);

  const showNav = useCallback(() => {
    if (!navEnabled) {
      return;
    }

    setVisible(true);
    Animated.parallel([
      Animated.timing(navHeight, {
        duration: 180,
        toValue: NAV_HEIGHT,
        useNativeDriver: false,
      }),
      Animated.timing(navOpacity, {
        duration: 180,
        toValue: 1,
        useNativeDriver: false,
      }),
    ]).start();
    scheduleHide();
  }, [navEnabled, navHeight, navOpacity, scheduleHide]);

  useEffect(() => {
    if (!navEnabled) {
      clearHideTimer();
      setVisible(false);
      navHeight.setValue(0);
      navOpacity.setValue(0);
      return;
    }

    showNav();

    return clearHideTimer;
  }, [clearHideTimer, navEnabled, navHeight, navOpacity, pathname, showNav]);

  const handleNavPress = (route) => {
    showNav();
    router.push(route);
  };

  return (
    <View
      style={styles.container}
      onTouchMove={showNav}
      onTouchStart={showNav}
    >
      <View style={styles.content}>{children}</View>

      {navEnabled && (
        <Animated.View
          pointerEvents={visible ? "auto" : "none"}
          style={[
            styles.bottomNav,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderTopWidth: visible ? 1 : 0,
              height: navHeight,
              opacity: navOpacity,
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
    elevation: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    minHeight: 0,
    overflow: "hidden",
    paddingHorizontal: 8,
    shadowColor: "#0F172A",
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
