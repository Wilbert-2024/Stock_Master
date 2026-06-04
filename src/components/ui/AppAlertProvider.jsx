import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAppTheme } from "../../theme/AppThemeProvider";

const SUCCESS_TITLES = [
  "exito",
  "éxito",
  "listo",
  "correcto",
  "guardado",
  "respaldo generado",
  "respaldo restaurado",
  "datos restaurados",
  "reporte generado",
];
const ERROR_TITLES = [
  "error",
  "sin stock",
  "stock insuficiente",
  "campo requerido",
  "carrito incompleto",
  "categoria con productos",
  "categoría con productos",
  "no se pudo",
];
const WARNING_TITLES = [
  "eliminar",
  "borrar",
  "desactivar",
  "reactivar",
  "restaurar respaldo",
  "confirmar venta",
];

const normalize = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getAlertVariant = (title = "") => {
  const normalizedTitle = normalize(title);

  if (SUCCESS_TITLES.some((item) => normalizedTitle.includes(normalize(item)))) {
    return "success";
  }

  if (ERROR_TITLES.some((item) => normalizedTitle.includes(normalize(item)))) {
    return "error";
  }

  if (WARNING_TITLES.some((item) => normalizedTitle.includes(normalize(item)))) {
    return "warning";
  }

  return "info";
};

const VARIANT_CONFIG = {
  error: {
    accent: "#DC2626",
    background: "#FEF2F2",
    border: "#FECACA",
    icon: "close-circle",
  },
  info: {
    accent: "#003B95",
    background: "#EEF4FF",
    border: "#C7D7FE",
    icon: "arrow-forward-circle",
  },
  success: {
    accent: "#0F8A45",
    background: "#ECFDF3",
    border: "#BBF7D0",
    icon: "checkmark-circle",
  },
  warning: {
    accent: "#D97706",
    background: "#FFFBEB",
    border: "#FDE68A",
    icon: "warning",
  },
};

export default function AppAlertProvider({ children }) {
  const { colors, isDark } = useAppTheme();
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    const nativeAlert = Alert.alert;

    Alert.alert = (title, message, buttons, options) => {
      const normalizedButtons =
        Array.isArray(buttons) && buttons.length > 0
          ? buttons
          : [{ text: "OK", style: "default" }];

      setDialog({
        buttons: normalizedButtons,
        cancelable: options?.cancelable ?? true,
        message,
        title,
        variant: getAlertVariant(title),
      });
    };

    return () => {
      Alert.alert = nativeAlert;
    };
  }, []);

  const config = useMemo(
    () => VARIANT_CONFIG[dialog?.variant] ?? VARIANT_CONFIG.info,
    [dialog?.variant],
  );

  const closeDialog = () => {
    setDialog(null);
  };

  const handleButtonPress = (button) => {
    closeDialog();
    button?.onPress?.();
  };

  return (
    <>
      {children}

      <Modal
        animationType="fade"
        transparent
        visible={Boolean(dialog)}
        onRequestClose={() => {
          if (dialog?.cancelable) {
            closeDialog();
          }
        }}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => {
            if (dialog?.cancelable) {
              closeDialog();
            }
          }}
        >
          <Pressable
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                shadowOpacity: isDark ? 0.34 : 0.2,
              },
            ]}
          >
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: config.background, borderColor: config.border },
              ]}
            >
              <Ionicons name={config.icon} size={46} color={config.accent} />
            </View>

            <Text style={[styles.title, { color: config.accent }]}>
              {dialog?.title}
            </Text>

            {dialog?.message ? (
              <Text style={[styles.message, { color: colors.textMuted }]}>
                {dialog.message}
              </Text>
            ) : null}

            <View style={styles.buttonRow}>
              {dialog?.buttons?.map((button, index) => {
                const isCancel = button.style === "cancel";
                const isDestructive = button.style === "destructive";
                const isPrimary =
                  !isCancel && index === dialog.buttons.length - 1;

                return (
                  <TouchableOpacity
                    key={`${button.text ?? "OK"}-${index}`}
                    style={[
                      styles.button,
                      { borderColor: colors.border },
                      isPrimary && {
                        backgroundColor: isDestructive ? "#DC2626" : config.accent,
                        borderColor: isDestructive ? "#DC2626" : config.accent,
                      },
                    ]}
                    onPress={() => handleButtonPress(button)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        { color: colors.text },
                        isCancel && styles.cancelButtonText,
                        isPrimary && styles.primaryButtonText,
                        isDestructive && !isPrimary && styles.destructiveButtonText,
                      ]}
                    >
                      {button.text ?? "OK"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
    width: "100%",
  },
  buttonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  cancelButtonText: {
    color: "#64748B",
  },
  card: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    maxWidth: 360,
    padding: 22,
    shadowColor: "#020617",
    shadowOffset: { height: 16, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    width: "88%",
  },
  destructiveButtonText: {
    color: "#DC2626",
  },
  iconBadge: {
    alignItems: "center",
    borderRadius: 46,
    borderWidth: 1,
    height: 74,
    justifyContent: "center",
    marginBottom: 14,
    width: 74,
  },
  message: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.52)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
});
