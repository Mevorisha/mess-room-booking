import IClone from "../interfaces/IClone.js";
import IMongoosable from "../interfaces/IMongoosable.js";
import DataError from "../errors/DataError.js";
import { enforceInterfaceStaticMembers } from "../util/classes.js";

/**
type Address {
  geoloc_lat number  valid(-90, 90)   // Latitude
  geoloc_lon number  valid(-180, 180) // Longitude
  houseno    string? valid(none)      // Flat, Floor, House No, etc
  landmark   string? valid(none)      // Nearby landmark
  street     string? valid(none)      // Street name, Locality, etc
  city       string  valid(none)      // City name
  pincode    string  valid(/^\d{6}$/) // Postal code
} */

/**
 * @implements {IClone}
 * @implements {IMongoosable}
 */
export default class Address {
  /**
   * Create an Address.
   * @param {number} geoloc_lat - The latitude of the address.
   * @param {number} geoloc_long - The longitude of the address.
   * @param {string|null} houseno - The house number of the address.
   * @param {string|null} landmark - The landmark near the address.
   * @param {string|null} street - The street of the address.
   * @param {string} city - The city of the address.
   * @param {string} pincode - The pincode of the address.
   * @throws Will throw an error if the latitude is not between -90 and 90.
   * @throws Will throw an error if the longitude is not between -180 and 180.
   * @throws Will throw an error if the city is empty.
   * @throws Will throw an error if the pincode is empty.
   */
  constructor(
    geoloc_lat,
    geoloc_long,
    houseno,
    landmark,
    street,
    city,
    pincode
  ) {
    if (geoloc_lat < -90 || geoloc_lat > 90) {
      throw new DataError("Invalid latitude", 400, "invalid_latitude");
    }
    if (geoloc_long < -180 || geoloc_long > 180) {
      throw new DataError("Invalid longitude", 400, "invalid_longitude");
    }
    if (city === "") {
      throw new DataError("City cannot be empty", 400, "empty_city");
    }
    if (pincode === "") {
      throw new DataError("Pincode cannot be empty", 400, "empty_pincode");
    }
    if (!/\d{6}/.test(pincode)) {
      throw new DataError("Invalid pincode", 400, "invalid_pincode");
    }

    /** @type {number} */
    this.geoloc_lat = geoloc_lat;
    /** @type {number} */
    this.geoloc_long = geoloc_long;
    /** @type {string|null} */
    this.houseno = houseno;
    /** @type {string|null} */
    this.landmark = landmark;
    /** @type {string|null} */
    this.street = street;
    /** @type {string} */
    this.city = city;
    /** @type {string} */
    this.pincode = pincode;
  }

  /**
   * @static
   */
  static getMongoSchema() {
    return {
      geoloc_lat: {
        type: Number,
        required: true,
        validate: {
          validator: (v) => v >= -90 && v <= 90,
          message: "Latitude must be between -90 and 90",
        },
      },
      geoloc_long: {
        type: Number,
        required: true,
        validate: {
          validator: (v) => v >= -180 && v <= 180,
          message: "Longitude must be between -180 and 180",
        },
      },
      houseno: {
        type: String,
        required: false,
      },
      landmark: {
        type: String,
        required: false,
      },
      street: {
        type: String,
        required: false,
      },
      city: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
        validate: {
          validator: (v) => /\d{6}/.test(v),
          message: "Invalid pincode",
        },
      },
    };
  }

  /**
   * @static
   * @param {Object} mongoObject - The data to convert from a MongoDB object.
   */
  static fromMongoObject(mongoObject) {
    if (!mongoObject) {
      throw new Error("Invalid mongoObject");
    }

    return new Address(
      mongoObject.geoloc_lat,
      mongoObject.geoloc_long,
      mongoObject.houseno,
      mongoObject.landmark,
      mongoObject.street,
      mongoObject.city,
      mongoObject.pincode
    );
  }

  /**
   * @static
   * @param {Address} data - The data to convert to a MongoDB object.
   */
  static toMongoObject(data) {
    return {
      geoloc_lat: data.geoloc_lat,
      geoloc_long: data.geoloc_long,
      houseno: data.houseno,
      landmark: data.landmark,
      street: data.street,
      city: data.city,
      pincode: data.pincode,
    };
  }

  clone() {
    return new Address(
      this.geoloc_lat,
      this.geoloc_long,
      this.houseno,
      this.landmark,
      this.street,
      this.city,
      this.pincode
    );
  }
}

enforceInterfaceStaticMembers(Address, IClone);
enforceInterfaceStaticMembers(Address, IMongoosable);
