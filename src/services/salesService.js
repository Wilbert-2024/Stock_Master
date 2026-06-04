import { initDatabase } from "../database/migrations/initDatabase";
import { obtenerProductoPorId } from "../database/repositories/productRepository";
import {
  insertarVenta,
  obtenerResumenVentas,
  obtenerReporteVentasPorFecha,
  obtenerReporteVentasPorRango,
  obtenerVentaPorId,
  obtenerVentas,
} from "../database/repositories/salesRepository";

export const crearVenta = async ({ carrito, metodo_pago, recibido }) => {
  await initDatabase();

  if (!Array.isArray(carrito) || carrito.length === 0) {
    throw new Error("Agrega al menos un producto a la venta");
  }

  const metodoPago = metodo_pago || "efectivo";
  const recibidoNumber = Number(recibido || 0);
  const acumuladoPorProducto = {};

  for (const item of carrito) {
    const productoId = Number(item.producto_id);
    const cantidadBase = Number(item.cantidad_base);

    if (!Number.isInteger(productoId) || productoId <= 0) {
      throw new Error("Hay un producto invalido en la venta");
    }

    if (!Number.isInteger(cantidadBase) || cantidadBase <= 0) {
      throw new Error("La cantidad vendida debe ser mayor que cero");
    }

    acumuladoPorProducto[productoId] =
      (acumuladoPorProducto[productoId] || 0) + cantidadBase;
  }

  for (const [productoId, cantidadBase] of Object.entries(acumuladoPorProducto)) {
    const producto = await obtenerProductoPorId(Number(productoId));

    if (!producto) {
      throw new Error("Uno de los productos ya no existe en inventario");
    }

    if (producto.stock < cantidadBase) {
      throw new Error(`Stock insuficiente para ${producto.nombre}`);
    }
  }

  const detalle = carrito.map((item) => ({
    cantidad_base: Number(item.cantidad_base),
    cantidad_presentaciones: Number(item.cantidad_presentaciones),
    precio_unitario: Number(item.precio_unitario),
    producto_id: Number(item.producto_id),
    producto_nombre: item.producto_nombre,
    presentacion_nombre: item.presentacion_nombre,
    subtotal: Number(item.subtotal),
    unidad_base: item.unidad_base,
  }));
  const total = detalle.reduce((sum, item) => sum + item.subtotal, 0);
  const cantidad_productos = detalle.reduce(
    (sum, item) => sum + item.cantidad_base,
    0,
  );

  if (metodoPago === "efectivo" && recibidoNumber < total) {
    throw new Error("El monto recibido no cubre el total de la venta");
  }

  const ventaId = await insertarVenta({
    cambio: metodoPago === "efectivo" ? recibidoNumber - total : 0,
    cantidad_productos,
    detalle,
    metodo_pago: metodoPago,
    recibido: metodoPago === "efectivo" ? recibidoNumber : total,
    total,
  });

  return ventaId;
};

export const listarVentas = async () => {
  await initDatabase();
  return await obtenerVentas();
};

export const obtenerVenta = async (id) => {
  await initDatabase();

  const saleId = Number(id);

  if (!Number.isInteger(saleId) || saleId <= 0) {
    throw new Error("Venta invalida");
  }

  const venta = await obtenerVentaPorId(saleId);

  if (!venta) {
    throw new Error("Venta no encontrada");
  }

  return venta;
};

export const obtenerDatosVentas = async () => {
  await initDatabase();
  return await obtenerResumenVentas();
};

export const obtenerReporteVentas = async (fecha) => {
  await initDatabase();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new Error("La fecha del reporte debe tener formato aaaa-mm-dd");
  }

  return await obtenerReporteVentasPorFecha(fecha);
};

export const obtenerReporteVentasPeriodo = async ({ fechaFin, fechaInicio }) => {
  await initDatabase();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fechaFin)
  ) {
    throw new Error("El rango del reporte debe tener formato aaaa-mm-dd");
  }

  if (new Date(`${fechaInicio}T12:00:00`) > new Date(`${fechaFin}T12:00:00`)) {
    throw new Error("La fecha inicial no puede ser mayor que la fecha final");
  }

  return await obtenerReporteVentasPorRango(fechaInicio, fechaFin);
};
