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

const crearHtmlReporte = ({ periodo, rango, reporte }) => {
  const logoUri = Image.resolveAssetSource(LOGO_IMAGE)?.uri;
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
