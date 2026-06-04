import { initDatabase } from "../database/migrations/initDatabase";
import {
  contarProductosAsignadosCategoria,
  eliminarCategoriaPorId,
  insertarCategoria,
  obtenerCategorias,
} from "../database/repositories/categoryRepository";

export const listarCategorias = async () => {
  await initDatabase();
  return await obtenerCategorias();
};

export const crearCategoria = async (categoria) => {
  await initDatabase();

  const nombre = categoria.nombre?.trim();
  const descripcion = categoria.descripcion?.trim() || "";

  if (!nombre) {
    throw new Error("El nombre de la categoria es obligatorio");
  }

  if (nombre.length < 3) {
    throw new Error("La categoria debe tener al menos 3 caracteres");
  }

  return await insertarCategoria({ descripcion, nombre });
};

export const eliminarCategoria = async (id) => {
  await initDatabase();

  const categoryId = Number(id);

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new Error("Categoria invalida");
  }

  const totalProductos = await contarProductosAsignadosCategoria(categoryId);

  if (totalProductos > 0) {
    throw new Error(
      "No puedes eliminar una categoria que tiene productos asignados",
    );
  }

  const result = await eliminarCategoriaPorId(categoryId);

  if (Number(result?.changes ?? result?.rowsAffected ?? 0) === 0) {
    throw new Error("No se pudo eliminar la categoria. Intentalo de nuevo.");
  }

  return result;
};
