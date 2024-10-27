import { fbRtdbGetRef, RtDbPaths } from "./init.js";
import { get, set, update, remove } from "firebase/database";
import { logError } from "./util.js";
import ErrorMessages from "../errors/ErrorMessages.js";

/**
 * Create (set) data in the Realtime Database
 * @param {RtDbPaths} subdb - Sub-database in the Realtime Database
 * @param {string} path - Path in the database to create data
 * @param {object} data - Data to set in the database
 * @returns {Promise<void>}
 */
async function fbRtdbCreate(subdb, path, data) {
  try {
    const dbRef = fbRtdbGetRef(subdb, path);
    await set(dbRef, data);
    return Promise.resolve();
  } catch (error) {
    const fullpath = `${subdb}/${path}`;
    console.error(error.toString());
    await logError("rtdb_create", fullpath, error.code);
    return Promise.reject(ErrorMessages.DATA_WRITE_FAILED);
  }
}

/**
 * Read data from the Realtime Database
 * @param {RtDbPaths} subdb - Sub-database in the Realtime Database
 * @param {string} path - Path in the database to read data
 * @returns {Promise}
 */
async function fbRtdbRead(subdb, path) {
  try {
    const dbRef = fbRtdbGetRef(subdb, path);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      return Promise.resolve(snapshot.val());
    } else {
      return Promise.resolve(null);
    }
  } catch (error) {
    const fullpath = `${subdb}/${path}`;
    console.error(error.toString());
    await logError("rtdb_read", fullpath, error.code);
    return Promise.reject(ErrorMessages.DATA_READ_FAILED);
  }
}

/**
 * Update specific fields in the Realtime Database
 * @param {RtDbPaths} subpath - Sub-database in the Realtime Database
 * @param {string} path - Path in the database to read data
 * @param {object} data - Data to update in the database
 * @returns {Promise<void>}
 */
async function fbRtdbUpdate(subpath, path, data) {
  try {
    const dbRef = fbRtdbGetRef(subpath, path);
    await update(dbRef, data);
    return Promise.resolve();
  } catch (error) {
    const fullpath = `${subpath}/${path}`;
    console.error(error.toString());
    await logError("rtdb_update", fullpath, error.code);
    return Promise.reject(ErrorMessages.DATA_UPDATE_FAILED);
  }
}

/**
 * Delete data from the Realtime Database
 * @param {RtDbPaths} subpath - Sub-database in the Realtime Database
 * @param {string} path - Path in the database to delete data
 * @returns {Promise<void>}
 */
async function fbRtdbDelete(subpath, path) {
  try {
    const dbRef = fbRtdbGetRef(subpath, path);
    await remove(dbRef);
    return Promise.resolve();
  } catch (error) {
    const fullpath = `${subpath}/${path}`;
    console.error(error.toString());
    await logError("rtdb_delete", fullpath, error.code);
    return Promise.reject(ErrorMessages.DATA_DELETE_FAILED);
  }
}

// Export these functions so you can use them in other <script type="module">
export { fbRtdbCreate, fbRtdbRead, fbRtdbUpdate, fbRtdbDelete };
