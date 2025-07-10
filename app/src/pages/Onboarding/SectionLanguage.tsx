import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageType } from "@/modules/util/pageUrls.js";

import LanguageContext from "@/contexts/language.jsx";
import useNotification from "@/hooks/notification.js";

import ButtonText from "@/components/ButtonText";
import { lang } from "@/modules/util/language.js";
import { Language } from "@/modules/networkTypes/Identity";

export default function SetLanguage(): React.ReactNode {
  const langCtx = useContext(LanguageContext);
  const notify = useNotification();
  const navigate = useNavigate();

  type LangBtnKind = "secondary" | "loading";

  const [btnKind, setButtonKind] = useState<Record<Language, LangBtnKind>>({
    ENGLISH: "secondary",
    BANGLA: "secondary",
    HINDI: "secondary",
  });

  function handleSubmit(type: Language) {
    Promise.resolve()
      .then(() => setButtonKind((oldKind) => ({ ...oldKind, [type]: "loading" })))
      .then(() => langCtx.setLang(type))
      .then(() =>
        setButtonKind({
          ENGLISH: "secondary",
          BANGLA: "secondary",
          HINDI: "secondary",
        })
      )
      .then(() => navigate(PageType.HOME))
      .catch((e: Error) => notify(e, "error"));
  }

  return (
    <div className="pages-Onboarding">
      <div className="onboarding-container">
        <h1>{lang("Choose Language", "ভাষা নির্বাচন করুন", "भाषा चुनें")}</h1>
        <h4>
          {lang("Language can be changed later", "ভাষা পরে পরিবর্তন করা যেতে পারে", "भाषा बाद में बदली जा सकती है")}
        </h4>

        <div className="desc">
          <p>Choose a language to get started.</p>
          <p>
            {" একটি ভাষা নির্বাচন করুন।"}
            <br />
            {" एक भाषा चयन करें।"}
          </p>
        </div>

        <ButtonText rounded="all" title="English" kind={btnKind["ENGLISH"]} onClick={() => handleSubmit("ENGLISH")} />
        <ButtonText rounded="all" title="বাংলা" kind={btnKind["BANGLA"]} onClick={() => handleSubmit("BANGLA")} />
        <ButtonText rounded="all" title="हिंदी" kind={btnKind["HINDI"]} onClick={() => handleSubmit("HINDI")} />
      </div>
    </div>
  );
}
