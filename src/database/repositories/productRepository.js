import db from "../connection/database";

export const insertarProducto = async (producto) => {
  try {
    const {
      cantidad_por_presentacion,
      categoria_id,
      codigo_barras = null,
      fecha_vencimiento = null,
      nombre,
      precio,
      precio_base,
      precio_compra,
      precio_compra_base,
      presentacion_id,
      presentacion_nombre,
      stock,
      stock_minimo = 5,
      tipo_medida,
      unidad_base,
    } = producto;

    const result = await db.runAsync(
      `INSERT INTO productos (
        nombre,
        codigo_barras,
        categoria_id,
        precio,
        precio_base,
        precio_compra,
        precio_compra_base,
        stock,
        stock_minimo,
        tipo_medida,
        unidad_base,
        presentacion_id,
        presentacion_nombre,
        cantidad_por_presentacion,
        fecha_vencimiento
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        codigo_barras,
        categoria_id,
        precio,
        precio_base,
        precio_compra,
        precio_compra_base,
        stock,
        stock_minimo,
        tipo_medida,
        unidad_base,
        presentacion_id,
        presentacion_nombre,
        cantidad_por_presentacion,
        fecha_vencimiento,
      ],
    );

    return result;
  } catch (error) {
    console.log("Error insertando producto:", error);
    throw error;
  }
};

export const obtenerProductos = async () => {
  try {
    const result = await db.getAllAsync(`
      SELECT
        p.*,
        COALESCE(c.nombre, 'Sin categoria') AS categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE p.activo = 1
      ORDER BY p.nombre COLLATE NOCASE ASC
    `);

    return result;
  } catch (error) {
    console.log("Error obteniendo productos:", error);
    throw error;
  }
};

export const obtenerProductosDesactivados = async () => {
  try {
    const result = await db.getAllAsync(`
      SELECT
        p.*,
        COALESCE(c.nombre, 'Sin categoria') AS categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE p.activo = 0
      ORDER BY p.id DESC
    `);

    return result;
  } catch (error) {
    console.log("Error obteniendo productos desactivados:", error);
    throw error;
  }
};

export const contarProductosDesactivados = async () => {
  try {
    const result = await db.getFirstAsync(
      `SELECT COUNT(*) AS total FROM productos WHERE activo = 0`,
    );

    return Number(result?.total ?? 0);
  } catch (error) {
    console.log("Error contando productos desactivados:", error);
    throw error;
  }
};

export const obtenerProductoPorId = async (id) => {
  try {
    const result = await db.getFirstAsync(
      `
        SELECT
          p.*,
          COALESCE(c.nombre, 'Sin categoria') AS categoria_nombre
        FROM productos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        WHERE p.id = ? AND p.activo = 1
      `,
      [id],
    );

    return result;
  } catch (error) {
    console.log("Error obteniendo producto:", error);
    throw error;
  }
};

export const obtenerProductoPorCodigo = async (codigo) => {
  try {
    const result = await db.getFirstAsync(
      `
        SELECT
          p.*,
          COALESCE(c.nombre, 'Sin categoria') AS categoria_nombre
        FROM productos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        WHERE p.codigo_barras = ? AND p.activo = 1
      `,
      [codigo],
    );

    return result;
  } catch (error) {
    console.log("Error obteniendo producto por codigo:", error);
    throw error;
  }
};

export const actualizarProducto = async (id, producto) => {
  try {
    const {
      cantidad_por_presentacion,
      categoria_id,
      codigo_barras = null,
      fecha_vencimiento = null,
      nombre,
      precio,
      precio_base,
      precio_compra,
      precio_compra_base,
      presentacion_id,
      presentacion_nombre,
      stock,
      stock_minimo,
      tipo_medida,
      unidad_base,
    } = producto;

    const result = await db.runAsync(
      `
        UPDATE productos
        SET
          nombre = ?,
          codigo_barras = ?,
          categoria_id = ?,
          precio = ?,
          precio_base = ?,
          precio_compra = ?,
          precio_compra_base = ?,
          stock = ?,
          stock_minimo = ?,
          tipo_medida = ?,
          unidad_base = ?,
          presentacion_id = ?,
          presentacion_nombre = ?,
          cantidad_por_presentacion = ?,
          fecha_vencimiento = ?
        WHERE id = ? AND activo = 1
      `,
      [
        nombre,
        codigo_barras,
        categoria_id,
        precio,
        precio_base,
        precio_compra,
        precio_compra_base,
        stock,
        stock_minimo,
        tipo_medida,
        unidad_base,
        presentacion_id,
        presentacion_nombre,
        cantidad_por_presentacion,
        fecha_vencimiento,
        id,
      ],
    );

    return result;
  } catch (error) {
    console.log("Error actualizando producto:", error);
    throw error;
  }
};

export const desactivarProducto = async (id) => {
  try {
    const result = await db.runAsync(
      `UPDATE productos SET activo = 0 WHERE id = ?`,
      [id],
    );

    return result;
  } catch (error) {
    console.log("Error desactivando producto:", error);
    throw error;
  }
};

export const reactivarProducto = async (id) => {
  try {
    const result = await db.runAsync(
      `UPDATE productos SET activo = 1 WHERE id = ?`,
      [id],
    );

    return result;
  } catch (error) {
    console.log("Error reactivando producto:", error);
    throw error;
  }
};

export const borrarProductoDefinitivo = async (id) => {
  try {
    const result = await db.runAsync(
      `DELETE FROM productos WHERE id = ? AND activo = 0`,
      [id],
    );

    return result;
  } catch (error) {
    const message = String(error?.message ?? error).toLowerCase();

    if (!message.includes("foreign key")) {
      console.log("Error borrando producto:", error);
      throw error;
    }

    const result = await db.runAsync(
      `UPDATE productos SET activo = -1 WHERE id = ? AND activo = 0`,
      [id],
    );

    return result;
  }
};

export const obtenerResumenInventario = async () => {
  try {
    const resumen = await db.getFirstAsync(`
      SELECT
        COUNT(*) AS totalProductos,
        COALESCE(SUM(CASE WHEN stock <= stock_minimo THEN 1 ELSE 0 END), 0) AS bajoStock,
        COALESCE(SUM(
          CASE
            WHEN fecha_vencimiento IS NOT NULL
              AND fecha_vencimiento != ''
              AND date(fecha_vencimiento) BETWEEN date('now', 'localtime') AND date('now', 'localtime', '+30 days')
            THEN 1
            ELSE 0
          END
        ), 0) AS porVencer
      FROM productos
      WHERE activo = 1
    `);

    return {
      bajoStock: Number(resumen?.bajoStock ?? 0),
      porVencer: Number(resumen?.porVencer ?? 0),
      totalProductos: Number(resumen?.totalProductos ?? 0),
    };
  } catch (error) {
    console.log("Error obteniendo resumen:", error);
    throw error;
  }
};

export const obtenerAlertasInventario = async () => {
  try {
    const result = await db.getAllAsync(`
      SELECT
        id,
        nombre,
        'bajo_stock' AS tipo,
        'Stock: ' || stock || ' x ' || unidad_base || ' / Min: ' || stock_minimo AS detalle
      FROM productos
      WHERE activo = 1 AND stock <= stock_minimo

      UNION ALL

      SELECT
        id,
        nombre,
        'vencimiento' AS tipo,
        'Vence: ' || fecha_vencimiento AS detalle
      FROM productos
      WHERE activo = 1
        AND fecha_vencimiento IS NOT NULL
        AND fecha_vencimiento != ''
        AND date(fecha_vencimiento) BETWEEN date('now', 'localtime') AND date('now', 'localtime', '+30 days')

      LIMIT 3
    `);

    return result;
  } catch (error) {
    console.log("Error obteniendo alertas:", error);
    throw error;
  }
};

export const obtenerAlertasInventarioDetalladas = async () => {
  try {
    const result = await db.getAllAsync(`
      SELECT *
      FROM (
        SELECT
          p.id AS id,
          p.nombre AS nombre,
          COALESCE(c.nombre, 'Sin categoria') AS categoria_nombre,
          p.stock AS stock,
          p.stock_minimo AS stock_minimo,
          p.unidad_base AS unidad_base,
          p.precio AS precio,
          p.presentacion_nombre AS presentacion_nombre,
          p.fecha_vencimiento AS fecha_vencimiento,
          'bajo_stock' AS tipo,
          CASE
            WHEN p.stock <= 0 THEN 'Sin stock'
            ELSE 'Stock bajo'
          END AS titulo,
          'Stock: ' || p.stock || ' x ' || p.unidad_base || ' / Min: ' || p.stock_minimo AS detalle,
          NULL AS dias_restantes,
          CASE
            WHEN p.stock <= 0 THEN 0
            WHEN p.stock <= (p.stock_minimo / 2) THEN 1
            ELSE 2
          END AS prioridad,
          MAX(p.stock_minimo - p.stock, 0) AS cantidad_faltante,
          CASE
            WHEN p.stock <= 0 THEN 'Urgente'
            WHEN p.stock <= (p.stock_minimo / 2) THEN 'Alta'
            ELSE 'Media'
          END AS urgencia
        FROM productos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        WHERE p.activo = 1 AND p.stock <= p.stock_minimo

        UNION ALL

        SELECT
          p.id AS id,
          p.nombre AS nombre,
          COALESCE(c.nombre, 'Sin categoria') AS categoria_nombre,
          p.stock AS stock,
          p.stock_minimo AS stock_minimo,
          p.unidad_base AS unidad_base,
          p.precio AS precio,
          p.presentacion_nombre AS presentacion_nombre,
          p.fecha_vencimiento AS fecha_vencimiento,
          'vencimiento' AS tipo,
          CASE
            WHEN date(p.fecha_vencimiento) <= date('now', 'localtime') THEN 'Vence hoy'
            ELSE 'Vence pronto'
          END AS titulo,
          'Vence: ' || p.fecha_vencimiento AS detalle,
          CAST(julianday(date(p.fecha_vencimiento)) - julianday(date('now', 'localtime')) AS INTEGER) AS dias_restantes,
          CASE
            WHEN date(p.fecha_vencimiento) <= date('now', 'localtime') THEN 0
            WHEN date(p.fecha_vencimiento) <= date('now', 'localtime', '+7 days') THEN 1
            ELSE 2
          END AS prioridad,
          NULL AS cantidad_faltante,
          CASE
            WHEN date(p.fecha_vencimiento) <= date('now', 'localtime') THEN 'Urgente'
            WHEN date(p.fecha_vencimiento) <= date('now', 'localtime', '+7 days') THEN 'Alta'
            ELSE 'Media'
          END AS urgencia
        FROM productos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        WHERE p.activo = 1
          AND p.fecha_vencimiento IS NOT NULL
          AND p.fecha_vencimiento != ''
          AND date(p.fecha_vencimiento) BETWEEN date('now', 'localtime') AND date('now', 'localtime', '+30 days')
      ) AS alertas
      ORDER BY
        alertas.prioridad ASC,
        CASE
          WHEN alertas.tipo = 'vencimiento' THEN alertas.dias_restantes
          ELSE alertas.stock
        END ASC,
        alertas.nombre COLLATE NOCASE ASC
    `);

    return result;
  } catch (error) {
    console.log("Error obteniendo alertas detalladas:", error);
    throw error;
  }
};
