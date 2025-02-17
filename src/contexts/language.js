import React, { useState, createContext, useCallback } from "react";

const LangContext = createContext({
  lang: /** @type {"ENGLISH" | "BANGLA" | "HINDI"} */ ("ENGLISH"),
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
        const storedLang = window.localStorage.getItem("lang");
        const newLangSt = storedLang || "ENGLISH";
        window.localStorage.setItem("lang", newLangSt);
        return newLangSt;
      }
    )
  );

  const setLang = useCallback(
    /**
     * @param {"ENGLISH" | "BANGLA" | "HINDI"} newVal
     */
    (newVal) => {
      _setLang(newVal);
      window.localStorage.setItem("lang", newVal);
      // ensure all modules are reloaded with the new language value
      window.location.reload();
    },
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
