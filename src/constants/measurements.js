export const MEASUREMENT_TYPES = [
  {
    baseLabel: "unidad",
    description: "Productos contables por pieza, caja o docena.",
    id: "unidad",
    label: "Unidad",
  },
  {
    baseLabel: "1/2 litro",
    description: "Liquidos vendidos como aceite, leche o refresco.",
    id: "volumen",
    label: "Volumen",
  },
  {
    baseLabel: "1/2 libra",
    description: "Productos vendidos por peso como arroz o azucar.",
    id: "peso",
    label: "Peso",
  },
];

export const PRESENTATION_OPTIONS = {
  unidad: [
    { baseUnits: 1, id: "unidad", label: "Unidad" },
    { baseUnits: 6, id: "media_docena", label: "Media docena" },
    { baseUnits: 12, id: "docena", label: "Docena" },
    { baseUnits: 24, id: "caja_24", label: "Caja de 24" },
  ],
  volumen: [
    { baseUnits: 1, id: "medio_litro", label: "1/2 litro" },
    { baseUnits: 2, id: "litro", label: "1 litro" },
    { baseUnits: 4, id: "dos_litros", label: "2 litros" },
  ],
  peso: [
    { baseUnits: 1, id: "media_libra", label: "1/2 libra" },
    { baseUnits: 2, id: "libra", label: "1 libra" },
    { baseUnits: 50, id: "arroba", label: "Arroba" },
    { baseUnits: 200, id: "quintal", label: "Quintal" },
  ],
};

export const getMeasurementType = (typeId) =>
  MEASUREMENT_TYPES.find((type) => type.id === typeId);

export const getPresentationOptions = (typeId) =>
  PRESENTATION_OPTIONS[typeId] ?? [];

export const getPresentation = (typeId, presentationId) =>
  getPresentationOptions(typeId).find(
    (presentation) => presentation.id === presentationId,
  );

export const formatCurrency = (value) =>
  `C$ ${Number.isFinite(value) ? value.toFixed(2) : "0.00"}`;

export const formatBaseQuantity = (quantity, baseLabel) =>
  `${quantity} x ${baseLabel}`;
