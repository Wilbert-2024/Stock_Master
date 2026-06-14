import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import db from "../database/connection/database";
import { initDatabase } from "../database/migrations/initDatabase";

const BACKUP_VERSION = 1;
const TABLES = [
  "categorias",
  "productos",
  "ventas",
  "detalle_ventas",
  "movimientos_inventario",
];
const REQUIRED_BACKUP_TABLES = [
  "categorias",
  "productos",
  "ventas",
  "detalle_ventas",
];

const formatBackupDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}_${hour}-${minute}`;
};

const getBackupFileName = () => `respaldoStok_Master_${formatBackupDate()}.json`;

const insertRows = async (tableName, rows) => {
  for (const row of rows) {
    const columns = Object.keys(row);
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((column) => row[column]);

    await db.runAsync(
      `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`,
      values,
    );
  }
};

export const crearRespaldo = async () => {
  await initDatabase();

  const data = {};

  for (const table of TABLES) {
    data[table] = await db.getAllAsync(`SELECT * FROM ${table}`);
  }

  const backup = {
    app: "StokMaster",
    createdAt: new Date().toISOString(),
    data,
    version: BACKUP_VERSION,
  };
  const fileName = getBackupFileName();
  const backupContent = JSON.stringify(backup, null, 2);
  let fileUri = `${FileSystem.documentDirectory}${fileName}`;
  let savedToUserFolder = false;

  if (Platform.OS === "android" && FileSystem.StorageAccessFramework) {
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (!permissions.granted) {
      return null;
    }

    fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      fileName,
      "application/json",
    );
    await FileSystem.StorageAccessFramework.writeAsStringAsync(
      fileUri,
      backupContent,
      {
        encoding: FileSystem.EncodingType.UTF8,
      },
    );
    savedToUserFolder = true;
  } else if (await Sharing.isAvailableAsync()) {
    await FileSystem.writeAsStringAsync(fileUri, backupContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await Sharing.shareAsync(fileUri, {
      dialogTitle: "Compartir respaldo de StokMaster",
      mimeType: "application/json",
      UTI: "public.json",
    });
  } else {
    await FileSystem.writeAsStringAsync(fileUri, backupContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  }

  return {
    fileName,
    fileUri,
    savedToUserFolder,
    resumen: {
      categorias: data.categorias.length,
      detalleVentas: data.detalle_ventas.length,
      movimientos: data.movimientos_inventario.length,
      productos: data.productos.length,
      ventas: data.ventas.length,
    },
  };
};

export const restaurarRespaldo = async () => {
  await initDatabase();

  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: "*/*",
  });

  if (result.canceled) {
    return null;
  }

  const file = result.assets[0];
  const content = await FileSystem.readAsStringAsync(file.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  let backup;

  try {
    backup = JSON.parse(content);
  } catch {
    throw new Error("El archivo seleccionado no tiene un formato JSON válido");
  }

  if (backup.app !== "StokMaster" || backup.version !== BACKUP_VERSION) {
    throw new Error("El archivo seleccionado no es un respaldo válido de StokMaster");
  }

  for (const table of REQUIRED_BACKUP_TABLES) {
    if (!Array.isArray(backup.data?.[table])) {
      throw new Error("El respaldo esta incompleto o danado");
    }
  }

  const movimientos = Array.isArray(backup.data?.movimientos_inventario)
    ? backup.data.movimientos_inventario
    : [];

  try {
    await db.execAsync("BEGIN TRANSACTION;");
    await db.execAsync(`
      DELETE FROM movimientos_inventario;
      DELETE FROM detalle_ventas;
      DELETE FROM ventas;
      DELETE FROM productos;
      DELETE FROM categorias;
    `);

    await insertRows("categorias", backup.data.categorias);
    await insertRows("productos", backup.data.productos);
    await insertRows("ventas", backup.data.ventas);
    await insertRows("detalle_ventas", backup.data.detalle_ventas);
    await insertRows("movimientos_inventario", movimientos);

    await db.execAsync("COMMIT;");
    await initDatabase();
  } catch (error) {
    await db.execAsync("ROLLBACK;");
    throw error;
  }

  return {
    fileName: file.name,
    resumen: {
      categorias: backup.data.categorias.length,
      detalleVentas: backup.data.detalle_ventas.length,
      movimientos: movimientos.length,
      productos: backup.data.productos.length,
      ventas: backup.data.ventas.length,
    },
  };
};
