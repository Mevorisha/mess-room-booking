/**
 * Check if the value is empty
 * @param {any} value
 * @returns {boolean}
 */
export function isEmpty(value) {
  return (
    value === undefined || value === null || value === "" || value === "EMPTY"
  );
}
