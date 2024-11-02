import { fbRtdbGetRef } from "./init.js";
import { get, set, update, remove, onValue } from "firebase/database";
import ErrorMessages from "../errors/ErrorMessages.js";

/**
 * @param {import("./init.js").RtDbPaths} subdb - Sub-database in the Realtime Database
 * @param {string} path - Path in the database to listen for changes
 * @param {(newData: any) => void} callback - Callback function to run when data changes
 */
export function onDbContentChange(subdb, path, callback) {
  const dbRef = fbRtdbGetRef(subdb, path);
  const unsubscribe = onValue(
    dbRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback(null);
      }
    },
    (error) => {
      const fullpath = `${subdb}/${path}`;
      console.error(fullpath, error.toString());
    }
  );
  return unsubscribe;
}

/**
 * Create (set) data in the Realtime Database
 * @param {import("./init.js").RtDbPaths} subdb - Sub-database in the Realtime Database
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
    console.error(fullpath, error.toString());
    return Promise.reject(ErrorMessages.DATA_WRITE_FAILED);
  }
}

/**
 * Read data from the Realtime Database
 * @param {import("./init.js").RtDbPaths} subdb - Sub-database in the Realtime Database
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
    console.error(fullpath, error.toString());
    return Promise.reject(ErrorMessages.DATA_READ_FAILED);
  }
}

/**
 * Update specific fields in the Realtime Database
 * @param {import("./init.js").RtDbPaths} subdb - Sub-database in the Realtime Database
 * @param {string} path - Path in the database to read data
 * @param {object} data - Data to update in the database
 * @returns {Promise<void>}
 */
async function fbRtdbUpdate(subdb, path, data) {
  try {
    const dbRef = fbRtdbGetRef(subdb, path);
    await update(dbRef, data);
    return Promise.resolve();
  } catch (error) {
    const fullpath = `${subdb}/${path}`;
    console.error(fullpath, error.toString());
    return Promise.reject(ErrorMessages.DATA_UPDATE_FAILED);
  }
}

/**
 * Delete data from the Realtime Database
 * @param {import("./init.js").RtDbPaths} subdb - Sub-database in the Realtime Database
 * @param {string} path - Path in the database to delete data
 * @returns {Promise<void>}
 */
async function fbRtdbDelete(subdb, path) {
  try {
    const dbRef = fbRtdbGetRef(subdb, path);
    await remove(dbRef);
    return Promise.resolve();
  } catch (error) {
    const fullpath = `${subdb}/${path}`;
    console.error(fullpath, error.toString());
    return Promise.reject(ErrorMessages.DATA_DELETE_FAILED);
  }
}

// Export these functions so you can use them in other <script type="module">
export { fbRtdbCreate, fbRtdbRead, fbRtdbUpdate, fbRtdbDelete };
