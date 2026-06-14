import db from "../connection/database";

export const insertarCategoria = async ({ descripcion = "", nombre }) => {
  try {
    const result = await db.runAsync(
      `INSERT INTO categorias (nombre, descripcion)
       VALUES (?, ?)`,
      [nombre, descripcion],
    );

    return result;
  } catch (error) {
    console.log("Error insertando categoria:", error);
    throw error;
  }
};

export const obtenerCategorias = async () => {
  try {
    const result = await db.getAllAsync(`
      SELECT
        c.id,
        c.nombre,
        c.descripcion,
        (
          SELECT COUNT(*)
          FROM productos p
          WHERE p.categoria_id = c.id
            AND p.activo = 1
        ) AS total_productos,
        (
          SELECT COUNT(*)
          FROM productos p
          WHERE p.categoria_id = c.id
            AND p.activo != -1
        ) AS total_productos_asignados
      FROM categorias c
      WHERE c.activo = 1
      ORDER BY c.nombre COLLATE NOCASE ASC
    `);

    return result;
  } catch (error) {
    console.log("Error obteniendo categorias:", error);
    throw error;
  }
};

export const contarProductosAsignadosCategoria = async (id) => {
  try {
    const result = await db.getFirstAsync(
      `SELECT COUNT(*) AS total
       FROM productos
       WHERE categoria_id = ?
         AND activo != -1`,
      [id],
    );

    return Number(result?.total ?? 0);
  } catch (error) {
    console.log("Error contando productos de categoria:", error);
    throw error;
  }
};

export const eliminarCategoriaPorId = async (id) => {
  try {
    const result = await db.runAsync(
      `DELETE FROM categorias
       WHERE id = ?
         AND NOT EXISTS (
           SELECT 1
           FROM productos
           WHERE categoria_id = ?
             AND activo != -1
         )`,
      [id, id],
    );

    return result;
  } catch (error) {
    console.log("Error eliminando categoria:", error);
    throw error;
  }
};

export const obtenerCategoriaPorId = async (id) => {
  try {
    const result = await db.getFirstAsync(
      `SELECT id, nombre, descripcion
       FROM categorias
       WHERE id = ? AND activo = 1`,
      [id],
    );

    return result;
  } catch (error) {
    console.log("Error obteniendo categoria:", error);
    throw error;
  }
};
