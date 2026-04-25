export function matchesAdminSearch(query: string, values: Array<string | number | boolean | null | undefined>) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return true;

  return values.some((value) => {
    if (value === null || value === undefined) return false;

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value).toLowerCase() === normalizedQuery;
    }

    return value.toLowerCase().includes(normalizedQuery);
  });
}
