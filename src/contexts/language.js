import React, { useState, createContext, useCallback } from "react";

const LangContext = createContext({
  lang: /** @type {"ENGLISH" | "BANGLA" | "HINDI"} */ (
    window.localStorage.getItem("lang") || "ENGLISH"
  ),
  setLang: /** @type {(val: "ENGLISH" | "BANGLA" | "HINDI") => void} */ (
    () => {}
  ),
});

export default LangContext;

/* ------------------------------------ LANG PROVIDER COMPONENT ----------------------------------- */

/**
 * @param {{ children: any }} props
 * @returns {React.JSX.Element}
 */
export function LanguageProvider({ children }) {
  const [lang, _setLang] = useState(
    /** @type {() => "ENGLISH" | "BANGLA" | "HINDI"} */ (
      () => {
        const newLangSt = window.localStorage.getItem("lang") || "ENGLISH";
        window.localStorage.setItem("lang", newLangSt);
        return newLangSt;
      }
    )
  );

  const setLang = useCallback(
    /**
     * @param {"ENGLISH" | "BANGLA" | "HINDI"} newVal
     */
    (newVal) =>
      _setLang((oldVal) => {
        window.localStorage.setItem("lang", newVal);
        // ensure all modules are reloaded with the new language value
        if (oldVal !== newVal) window.location.reload();
        return newVal;
      }),
    [_setLang]
  );

  return (
    <LangContext.Provider
      value={{
        lang,
        setLang,
      }}
    >
      {children}
    </LangContext.Provider>
  );
}
