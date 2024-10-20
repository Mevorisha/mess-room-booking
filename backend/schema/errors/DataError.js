export default class DataError extends Error {
  /**
   * @param {string} message - The error message.
   * @param {number} status - The HTTP status code.
   * @param {string} code - The error code.
   */
  constructor(message, status, code) {
    super(message);
    this.status = status;
  }
}
