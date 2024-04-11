/**
 * @enum {string}
 */
const DateUnits = {
  MS: "ms",
  SEC: "s",
  MIN: "min",
  HRS: "hrs",
  DAYS: "d",
  MONTHS: "m",
  YRS: "yrs",
};

/**
 * @typedef {"ms" | "s" | "min" | "hrs" | "d" | "m" | "yrs" | string} DateUnit
 */

/**
 *
 * @param {number} mag
 * @param {DateUnit} unit
 */
function createDate(mag, unit) {
  const date = Date.now();
  let offset = 0;

  switch (unit) {
    case DateUnits.MS:
      offset = mag;
      break;
    case DateUnits.SEC:
      offset = mag * 1000;
      break;
    case DateUnits.MIN:
      offset = mag * 60 * 1000;
      break;
    case DateUnits.HRS:
      offset = mag * 60 * 60 * 1000;
      break;
    case DateUnits.DAYS:
      offset = mag * 24 * 60 * 60 * 1000;
      break;
    case DateUnits.MONTHS:
      offset = mag * 30 * 24 * 60 * 60 * 1000;
      break;
    case DateUnits.YRS:
      offset = mag * 365 * 24 * 60 * 60 * 1000;
      break;
    default:
      throw new Error("Invalid date unit");
  }

  return new Date(date + offset);
}

module.exports = {
  createDate,
  DateUnits,
};
