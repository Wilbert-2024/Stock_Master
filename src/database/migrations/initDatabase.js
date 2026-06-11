import db from "../connection/database";

const ensureColumn = async (tableName, columnName, definition) => {
  const columns = await db.getAllAsync(`PRAGMA table_info(${tableName})`);
  const exists = columns.some(
    (column) => column.name === columnName || column[1] === columnName,
  );

  if (!exists) {
    try {
      await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${definition};`);
    } catch (error) {
      const message = String(error?.message ?? error).toLowerCase();

      if (!message.includes("duplicate column name")) {
        throw error;
      }
    }
  }
};

export const initDatabase = async () => {
  try {
    await db.execAsync(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT,
        activo INTEGER NOT NULL DEFAULT 1,
        fecha_registro TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        codigo_barras TEXT,
        categoria_id INTEGER,
        precio REAL NOT NULL,
        precio_base REAL NOT NULL DEFAULT 0,
        precio_compra REAL NOT NULL DEFAULT 0,
        precio_compra_base REAL NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL,
        stock_minimo INTEGER NOT NULL DEFAULT 5,
        tipo_medida TEXT NOT NULL DEFAULT 'unidad',
        unidad_base TEXT NOT NULL DEFAULT 'unidad',
        presentacion_id TEXT NOT NULL DEFAULT 'unidad',
        presentacion_nombre TEXT NOT NULL DEFAULT 'Unidad',
        cantidad_por_presentacion INTEGER NOT NULL DEFAULT 1,
        fecha_vencimiento TEXT,
        fecha_registro TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        activo INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
      );

      CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        total REAL NOT NULL,
        cantidad_productos INTEGER NOT NULL,
        metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
        recibido REAL NOT NULL DEFAULT 0,
        cambio REAL NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS detalle_ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        producto_nombre TEXT NOT NULL,
        presentacion_nombre TEXT NOT NULL,
        unidad_base TEXT NOT NULL,
        cantidad_base INTEGER NOT NULL,
        cantidad_presentaciones REAL NOT NULL,
        precio_unitario REAL NOT NULL,
        costo_unitario REAL NOT NULL DEFAULT 0,
        costo_total REAL NOT NULL DEFAULT 0,
        ganancia REAL NOT NULL DEFAULT 0,
        subtotal REAL NOT NULL,
        FOREIGN KEY (venta_id) REFERENCES ventas(id),
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      );

      CREATE TABLE IF NOT EXISTS app_metadata (
        clave TEXT PRIMARY KEY,
        valor TEXT NOT NULL
      );
    `);

    const seedStatus = await db.getFirstAsync(
      "SELECT valor FROM app_metadata WHERE clave = ?",
      ["categorias_iniciales_creadas"],
    );

    if (!seedStatus) {
      const categoriasCount = await db.getFirstAsync(
        "SELECT COUNT(*) AS total FROM categorias",
      );

      if (Number(categoriasCount?.total ?? 0) === 0) {
        await db.execAsync(`
          INSERT OR IGNORE INTO categorias (nombre, descripcion) VALUES
            ('Alimentos', 'Productos basicos de consumo diario'),
            ('Bebidas', 'Jugos, gaseosas, agua y otros liquidos'),
            ('Limpieza', 'Productos para limpieza del hogar'),
            ('Cuidado Personal', 'Productos de higiene y cuidado personal'),
            ('Abarrotes', 'Productos surtidos de pulperia');
        `);
      }

      await db.runAsync(
        "INSERT INTO app_metadata (clave, valor) VALUES (?, ?)",
        ["categorias_iniciales_creadas", "1"],
      );
    }

    await ensureColumn("productos", "categoria_id", "categoria_id INTEGER");
    await ensureColumn("productos", "codigo_barras", "codigo_barras TEXT");
    await ensureColumn(
      "productos",
      "stock_minimo",
      "stock_minimo INTEGER NOT NULL DEFAULT 5",
    );
    await ensureColumn("productos", "precio_base", "precio_base REAL NOT NULL DEFAULT 0");
    await ensureColumn(
      "productos",
      "precio_compra",
      "precio_compra REAL NOT NULL DEFAULT 0",
    );
    await ensureColumn(
      "productos",
      "precio_compra_base",
      "precio_compra_base REAL NOT NULL DEFAULT 0",
    );
    await ensureColumn(
      "productos",
      "tipo_medida",
      "tipo_medida TEXT NOT NULL DEFAULT 'unidad'",
    );
    await ensureColumn(
      "productos",
      "unidad_base",
      "unidad_base TEXT NOT NULL DEFAULT 'unidad'",
    );
    await ensureColumn(
      "productos",
      "presentacion_id",
      "presentacion_id TEXT NOT NULL DEFAULT 'unidad'",
    );
    await ensureColumn(
      "productos",
      "presentacion_nombre",
      "presentacion_nombre TEXT NOT NULL DEFAULT 'Unidad'",
    );
    await ensureColumn(
      "productos",
      "cantidad_por_presentacion",
      "cantidad_por_presentacion INTEGER NOT NULL DEFAULT 1",
    );
    await ensureColumn("productos", "fecha_vencimiento", "fecha_vencimiento TEXT");
    await ensureColumn(
      "productos",
      "fecha_registro",
      "fecha_registro TEXT",
    );
    await ensureColumn("productos", "activo", "activo INTEGER NOT NULL DEFAULT 1");
    await ensureColumn(
      "detalle_ventas",
      "costo_unitario",
      "costo_unitario REAL NOT NULL DEFAULT 0",
    );
    await ensureColumn(
      "detalle_ventas",
      "costo_total",
      "costo_total REAL NOT NULL DEFAULT 0",
    );
    await ensureColumn(
      "detalle_ventas",
      "ganancia",
      "ganancia REAL NOT NULL DEFAULT 0",
    );

    await db.execAsync(`
      UPDATE productos
      SET precio_base = precio / cantidad_por_presentacion
      WHERE precio_base = 0 AND cantidad_por_presentacion > 0;

      UPDATE productos
      SET precio_compra_base = precio_compra / cantidad_por_presentacion
      WHERE precio_compra > 0
        AND precio_compra_base = 0
        AND cantidad_por_presentacion > 0;

      UPDATE detalle_ventas
      SET ganancia = subtotal - costo_total
      WHERE ganancia = 0 AND costo_total > 0;
    `);

    console.log("Base de datos inicializada");
  } catch (error) {
    console.log("Error inicializando DB:", error);
  }
};
