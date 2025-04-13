import React, { useState, createContext, useCallback, useContext } from "react";
import UserContext from "./user.jsx";
import { ApiPaths, apiPostOrPatchJson } from "@/modules/util/api.js";
import useNotification from "@/hooks/notification.js";

export interface LanguageContextType {
  lang: "ENGLISH" | "BANGLA" | "HINDI";
  setLang: (val: "ENGLISH" | "BANGLA" | "HINDI", updateRemote?: boolean) => void;
}

const LangContext = createContext<LanguageContextType>({
  lang: (window.localStorage.getItem("lang") ?? "ENGLISH") as "ENGLISH" | "BANGLA" | "HINDI",
  setLang: () => void 0,
});

export default LangContext;

/* ------------------------------------ LANG PROVIDER COMPONENT ----------------------------------- */

export function LanguageProvider({ children }: { children: React.JSX.Element }): React.JSX.Element {
  const {
    user: { uid },
  } = useContext(UserContext);
  const notify = useNotification();

  const [lang, _setLang] = useState((): "ENGLISH" | "BANGLA" | "HINDI" => {
    const newLangSt = (window.localStorage.getItem("lang") ?? "ENGLISH") as "ENGLISH" | "BANGLA" | "HINDI";
    return newLangSt;
  });

  const setLang = useCallback(
    (newVal: "ENGLISH" | "BANGLA" | "HINDI", updateRemote = true) =>
      _setLang((oldVal) => {
        window.localStorage.setItem("lang", newVal);
        if (updateRemote) {
          apiPostOrPatchJson("PATCH", ApiPaths.Profile.updateLanguage(uid), { language: newVal })
            .then(() => {
              // ensure all modules are reloaded with the new language value
              if (oldVal !== newVal) window.location.href = "/";
            })
            .catch((e: Error) => notify(e, "error"));
        }
        return newVal;
      }),
    [_setLang, notify, uid]
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
