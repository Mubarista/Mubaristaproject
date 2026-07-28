// Utility functions for converting between camelCase and snake_case

export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z0-9])/g, "$1_$2")
    .replace(/([0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

export function toCamelCase(str: string): string {
  return str.replace(/_([a-zA-Z0-9])/g, (_, letter) => letter.toUpperCase());
}

export function keysToSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toSnakeCase(key)] = value;
  }
  return result;
}

export function keysToCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toCamelCase(key)] = value;
  }
  return result;
}

export function mapKeysToCamelCase(data: any): any {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(keysToCamelCase);
  if (typeof data === "object") return keysToCamelCase(data);
  return data;
}

export function mapKeysToSnakeCase(data: any): any {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(keysToSnakeCase);
  if (typeof data === "object") return keysToSnakeCase(data);
  return data;
}
