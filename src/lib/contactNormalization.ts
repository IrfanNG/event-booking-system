export function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

export function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\D/g, "");
}

export function isValidEmail(value: unknown): boolean {
  const normalizedEmail = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
}

export function isValidLookupPhone(value: unknown): boolean {
  return normalizePhone(value).length >= 7;
}
