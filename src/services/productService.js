import {
  actualizarProducto,
  borrarProductoDefinitivo,
  contarProductosDesactivados,
  desactivarProducto,
  insertarProducto,
  obtenerAlertasInventario,
  obtenerAlertasInventarioDetalladas,
  obtenerProductoPorId,
  obtenerProductoPorCodigo,
  obtenerProductos,
  obtenerProductosDesactivados,
  obtenerResumenInventario,
  reactivarProducto,
} from "../database/repositories/productRepository";
import { initDatabase } from "../database/migrations/initDatabase";
import {
  getMeasurementType,
  getPresentation,
} from "../constants/measurements";
import { obtenerCategoriaPorId } from "../database/repositories/categoryRepository";

const MAX_PRODUCTOS_DESACTIVADOS = 10;

const prepararProducto = async (producto) => {
  const nombre = producto.nombre?.trim();
  const codigo_barras = producto.codigo_barras?.trim() || null;
  const categoria_id = Number(producto.categoria_id);
  const precio = Number(producto.precio);
  const tipo_medida = producto.tipo_medida ?? "unidad";
  const presentacion_id = producto.presentacion_id ?? "unidad";
  const stockPresentaciones = Number(
    producto.stock_presentaciones ?? producto.stock,
  );
  const stockMinimoPresentaciones = Number(
    producto.stock_minimo_presentaciones ?? producto.stock_minimo ?? 1,
  );
  const fecha_vencimiento = producto.fecha_vencimiento?.trim() || null;
  const measurementType = getMeasurementType(tipo_medida);
  const presentation = getPresentation(tipo_medida, presentacion_id);

  if (!nombre) {
    throw new Error("El nombre del producto es obligatorio");
  }

  if (!Number.isInteger(categoria_id) || categoria_id <= 0) {
    throw new Error("Selecciona una categoria valida");
  }

  const categoria = await obtenerCategoriaPorId(categoria_id);

  if (!categoria) {
    throw new Error("La categoria seleccionada no existe");
  }

  if (!Number.isFinite(precio) || precio <= 0) {
    throw new Error("El precio debe ser mayor que cero");
  }

  if (!measurementType) {
    throw new Error("Selecciona un tipo de medida valido");
  }

  if (!presentation) {
    throw new Error("Selecciona una presentacion valida para el tipo de medida");
  }

  if (!Number.isInteger(stockPresentaciones) || stockPresentaciones < 0) {
    throw new Error("El stock debe ser un numero entero mayor o igual a cero");
  }

  if (
    !Number.isInteger(stockMinimoPresentaciones) ||
    stockMinimoPresentaciones < 0
  ) {
    throw new Error("El stock minimo debe ser un numero entero mayor o igual a cero");
  }

  if (fecha_vencimiento && !/^\d{4}-\d{2}-\d{2}$/.test(fecha_vencimiento)) {
    throw new Error("La fecha debe tener formato aaaa-mm-dd");
  }

  if (codigo_barras) {
    const productoConCodigo = await obtenerProductoPorCodigo(codigo_barras);

    if (
      productoConCodigo &&
      (!producto.id || Number(producto.id) !== Number(productoConCodigo.id))
    ) {
      throw new Error("Ya existe un producto activo con ese codigo de barras");
    }
  }

  const stock = stockPresentaciones * presentation.baseUnits;
  const stock_minimo = stockMinimoPresentaciones * presentation.baseUnits;
  const precio_base = precio / presentation.baseUnits;

  return {
    cantidad_por_presentacion: presentation.baseUnits,
    categoria_id,
    codigo_barras,
    fecha_vencimiento,
    nombre,
    precio,
    precio_base,
    presentacion_id: presentation.id,
    presentacion_nombre: presentation.label,
    stock,
    stock_minimo,
    tipo_medida,
    unidad_base: measurementType.baseLabel,
  };
};

export const crearProducto = async (producto) => {
  await initDatabase();

  const productoPreparado = await prepararProducto(producto);

  return await insertarProducto(productoPreparado);
};

export const obtenerProducto = async (id) => {
  await initDatabase();

  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error("Producto invalido");
  }

  const producto = await obtenerProductoPorId(productId);

  if (!producto) {
    throw new Error("Producto no encontrado");
  }

  return producto;
};

export const editarProducto = async (id, producto) => {
  await initDatabase();

  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error("Producto invalido");
  }

  const productoPreparado = await prepararProducto({ ...producto, id: productId });

  return await actualizarProducto(productId, productoPreparado);
};

export const eliminarProducto = async (id) => {
  await initDatabase();

  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error("Producto invalido");
  }

  const totalDesactivados = await contarProductosDesactivados();

  if (totalDesactivados >= MAX_PRODUCTOS_DESACTIVADOS) {
    throw new Error(
      "Solo se pueden almacenar 10 productos desactivados. Borra definitivamente uno del apartado de productos desactivados para continuar.",
    );
  }

  return await desactivarProducto(productId);
};

export const listarProductos = async () => {
  await initDatabase();
  return await obtenerProductos();
};

export const buscarProductoPorCodigo = async (codigo) => {
  await initDatabase();

  const codigoNormalizado = codigo?.trim();

  if (!codigoNormalizado) {
    throw new Error("Codigo de barras invalido");
  }

  return await obtenerProductoPorCodigo(codigoNormalizado);
};

export const listarProductosDesactivados = async () => {
  await initDatabase();
  return await obtenerProductosDesactivados();
};

export const restaurarProducto = async (id) => {
  await initDatabase();

  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error("Producto invalido");
  }

  return await reactivarProducto(productId);
};

export const borrarProductoDesactivado = async (id) => {
  await initDatabase();

  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error("Producto invalido");
  }

  return await borrarProductoDefinitivo(productId);
};

export const obtenerDatosInicio = async () => {
  await initDatabase();

  const [resumen, alertas] = await Promise.all([
    obtenerResumenInventario(),
    obtenerAlertasInventario(),
  ]);

  return { alertas, resumen };
};

export const listarAlertasInventario = async () => {
  await initDatabase();
  return await obtenerAlertasInventarioDetalladas();
};
