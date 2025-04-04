/**
 * Determines whether a value is considered empty.
 *
 * A value is deemed empty if it is either undefined (using "void 0"), null, an empty string (""), or the string "EMPTY".
 *
 * @param {*} value - The value to evaluate.
 * @returns {boolean} True if the value is empty; otherwise, false.
 */
export function isEmpty(value) {
  return value === void 0 || value === null || value === "" || value === "EMPTY";
}
