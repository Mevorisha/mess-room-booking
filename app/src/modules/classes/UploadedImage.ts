import { lang } from "../util/language";

/**
 * @class
 */
export default class UploadedImage {
  #filename: string;
  #small: string;
  #medium: string;
  #large: string;
  #isPrivate: boolean;

  /**
   * @param {string} filename
   * @param {string} smallImageURL
   * @param {string} mediumImageURL
   * @param {string} largeImageURL
   * @param {boolean} isPrivate
   */
  constructor(
    filename: string,
    smallImageURL: string,
    mediumImageURL: string,
    largeImageURL: string,
    isPrivate: boolean
  ) {
    this.#filename = filename;
    this.#small = smallImageURL;
    this.#medium = mediumImageURL;
    this.#large = largeImageURL;
    this.#isPrivate = isPrivate;
  }

  static from(
    filename: string,
    data: { small: string; medium: string; large: string } | null,
    isPrivate: boolean
  ): UploadedImage {
    if (data == null) {
      throw new Error(lang("Invalid UploadedImage data", "অবৈধ আপলোড করা ছবি ডেটা", "अवैध अपलोड की गई छवि डेटा"));
    }
    return new UploadedImage(filename, data.small, data.medium, data.large, isPrivate);
  }

  clone(): UploadedImage {
    return new UploadedImage(this.#filename, this.#small, this.#medium, this.#large, this.#isPrivate);
  }

  makePrivate(): this {
    this.#isPrivate = true;
    return this;
  }

  makePublic(): this {
    this.#isPrivate = false;
    return this;
  }

  /** @enum {30 | 90 | 500} */
  static Sizes = {
    SMALL: /**  @type {30}  */ 30,
    MEDIUM: /** @type {90}  */ 90,
    LARGE: /**  @type {500} */ 500,
  };

  get small(): string {
    return this.#small;
  }

  get medium(): string {
    return this.#medium;
  }

  get large(): string {
    return this.#large;
  }

  toString(): string {
    return JSON.stringify({
      filename: this.#filename,
      small: this.#small,
      medium: this.#medium,
      large: this.#large,
      isPrivate: this.#isPrivate,
    });
  }
}
