const env = require("./env");
const { createDate, DateUnits } = require("./createDate");

/**
 * @return {Date}
 */
function defaultExpiration() {
  return createDate(env.DEFAULT_ENTITY_EXPIRATION_TIME_YEARS, DateUnits.YRS);
}

module.exports = defaultExpiration;
