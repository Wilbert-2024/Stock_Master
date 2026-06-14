import { initDatabase } from "../database/migrations/initDatabase";
import { obtenerMovimientosPorProducto } from "../database/repositories/movementRepository";

export const listarMovimientosProducto = async (id) => {
  await initDatabase();

  const productoId = Number(id);

  if (!Number.isInteger(productoId) || productoId <= 0) {
    throw new Error("Producto inválido");
  }

  return await obtenerMovimientosPorProducto(productoId);
};
