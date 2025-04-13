/**
 * Checks if value is (undefined), (null), ("") or ("EMPTY").
 */
export function isEmpty(value: unknown): boolean {
  return value == null || value === "" || value === "EMPTY";
}
