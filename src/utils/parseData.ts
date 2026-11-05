export function parseStringToData<T = unknown>(data: string): T {
  if (data === "") return data as T;
  if (/^-?\d+n$/.test(data)) return BigInt(data.slice(0, -1)) as T;
  if (/^-?\d+$/.test(data)) {
    const integer = Number(data);
    return (Number.isSafeInteger(integer) ? integer : BigInt(data)) as T;
  }
  if (data === "null") return null as T;
  if (data === "undefined") return undefined as T;
  if (data === "true" || data === "false") return (data === "true") as T;

  const numeric = Number(data);
  if (data.trim() !== "" && Number.isFinite(numeric)) return numeric as T;

  try {
    return JSON.parse(data) as T;
  } catch {
    return data as T;
  }
}
