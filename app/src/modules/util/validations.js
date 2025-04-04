/**
 * Determines whether the provided value is considered empty.
 *
 * A value is empty if it is strictly equal to undefined, null, an empty string (""), or the string "EMPTY".
 *
 * @param {*} value The value to be evaluated.
 * @returns {boolean} True if the value is empty, otherwise false.
 */
export function isEmpty(value) {
  return value === void 0 || value === null || value === "" || value === "EMPTY";
}
