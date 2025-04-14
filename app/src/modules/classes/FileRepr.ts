export default class FileRepr {
  #file: File | null = null;
  #uri: string | null = null;

  constructor(fileRepr: File | string) {
    if (fileRepr instanceof File) {
      this.#file = fileRepr;
      this.#uri = null;
    }
    if (typeof fileRepr === "string") {
      this.#uri = fileRepr;
      this.#file = null;
    }
  }

  static from(fileRepr: File | string): FileRepr {
    return new FileRepr(fileRepr);
  }

  isUri(): boolean {
    return typeof this.#uri === "string";
  }

  isFile(): boolean {
    return this.#file instanceof File;
  }

  /**
   * @throws {Error} if not a file
   */
  getFile(): File {
    if (this.isFile()) {
      return this.#file as File;
    }
    throw new Error("FileRepr is not a File");
  }

  /**
   * @throws {Error} if not a uri
   */
  getUri(): string {
    if (this.isUri()) {
      return this.#uri as string;
    }
    throw new Error("FileRepr is not a URI");
  }

  toString(): string {
    if (this.isFile()) {
      const file = this.#file as File;
      return `[object File <"${file.name}">]`;
    }
    return this.#uri as string;
  }

  /**
   * This method is called when the object is converted to a primitive value.
   * It is used to provide a string representation of the object.
   * Used (for some reason) by StringySet<T> to compare objects.
   */
  [Symbol.toPrimitive](_hint: "number" | "string" | "default"): string | number {
    return this.toString();
  }
}
