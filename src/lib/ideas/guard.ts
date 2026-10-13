import { AREAS, type Area, type Focus } from "./types";

const BANNED =
  /\b(pago|pagos|pagar|transferencia|transferencias|transferir|banco|bancaria|bancario|bancarios|tarjeta|cripto|bitcoin|wallet|monedero|prestamo|préstamo|préstamos|cobrar|cobro|cobros|factura|facturas|divisa|divisas|inversion|inversión|inversiones|fintech|remesa|remesas|spei|clabe|nomina|nómina|hipoteca|hipotecario|credito|crédito|créditos|debito|débito|cajero|paypal|stripe|dinero|efectivo|cuota|cuotas)\b/i;

export function norm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isBanned(text: string): boolean {
  return BANNED.test(text);
}

export function ideaText(parts: {
  title: string;
  forWhom: string;
  problem: string;
  description: string;
  steps: string[];
}): string {
  return [parts.title, parts.forWhom, parts.problem, parts.description, ...parts.steps].join("\n");
}

export function isArea(value: string): value is Area {
  return AREAS.some((area) => area.id === value);
}

export function isFocus(value: string): value is Focus {
  return value === "cotidiano" || value === "procesos";
}
