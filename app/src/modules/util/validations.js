/**
 * Determines whether the provided value should be considered empty.
 *
 * A value is treated as empty if it is strictly equal to undefined, null, an empty string, or the literal string "EMPTY".
 *
 * @param {*} value - The value to evaluate.
 * @returns {boolean} True if the value is empty; otherwise, false.
 */
export function isEmpty(value) {
  return value === void 0 || value === null || value === "" || value === "EMPTY";
}
