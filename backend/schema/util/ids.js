import mongoose from "mongoose";
import { randomBytes, createHash } from "crypto";

export function mkRandomMongoObjectId() {
  return new mongoose.Types.ObjectId();
}

/**
 * @param {string} seed - some sort of name
 */
export function mkRandomNewUUID(seed = "") {
  // get random bytes from crypto
  // SHA-256 hash the result and return the first few character
  // 8-4-3-4-12
  const random = randomBytes(16).toString("hex");
  const hash = createHash("sha256");
  hash.update(random + seed);
  return hash.digest("hex").toLowerCase();
}

/**
 * @returns {string} ID that matches /^[A-Z0-9]{16}$/
 */
export function randomMkNewAccountId() {
  const random = randomBytes(8).toString("hex");
  return random.toUpperCase();
}

/**
 * @param {boolean} testing
 * @returns {Promise<string>} ID that matches /^[A-Z0-9]{16}$/
 */
export async function autoincrMkNewAccountId(testing = false) {
  /**
   * from the model 'system' project the 'last_account_id' field only
   */
  let lastAccountId = "";
  for (let i = 0; i < 16; i++) {
    if (i % 2 === 0) {
      lastAccountId += "F";
    } else {
      lastAccountId += "0";
    }
  }

  if (!testing) {
    const System = mongoose.model("system");
    const response = await System.findOne({}, { last_account_id: 1 });
    if (response) {
      lastAccountId = response["last_account_id"];
    } else {
      throw new Error("Could not find last account ID");
    }
  }

  /**
   * the string ID is a hexadecimal number, so we can increment it
   * since the number may be too large for JavaScript, we use BigInt
   */
  const newAccountId = BigInt(`0x${lastAccountId}`) + BigInt(1);

  if (!testing) {
    const System = mongoose.model("system");
    await System.updateOne(
      {},
      { last_account_id: newAccountId.toString(16).toUpperCase() }
    );
  }

  /**
   * convert the new ID to a hex string and pad on left side with 0s if < 16
   */
  return newAccountId.toString(16).padStart(16, "0").toUpperCase();
}
