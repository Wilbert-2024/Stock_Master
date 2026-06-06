import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Image, Platform } from "react-native";

import { formatCurrency } from "../constants/measurements";

const LOGO_IMAGE = require("../../assets/images/stokmaster-logo.png");

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDateTime = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;

const formatFileDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}_${String(date.getHours()).padStart(2, "0")}-${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;

const getReportFileName = () => `Reporte_StockMaster_${formatFileDate()}.pdf`;

const formatDisplayDate = (value) => {
  if (!value) {
    return "";
  }

  const [year, month, day] = String(value).split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
};

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEKDAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

const parseLocalDate = (value) => new Date(`${value}T12:00:00`);

const formatWeeklyRange = ({ fechaFin, fechaInicio }) => {
  const start = parseLocalDate(fechaInicio);
  const end = parseLocalDate(fechaFin);
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth && sameYear) {
    return `${String(start.getDate()).padStart(2, "0")} - ${String(
      end.getDate(),
    ).padStart(2, "0")} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
  }

  return `${formatDisplayDate(fechaInicio)} - ${formatDisplayDate(fechaFin)}`;
};

const formatMonthLabel = ({ fechaInicio }) => {
  const date = parseLocalDate(fechaInicio);

  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
};

const formatReportCurrency = (value) =>
  `C$ ${Number.isFinite(value) ? value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }) : "0.00"}`;

const buildRows = (items, renderRow, emptyText, columns) => {
  if (!items.length) {
    return `<tr><td colspan="${columns}" class="empty">${escapeHtml(emptyText)}</td></tr>`;
  }

  return items.map(renderRow).join("");
};

const formatQuantity = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return Number.isInteger(number) ? String(number) : number.toFixed(2);
};

const crearDetalleVentaHtml = (detalle = []) => {
  if (!detalle.length) {
    return `
      <div class="sale-detail-empty">
        Sin productos detallados para esta venta.
      </div>
    `;
  }

  const rows = detalle
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.producto_nombre)}</td>
          <td>${escapeHtml(formatQuantity(item.cantidad_presentaciones))} x ${escapeHtml(item.presentacion_nombre)}</td>
          <td>${escapeHtml(formatQuantity(item.cantidad_base))} x ${escapeHtml(item.unidad_base)}</td>
          <td class="money">${escapeHtml(formatCurrency(Number(item.precio_unitario)))}</td>
          <td class="money">${escapeHtml(formatCurrency(Number(item.subtotal)))}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <table class="sale-detail-table">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Vendido</th>
          <th>Unidad minima</th>
          <th class="money">Precio</th>
          <th class="money">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
};

const obtenerProductoMasVendido = (productos = []) => productos[0]?.producto_nombre;

const obtenerProductoMenosVendido = (productos = []) => {
  if (!productos.length) {
    return null;
  }

  return [...productos].sort((a, b) => {
    const cantidadA = Number(a.cantidad_base ?? 0);
    const cantidadB = Number(b.cantidad_base ?? 0);
    const totalA = Number(a.total_vendido ?? 0);
    const totalB = Number(b.total_vendido ?? 0);

    if (cantidadA !== cantidadB) {
      return cantidadA - cantidadB;
    }

    return totalA - totalB;
  })[0]?.producto_nombre;
};

const getSaleDateKey = (venta) => String(venta.fecha ?? "").slice(0, 10);

const obtenerDiasVentas = (ventas = []) => {
  const ventasPorDia = ventas.reduce((acc, venta) => {
    const dateKey = getSaleDateKey(venta);

    if (!dateKey) {
      return acc;
    }

    const day = parseLocalDate(dateKey).getDay();
    const current = acc[day] ?? { cantidad: 0, monto: 0 };

    acc[day] = {
      cantidad: current.cantidad + 1,
      monto: current.monto + Number(venta.total ?? 0),
    };

    return acc;
  }, {});

  const diasConVentas = Object.entries(ventasPorDia).map(([day, data]) => ({
    day: Number(day),
    ...data,
  }));

  if (!diasConVentas.length) {
    return {
      menosVentas: "Sin ventas",
      masVentas: "Sin ventas",
    };
  }

  const ordenarPorMayor = (a, b) => {
    if (b.monto !== a.monto) {
      return b.monto - a.monto;
    }

    if (b.cantidad !== a.cantidad) {
      return b.cantidad - a.cantidad;
    }

    return a.day - b.day;
  };

  const ordenarPorMenor = (a, b) => {
    if (a.monto !== b.monto) {
      return a.monto - b.monto;
    }

    if (a.cantidad !== b.cantidad) {
      return a.cantidad - b.cantidad;
    }

    return a.day - b.day;
  };

  return {
    menosVentas: WEEKDAY_NAMES[[...diasConVentas].sort(ordenarPorMenor)[0].day],
    masVentas: WEEKDAY_NAMES[[...diasConVentas].sort(ordenarPorMayor)[0].day],
  };
};

const obtenerFechasVentas = (ventas = []) => {
  const ventasPorFecha = ventas.reduce((acc, venta) => {
    const dateKey = getSaleDateKey(venta);

    if (!dateKey) {
      return acc;
    }

    const current = acc[dateKey] ?? { cantidad: 0, monto: 0 };

    acc[dateKey] = {
      cantidad: current.cantidad + 1,
      monto: current.monto + Number(venta.total ?? 0),
    };

    return acc;
  }, {});

  const fechasConVentas = Object.entries(ventasPorFecha).map(([dateKey, data]) => ({
    dateKey,
    ...data,
  }));

  if (!fechasConVentas.length) {
    return {
      menosVentas: "Sin ventas",
      masVentas: "Sin ventas",
    };
  }

  const ordenarPorMayor = (a, b) => {
    if (b.monto !== a.monto) {
      return b.monto - a.monto;
    }

    if (b.cantidad !== a.cantidad) {
      return b.cantidad - a.cantidad;
    }

    return a.dateKey.localeCompare(b.dateKey);
  };

  const ordenarPorMenor = (a, b) => {
    if (a.monto !== b.monto) {
      return a.monto - b.monto;
    }

    if (a.cantidad !== b.cantidad) {
      return a.cantidad - b.cantidad;
    }

    return a.dateKey.localeCompare(b.dateKey);
  };

  const formatDateWithDay = (dateKey) => {
    const date = parseLocalDate(dateKey);

    return `${WEEKDAY_NAMES[date.getDay()]} ${formatDisplayDate(dateKey)}`;
  };

  return {
    menosVentas: formatDateWithDay([...fechasConVentas].sort(ordenarPorMenor)[0].dateKey),
    masVentas: formatDateWithDay([...fechasConVentas].sort(ordenarPorMayor)[0].dateKey),
  };
};

const crearResumenDiarioHtml = ({ rango, reporte }) => {
  const productoMasVendido =
    obtenerProductoMasVendido(reporte.productos) ?? "Sin ventas";
  const productoMenosVendido =
    obtenerProductoMenosVendido(reporte.productos) ?? "Sin ventas";

  return `
    <section class="daily-report">
      <div class="daily-title">REPORTE DE VENTAS DIARIO</div>
      <div class="daily-row daily-date">
        <span>Fecha:</span>
        <strong>${escapeHtml(formatDisplayDate(rango.fechaInicio))}</strong>
      </div>
      <div class="daily-grid">
        <div class="daily-row">
          <span>Total de Ventas</span>
          <strong>${escapeHtml(formatReportCurrency(Number(reporte.resumen.montoTotal)))}</strong>
        </div>
        <div class="daily-row">
          <span>Cantidad de Ventas</span>
          <strong>${escapeHtml(reporte.resumen.totalVentas)}</strong>
        </div>
        <div class="daily-row">
          <span>Productos Vendidos</span>
          <strong>${escapeHtml(reporte.resumen.productosVendidos)}</strong>
        </div>
        <div class="daily-row">
          <span>Ganancia Estimada</span>
          <strong>No disponible</strong>
        </div>
      </div>
      <div class="daily-grid">
        <div class="daily-row">
          <span>Producto Mas Vendido</span>
          <strong>${escapeHtml(productoMasVendido)}</strong>
        </div>
        <div class="daily-row">
          <span>Producto Menos Vendido</span>
          <strong>${escapeHtml(productoMenosVendido)}</strong>
        </div>
      </div>
      <div class="daily-row">
        <span>Cliente Frecuente</span>
        <strong>Consumidor General</strong>
      </div>
    </section>
  `;
};

const crearResumenSemanalHtml = ({ rango, reporte }) => {
  const productoMasVendido =
    obtenerProductoMasVendido(reporte.productos) ?? "Sin ventas";
  const productoMenosVendido =
    obtenerProductoMenosVendido(reporte.productos) ?? "Sin ventas";
  const diasVentas = obtenerDiasVentas(reporte.ventas);

  return `
    <section class="period-report">
      <div class="period-title">REPORTE DE VENTAS SEMANAL</div>
      <div class="period-row period-date">
        <span>Semana:</span>
        <strong>${escapeHtml(formatWeeklyRange(rango))}</strong>
      </div>
      <div class="period-grid">
        <div class="period-row">
          <span>Total de Ventas</span>
          <strong>${escapeHtml(formatReportCurrency(Number(reporte.resumen.montoTotal)))}</strong>
        </div>
        <div class="period-row">
          <span>Cantidad de Ventas</span>
          <strong>${escapeHtml(reporte.resumen.totalVentas)}</strong>
        </div>
        <div class="period-row">
          <span>Productos Vendidos</span>
          <strong>${escapeHtml(reporte.resumen.productosVendidos)}</strong>
        </div>
        <div class="period-row">
          <span>Ganancia Estimada</span>
          <strong>No disponible</strong>
        </div>
      </div>
      <div class="period-grid">
        <div class="period-row">
          <span>Dia con Mas Ventas</span>
          <strong>${escapeHtml(diasVentas.masVentas)}</strong>
        </div>
        <div class="period-row">
          <span>Dia con Menos Ventas</span>
          <strong>${escapeHtml(diasVentas.menosVentas)}</strong>
        </div>
      </div>
      <div class="period-grid">
        <div class="period-row">
          <span>Producto Mas Vendido</span>
          <strong>${escapeHtml(productoMasVendido)}</strong>
        </div>
        <div class="period-row">
          <span>Producto Menos Vendido</span>
          <strong>${escapeHtml(productoMenosVendido)}</strong>
        </div>
      </div>
    </section>
  `;
};

const crearResumenMensualHtml = ({ rango, reporte }) => {
  const productoMasVendido =
    obtenerProductoMasVendido(reporte.productos) ?? "Sin ventas";
  const productoMenosVendido =
    obtenerProductoMenosVendido(reporte.productos) ?? "Sin ventas";
  const fechasVentas = obtenerFechasVentas(reporte.ventas);

  return `
    <section class="period-report">
      <div class="period-title">REPORTE DE VENTAS MENSUAL</div>
      <div class="period-row period-date">
        <span>Mes:</span>
        <strong>${escapeHtml(formatMonthLabel(rango))}</strong>
      </div>
      <div class="period-grid">
        <div class="period-row">
          <span>Total de Ventas</span>
          <strong>${escapeHtml(formatReportCurrency(Number(reporte.resumen.montoTotal)))}</strong>
        </div>
        <div class="period-row">
          <span>Cantidad de Ventas</span>
          <strong>${escapeHtml(reporte.resumen.totalVentas)}</strong>
        </div>
        <div class="period-row">
          <span>Productos Vendidos</span>
          <strong>${escapeHtml(reporte.resumen.productosVendidos)}</strong>
        </div>
        <div class="period-row">
          <span>Ganancia Estimada</span>
          <strong>No disponible</strong>
        </div>
      </div>
      <div class="period-grid">
        <div class="period-row">
          <span>Dia con Mas Ventas</span>
          <strong>${escapeHtml(fechasVentas.masVentas)}</strong>
        </div>
        <div class="period-row">
          <span>Dia con Menos Ventas</span>
          <strong>${escapeHtml(fechasVentas.menosVentas)}</strong>
        </div>
      </div>
      <div class="period-grid">
        <div class="period-row">
          <span>Producto Mas Vendido</span>
          <strong>${escapeHtml(productoMasVendido)}</strong>
        </div>
        <div class="period-row">
          <span>Producto Menos Vendido</span>
          <strong>${escapeHtml(productoMenosVendido)}</strong>
        </div>
      </div>
    </section>
  `;
};

const crearHtmlReporte = ({ periodo, rango, reporte }) => {
  const logoUri = Image.resolveAssetSource(LOGO_IMAGE)?.uri;
  const esReporteDiario = rango.fechaInicio === rango.fechaFin;
  const esReporteSemanal = periodo === "Semana";
  const esReporteMensual = periodo === "Mes";
  const productosRows = buildRows(
    reporte.productos,
    (producto, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(producto.producto_nombre)}</td>
        <td>${escapeHtml(producto.cantidad_base)} x ${escapeHtml(producto.unidad_base)}</td>
        <td class="money">${escapeHtml(formatCurrency(Number(producto.total_vendido)))}</td>
      </tr>
    `,
    "No hay productos vendidos en este periodo.",
    4,
  );

  const ventasRows = buildRows(
    reporte.ventas,
    (venta) => `
      <tr class="sale-row">
        <td>#${escapeHtml(venta.id)}</td>
        <td>${escapeHtml(venta.fecha)}</td>
        <td>${escapeHtml(venta.cantidad_productos)}</td>
        <td>${escapeHtml(venta.metodo_pago)}</td>
        <td class="money">${escapeHtml(formatCurrency(Number(venta.total)))}</td>
      </tr>
      <tr>
        <td colspan="5" class="sale-detail-cell">
          ${crearDetalleVentaHtml(venta.detalle)}
        </td>
      </tr>
    `,
    "No hay ventas registradas en este periodo.",
    5,
  );

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @page { margin: 24px; }
          body {
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
          }
          .header {
            background: #003B95;
            border-radius: 14px;
            color: #fff;
            min-height: 88px;
            padding: 22px;
            position: relative;
          }
          .header-content {
            padding-right: 108px;
          }
          .logo {
            background: #ffffff;
            border-radius: 18px;
            height: 76px;
            object-fit: contain;
            padding: 5px;
            position: absolute;
            right: 22px;
            top: 18px;
            width: 76px;
          }
          .brand {
            font-size: 30px;
            font-weight: 800;
            margin: 0;
          }
          .subtitle {
            color: #dbeafe;
            font-size: 13px;
            margin-top: 4px;
          }
          .period {
            font-size: 18px;
            font-weight: 700;
            margin-top: 16px;
          }
          .meta {
            color: #e0f2fe;
            font-size: 12px;
            margin-top: 4px;
          }
          .summary {
            display: table;
            margin: 18px 0;
            table-layout: fixed;
            width: 100%;
          }
          .daily-report,
          .period-report {
            border: 2px solid #003B95;
            border-radius: 14px;
            margin: 18px 0;
            overflow: hidden;
          }
          .daily-title,
          .period-title {
            background: #003B95;
            color: #ffffff;
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 0.4px;
            padding: 14px;
            text-align: center;
          }
          .daily-grid,
          .period-grid {
            border-top: 1px solid #bfdbfe;
          }
          .daily-row,
          .period-row {
            align-items: center;
            border-top: 1px solid #dbeafe;
            display: flex;
            font-size: 14px;
            justify-content: space-between;
            padding: 11px 14px;
          }
          .daily-title + .daily-row,
          .daily-grid .daily-row:first-child,
          .period-title + .period-row,
          .period-grid .period-row:first-child {
            border-top: 0;
          }
          .daily-date,
          .period-date {
            background: #f8fafc;
          }
          .daily-row span,
          .period-row span {
            color: #334155;
            font-weight: 800;
          }
          .daily-row strong,
          .period-row strong {
            color: #0f172a;
            font-weight: 900;
            text-align: right;
          }
          .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            display: table-cell;
            padding: 14px;
            width: 33%;
          }
          .summary-label {
            color: #64748b;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .summary-value {
            color: #003B95;
            font-size: 24px;
            font-weight: 800;
            margin-top: 6px;
          }
          h2 {
            font-size: 18px;
            margin: 24px 0 10px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th {
            background: #eaf2ff;
            color: #0f172a;
            font-size: 12px;
            text-align: left;
            text-transform: uppercase;
          }
          td, th {
            border-bottom: 1px solid #e2e8f0;
            padding: 10px 8px;
          }
          td {
            font-size: 13px;
          }
          .sale-row td {
            background: #f8fafc;
            font-weight: 800;
          }
          .sale-detail-cell {
            background: #ffffff;
            padding: 0 8px 14px;
          }
          .sale-detail-table {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            margin-top: 8px;
            overflow: hidden;
          }
          .sale-detail-table th {
            background: #f1f5f9;
            color: #334155;
            font-size: 10px;
          }
          .sale-detail-table td,
          .sale-detail-table th {
            padding: 8px;
          }
          .sale-detail-empty {
            background: #f8fafc;
            border: 1px dashed #cbd5e1;
            border-radius: 10px;
            color: #64748b;
            font-size: 12px;
            margin-top: 8px;
            padding: 10px;
          }
          .money {
            color: #0f8a45;
            font-weight: 800;
            text-align: right;
          }
          .empty {
            color: #64748b;
            font-style: italic;
            text-align: center;
          }
          .footer {
            color: #64748b;
            font-size: 11px;
            margin-top: 28px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <section class="header">
          ${logoUri ? `<img class="logo" src="${escapeHtml(logoUri)}" />` : ""}
          <div class="header-content">
            <h1 class="brand">StokMaster</h1>
            <div class="subtitle">Reporte de ventas</div>
            <div class="period">${escapeHtml(periodo)} - ${escapeHtml(rango.subtitulo)}</div>
            <div class="meta">Generado: ${escapeHtml(formatDateTime())}</div>
          </div>
        </section>

        ${esReporteDiario ? crearResumenDiarioHtml({ rango, reporte }) : ""}
        ${esReporteSemanal ? crearResumenSemanalHtml({ rango, reporte }) : ""}
        ${esReporteMensual ? crearResumenMensualHtml({ rango, reporte }) : ""}

        <section class="summary">
          <div class="summary-card">
            <div class="summary-label">Ventas</div>
            <div class="summary-value">${escapeHtml(reporte.resumen.totalVentas)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Productos</div>
            <div class="summary-value">${escapeHtml(reporte.resumen.productosVendidos)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Total vendido</div>
            <div class="summary-value">${escapeHtml(formatCurrency(reporte.resumen.montoTotal))}</div>
          </div>
        </section>

        <h2>Productos mas vendidos</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th class="money">Total</th>
            </tr>
          </thead>
          <tbody>${productosRows}</tbody>
        </table>

        <h2>Ventas del periodo</h2>
        <table>
          <thead>
            <tr>
              <th>Venta</th>
              <th>Fecha</th>
              <th>Productos</th>
              <th>Pago</th>
              <th class="money">Total</th>
            </tr>
          </thead>
          <tbody>${ventasRows}</tbody>
        </table>

        <div class="footer">StokMaster - Tu inventario, siempre bajo control</div>
      </body>
    </html>
  `;
};

export const exportarReporteVentasPdf = async ({ periodo, rango, reporte }) => {
  const html = crearHtmlReporte({ periodo, rango, reporte });
  const fileName = getReportFileName();
  const { base64, uri } = await Print.printToFileAsync({ base64: true, html });

  if (Platform.OS === "android" && FileSystem.StorageAccessFramework) {
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (!permissions.granted) {
      return null;
    }

    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      fileName,
      "application/pdf",
    );

    const pdfContent =
      base64 ??
      (await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      }));

    await FileSystem.StorageAccessFramework.writeAsStringAsync(
      fileUri,
      pdfContent,
      {
        encoding: FileSystem.EncodingType.Base64,
      },
    );

    return { fileName, uri: fileUri };
  }

  const namedUri = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.copyAsync({ from: uri, to: namedUri });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(namedUri, {
      dialogTitle: "Compartir reporte de ventas",
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
    });
  }

  return { fileName, uri: namedUri };
};
