/**
 * @param {string} englishTxt
 * @param {string} banglaTxt
 * @param {string} hindiTxt
 * @returns {string}
 */
export function lang(englishTxt, banglaTxt, hindiTxt) {
  const lang = window.localStorage.getItem("lang");
  if (lang === "ENGLISH") return englishTxt;
  if (lang === "BANGLA") return banglaTxt;
  if (lang === "HINDI") return hindiTxt;
  return englishTxt;
}

export function getLang() {
  return window.localStorage.getItem("lang") || "ENGLISH";
}
