import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { buscarProductoPorCodigo } from "../services/productService";

const BARCODE_TYPES = [
  "aztec",
  "codabar",
  "code128",
  "code39",
  "code93",
  "datamatrix",
  "ean13",
  "ean8",
  "itf14",
  "pdf417",
  "qr",
  "upc_a",
  "upc_e",
];

export default function ScannerScreen() {
  const bloqueoEscaneoRef = useRef(false);
  const [linternaEncendida, setLinternaEncendida] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useFocusEffect(
    useCallback(() => {
      bloqueoEscaneoRef.current = false;
      setScanned(false);

      return () => {
        bloqueoEscaneoRef.current = true;
        setLinternaEncendida(false);
      };
    }, []),
  );

  const manejarCodigo = async ({ data }) => {
    if (bloqueoEscaneoRef.current) {
      return;
    }

    const codigo = String(data ?? "").trim();

    if (!codigo) {
      return;
    }

    bloqueoEscaneoRef.current = true;
    setScanned(true);

    try {
      const producto = await buscarProductoPorCodigo(codigo);

      if (producto) {
        setLinternaEncendida(false);
        router.push(`/inventario/${producto.id}`);
        return;
      }

      const debeRestaurarLinterna = linternaEncendida;
      setLinternaEncendida(false);

      Alert.alert(
        "Producto no encontrado",
        `No existe un producto activo con el codigo ${codigo}.`,
        [
          {
            style: "cancel",
            text: "Escanear otra vez",
            onPress: () => {
              if (debeRestaurarLinterna) {
                setLinternaEncendida(true);
              }
              bloqueoEscaneoRef.current = false;
              setScanned(false);
            },
          },
          {
            text: "Registrar",
            onPress: () => {
              setLinternaEncendida(false);
              router.push({
                pathname: "/inventario/registrar",
                params: { codigo_barras: codigo },
              });
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert("Error", error.message, [
        {
          text: "Intentar de nuevo",
          onPress: () => {
            bloqueoEscaneoRef.current = false;
            setScanned(false);
          },
        },
      ]);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.title}>Permiso de camara</Text>
        <Text style={styles.permissionText}>
          StokMaster necesita acceso a la camara para escanear codigos de
          barras.
        </Text>
        <Button title="Permitir camara" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        active
        barcodeScannerSettings={{
          barcodeTypes: BARCODE_TYPES,
        }}
        enableTorch={linternaEncendida}
        facing="back"
        onMountError={({ message }) => {
          Alert.alert(
            "Error",
            message || "No se pudo iniciar la camara del escaner.",
          );
        }}
        onBarcodeScanned={scanned ? undefined : manejarCodigo}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.overlay}>
        <TouchableOpacity
          style={[
            styles.torchButton,
            linternaEncendida && styles.torchButtonActive,
          ]}
          onPress={() => setLinternaEncendida((current) => !current)}
        >
          <Ionicons
            name={linternaEncendida ? "flash" : "flash-off-outline"}
            size={24}
            color="#fff"
          />
          <Text style={styles.torchText}>
            {linternaEncendida ? "Flash encendido" : "Flash apagado"}
          </Text>
        </TouchableOpacity>

        <View style={styles.scanBox} />

        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>Escanear codigo</Text>
          <Text style={styles.instructionsText}>
            Alinea el codigo de barras dentro del recuadro.
          </Text>

          {scanned ? (
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.scanAgainText}>Escanear otra vez</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    flex: 1,
  },
  instructionsBox: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    borderRadius: 16,
    bottom: 44,
    left: 20,
    padding: 18,
    position: "absolute",
    right: 20,
  },
  instructionsText: {
    color: "#D1D5DB",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  instructionsTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
  },
  permissionContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  permissionText: {
    color: "#334155",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18,
    textAlign: "center",
  },
  scanAgainButton: {
    backgroundColor: "#0F8A45",
    borderRadius: 10,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scanAgainText: {
    color: "#fff",
    fontWeight: "800",
  },
  scanBox: {
    alignSelf: "center",
    borderColor: "#22C55E",
    borderRadius: 16,
    borderWidth: 3,
    height: 220,
    width: "78%",
  },
  title: {
    color: "#0F172A",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 12,
  },
  torchButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.62)",
    borderRadius: 999,
    flexDirection: "row",
    bottom: 174,
    paddingHorizontal: 16,
    paddingVertical: 11,
    position: "absolute",
  },
  torchButtonActive: {
    backgroundColor: "#0F8A45",
  },
  torchText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 8,
  },
});
