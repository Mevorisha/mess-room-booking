import React, { useState, createContext, useCallback, useContext } from "react";
import UserContext from "./user.js";
import { ApiPaths, apiPostOrPatchJson } from "../modules/util/api";
import useNotification from "../hooks/notification";

const LangContext = createContext({
  lang: /** @type {"ENGLISH" | "BANGLA" | "HINDI"} */ (window.localStorage.getItem("lang") || "ENGLISH"),
  setLang: /** @type {(val: "ENGLISH" | "BANGLA" | "HINDI", updateRemote?: boolean) => void} */ (() => {}),
});

export default LangContext;

/* ------------------------------------ LANG PROVIDER COMPONENT ----------------------------------- */

/**
 * @param {{ children: any }} props
 * @returns {React.JSX.Element}
 */
export function LanguageProvider({ children }) {
  const {
    user: { uid },
  } = useContext(UserContext);
  const notify = useNotification();

  const [lang, _setLang] = useState(
    /** @type {() => "ENGLISH" | "BANGLA" | "HINDI"} */ (
      () => {
        const newLangSt = window.localStorage.getItem("lang") || "ENGLISH";
        return newLangSt;
      }
    )
  );

  const setLang = useCallback(
    /**
     * @param {"ENGLISH" | "BANGLA" | "HINDI"} newVal
     * @param {boolean} [updateRemote]
     */
    (newVal, updateRemote = true) =>
      _setLang((oldVal) => {
        window.localStorage.setItem("lang", newVal);
        if (updateRemote) {
          apiPostOrPatchJson("PATCH", ApiPaths.Profile.updateLanguage(uid), { language: newVal }).catch((e) =>
            notify(e, "error")
          );
        }
        // ensure all modules are reloaded with the new language value
        if (oldVal !== newVal) window.location.href = "/";
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
