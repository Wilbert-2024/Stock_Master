import db from "../connection/database";

export const obtenerMovimientosPorProducto = async (productoId) => {
  try {
    return await db.getAllAsync(
      `SELECT
        id,
        producto_id,
        tipo,
        cantidad_anterior,
        cantidad_movida,
        cantidad_nueva,
        motivo,
        origen,
        referencia_id,
        responsable,
        fecha
       FROM movimientos_inventario
       WHERE producto_id = ?
       ORDER BY datetime(fecha) DESC, id DESC`,
      [productoId],
    );
  } catch (error) {
    console.log("Error obteniendo movimientos de inventario:", error);
    throw error;
  }
};
