import db from "../connection/database";

export const insertarVenta = async ({
  cambio,
  cantidad_productos,
  detalle,
  fecha,
  metodo_pago,
  recibido,
  total,
}) => {
  try {
    await db.execAsync("BEGIN TRANSACTION;");

    const ventaResult = await db.runAsync(
      `INSERT INTO ventas (fecha, total, cantidad_productos, metodo_pago, recibido, cambio)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fecha, total, cantidad_productos, metodo_pago, recibido, cambio],
    );

    const ventaId = ventaResult.lastInsertRowId;

    for (const item of detalle) {
      await db.runAsync(
        `INSERT INTO detalle_ventas (
          venta_id,
          producto_id,
          producto_nombre,
          presentacion_nombre,
          unidad_base,
          cantidad_base,
          cantidad_presentaciones,
          precio_unitario,
          costo_unitario,
          costo_total,
          ganancia,
          subtotal
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ventaId,
          item.producto_id,
          item.producto_nombre,
          item.presentacion_nombre,
          item.unidad_base,
          item.cantidad_base,
          item.cantidad_presentaciones,
          item.precio_unitario,
          item.costo_unitario,
          item.costo_total,
          item.ganancia,
          item.subtotal,
        ],
      );

      await db.runAsync(
        `UPDATE productos
         SET stock = stock - ?
         WHERE id = ? AND activo = 1`,
        [item.cantidad_base, item.producto_id],
      );
    }

    await db.execAsync("COMMIT;");

    return ventaId;
  } catch (error) {
    await db.execAsync("ROLLBACK;");
    console.log("Error insertando venta:", error);
    throw error;
  }
};

export const obtenerVentas = async () => {
  try {
    const result = await db.getAllAsync(`
      SELECT *
      FROM ventas
      ORDER BY id DESC
    `);

    return result;
  } catch (error) {
    console.log("Error obteniendo ventas:", error);
    throw error;
  }
};

export const obtenerVentaPorId = async (id) => {
  try {
    const venta = await db.getFirstAsync(
      `SELECT * FROM ventas WHERE id = ?`,
      [id],
    );

    if (!venta) {
      return null;
    }

    const detalle = await db.getAllAsync(
      `SELECT *
       FROM detalle_ventas
       WHERE venta_id = ?
       ORDER BY id ASC`,
      [id],
    );

    return { detalle, venta };
  } catch (error) {
    console.log("Error obteniendo venta:", error);
    throw error;
  }
};

export const obtenerResumenVentas = async () => {
  try {
    const result = await db.getFirstAsync(`
      SELECT
        COUNT(*) AS totalVentas,
        COALESCE(SUM(total), 0) AS montoTotal,
        COALESCE(SUM(cantidad_productos), 0) AS productosVendidos
      FROM ventas
      WHERE date(fecha, 'localtime') = date('now', 'localtime')
    `);

    return {
      montoTotal: Number(result?.montoTotal ?? 0),
      productosVendidos: Number(result?.productosVendidos ?? 0),
      totalVentas: Number(result?.totalVentas ?? 0),
    };
  } catch (error) {
    console.log("Error obteniendo resumen de ventas:", error);
    throw error;
  }
};

export const obtenerReporteVentasPorFecha = async (fecha) => {
  return obtenerReporteVentasPorRango(fecha, fecha);
};

export const obtenerReporteVentasPorRango = async (fechaInicio, fechaFin) => {
  try {
    const resumen = await db.getFirstAsync(
      `
        SELECT
          COUNT(*) AS totalVentas,
          COALESCE(SUM(total), 0) AS montoTotal,
          COALESCE(SUM(cantidad_productos), 0) AS productosVendidos,
          COALESCE((
            SELECT SUM(dv.ganancia)
            FROM detalle_ventas dv
            INNER JOIN ventas v2 ON v2.id = dv.venta_id
            WHERE date(v2.fecha, 'localtime') BETWEEN date(?) AND date(?)
          ), 0) AS gananciaTotal
        FROM ventas
        WHERE date(fecha, 'localtime') BETWEEN date(?) AND date(?)
      `,
      [fechaInicio, fechaFin, fechaInicio, fechaFin],
    );

    const ventas = await db.getAllAsync(
      `
        SELECT *
        FROM ventas
        WHERE date(fecha, 'localtime') BETWEEN date(?) AND date(?)
        ORDER BY id DESC
      `,
      [fechaInicio, fechaFin],
    );

    const detalleVentas = await db.getAllAsync(
      `
        SELECT
          dv.*
        FROM detalle_ventas dv
        INNER JOIN ventas v ON v.id = dv.venta_id
        WHERE date(v.fecha, 'localtime') BETWEEN date(?) AND date(?)
        ORDER BY dv.venta_id DESC, dv.id ASC
      `,
      [fechaInicio, fechaFin],
    );

    const detallesPorVenta = detalleVentas.reduce((acc, item) => {
      const ventaId = Number(item.venta_id);
      acc[ventaId] = acc[ventaId] || [];
      acc[ventaId].push(item);
      return acc;
    }, {});

    const productos = await db.getAllAsync(
      `
        SELECT
          producto_id,
          producto_nombre,
          unidad_base,
          SUM(cantidad_base) AS cantidad_base,
          SUM(subtotal) AS total_vendido,
          SUM(ganancia) AS ganancia_total
        FROM detalle_ventas dv
        INNER JOIN ventas v ON v.id = dv.venta_id
        WHERE date(v.fecha, 'localtime') BETWEEN date(?) AND date(?)
        GROUP BY producto_id, producto_nombre, unidad_base
        ORDER BY cantidad_base DESC, total_vendido DESC
      `,
      [fechaInicio, fechaFin],
    );

    return {
      productos,
      rango: {
        fechaFin,
        fechaInicio,
      },
      resumen: {
        montoTotal: Number(resumen?.montoTotal ?? 0),
        gananciaTotal: Number(resumen?.gananciaTotal ?? 0),
        productosVendidos: Number(resumen?.productosVendidos ?? 0),
        totalVentas: Number(resumen?.totalVentas ?? 0),
      },
      ventas: ventas.map((venta) => ({
        ...venta,
        detalle: detallesPorVenta[Number(venta.id)] || [],
      })),
    };
  } catch (error) {
    console.log("Error obteniendo reporte de ventas por rango:", error);
    throw error;
  }
};
