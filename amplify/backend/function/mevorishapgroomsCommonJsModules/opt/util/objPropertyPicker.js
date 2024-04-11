/**
 * @param {Object} obj 
 * @param {string[]} keys 
 * @returns 
 */
function objPropertyPicker(obj, keys) {
  return keys.reduce((acc, key) => {
    if (obj[key]) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}

module.exports = objPropertyPicker;
