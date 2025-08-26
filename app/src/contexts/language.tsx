import React, { useState, createContext, useCallback, useContext } from "react";
import UserContext from "./user.jsx";
import { ApiPaths, apiPostOrPatchJson } from "@/modules/util/api.js";
import useNotification from "@/hooks/notification.js";
import { HttpMethodTypes, Language, ProfilePatchReqBodyDTO } from "sharedtypes";
import { getLangNotNull } from "@/modules/util/language.js";

export interface LanguageContextType {
  lang: Language;
  setLang: (val: Language, updateRemote?: boolean) => void;
}

const LangContext = createContext<LanguageContextType>({
  lang: getLangNotNull(),
  setLang: () => void 0,
});

export default LangContext;

/* ------------------------------------ LANG PROVIDER COMPONENT ----------------------------------- */

export function LanguageProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  const {
    user: { uid },
  } = useContext(UserContext);
  const notify = useNotification();

  const [lang, _setLang] = useState(getLangNotNull);

  const setLang = useCallback(
    (newVal: Language, updateRemote = true) =>
      _setLang((oldVal) => {
        window.localStorage.setItem("lang", newVal);
        if (updateRemote) {
          apiPostOrPatchJson(HttpMethodTypes.PATCH, ApiPaths.Profile.updateLanguage(uid), ProfilePatchReqBodyDTO.Language.create({ language: newVal })) // prettier-ignore
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

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}
