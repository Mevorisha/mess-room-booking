import { fbRtdbGetRef } from "./init.js";
import { get, set, update, remove, onValue } from "firebase/database";
import ErrorMessages from "../errors/ErrorMessages.js";

/**
 * @param {string} path - Path in the database to listen for changes
 * @param {(newData: any) => void} callback - Callback function to run when data changes
 */
export function onDbContentChange(path, callback) {
  const dbRef = fbRtdbGetRef(path);
  const unsubscribe = onValue(
    dbRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback(null);
      }
    },
    (error) => console.error(path, error.toString())
  );
  return unsubscribe;
}

/**
 * Create (set) data in the Realtime Database
 * @param {string} path - Path in the database to create data
 * @param {object} data - Data to set in the database
 * @returns {Promise<void>}
 */
async function fbRtdbCreate(path, data) {
  try {
    const dbRef = fbRtdbGetRef(path);
    await set(dbRef, data);
    return Promise.resolve();
  } catch (error) {
    console.error(path, error.toString());
    return Promise.reject(ErrorMessages.DATA_WRITE_FAILED);
  }
}

/**
 * Read data from the Realtime Database
 * @param {string} path - Path in the database to read data
 * @returns {Promise}
 */
async function fbRtdbRead(path) {
  try {
    const dbRef = fbRtdbGetRef(path);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      return Promise.resolve(snapshot.val());
    } else {
      return Promise.resolve(null);
    }
  } catch (error) {
    console.error(path, error.toString());
    return Promise.reject(ErrorMessages.DATA_READ_FAILED);
  }
}

/**
 * Update specific fields in the Realtime Database
 * @param {string} path - Path in the database to read data
 * @param {object} data - Data to update in the database
 * @returns {Promise<void>}
 */
async function fbRtdbUpdate(path, data) {
  try {
    const dbRef = fbRtdbGetRef(path);
    await update(dbRef, data);
    return Promise.resolve();
  } catch (error) {
    console.error(path, error.toString());
    return Promise.reject(ErrorMessages.DATA_UPDATE_FAILED);
  }
}

/**
 * Delete data from the Realtime Database
 * @param {string} path - Path in the database to delete data
 * @returns {Promise<void>}
 */
async function fbRtdbDelete(path) {
  try {
    const dbRef = fbRtdbGetRef(path);
    await remove(dbRef);
    return Promise.resolve();
  } catch (error) {
    console.error(path, error.toString());
    return Promise.reject(ErrorMessages.DATA_DELETE_FAILED);
  }
}

// Export these functions so you can use them in other <script type="module">
export { fbRtdbCreate, fbRtdbRead, fbRtdbUpdate, fbRtdbDelete };
