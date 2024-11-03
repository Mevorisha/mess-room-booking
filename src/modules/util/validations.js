/**
 * Checks if value is (undefined), (null), ("") or ("EMPTY").
 * @param {any} value
 * @returns {boolean}
 */
export function isEmpty(value) {
  return (
    value === undefined || value === null || value === "" || value === "EMPTY"
  );
}
