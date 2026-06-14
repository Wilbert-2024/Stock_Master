export function formatUtcSaleTimestamp(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
}

export function parseSaleDateTime(value) {
  if (!value) {
    return null;
  }

  const rawValue = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return new Date(`${rawValue}T12:00:00`);
  }

  const isoValue = rawValue.includes("T")
    ? rawValue
    : rawValue.replace(" ", "T");
  const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(isoValue);
  const date = new Date(hasTimezone ? isoValue : `${isoValue}Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatLocalDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatLocalSaleDateTime(value) {
  const date = parseSaleDateTime(value);

  if (!date) {
    return value || "Sin fecha";
  }

  return `${formatLocalDateKey(date)} ${String(date.getHours()).padStart(
    2,
    "0",
  )}:${String(date.getMinutes()).padStart(2, "0")}:${String(
    date.getSeconds(),
  ).padStart(2, "0")}`;
}
