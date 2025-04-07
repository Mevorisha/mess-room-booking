export default class FileRepr {
  /**
   * @param {File | string} fileRepr
   */
  constructor(fileRepr) {
    if (fileRepr instanceof File) {
      this.file = fileRepr;
      this.uri = null;
    }
    if (typeof fileRepr === "string") {
      this.uri = fileRepr;
      this.file = null;
    }
  }

  /**
   * @param {File | string} fileRepr
   * @returns {FileRepr}
   */
  static from(fileRepr) {
    return new FileRepr(fileRepr);
  }

  isUri() {
    return this.uri !== null;
  }

  isFile() {
    return this.file !== null;
  }

  /**
   * @throws {Error} if not a file
   * @returns {File} The file object.
   */
  getFile() {
    if (this.isFile()) {
      return this.file;
    }
    throw new Error("FileRepr is not a File");
  }

  /**
   * @throws {Error} if not a uri
   * @returns {string} The URI string.
   */
  getUri() {
    if (this.isUri()) {
      return this.uri;
    }
    throw new Error("FileRepr is not a URI");
  }

  toString() {
    if (this.isFile()) {
      return `[object File <"${this.file.name}">]`;
    }
    return this.uri;
  }

  /**
   * This method is called when the object is converted to a primitive value.
   * It is used to provide a string representation of the object.
   * Used (for some reason) by StringySet<T> to compare objects.
   * @param {"number" | "string" | "default"} hint
   * @returns {string} The string representation of the object.
   */
  [Symbol.toPrimitive](hint) {
    return this.toString();
  }
}
