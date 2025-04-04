import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageUrls } from "@/modules/util/pageUrls.js";

import LanguageContext from "@/contexts/language.jsx";
import useNotification from "@/hooks/notification.js";

import ButtonText from "@/components/ButtonText";
import { lang } from "@/modules/util/language.js";

/**
 * Renders a language selection page for setting the user's profile language.
 *
 * This component displays a localized interface that allows users to choose between English, Bangla, and Hindi.
 * When a language is selected, it updates the language context, displays a loading state on the selected button,
 * resets the button states, and navigates to the home page. Any errors encountered trigger a notification.
 *
 * @returns {React.JSX.Element} The language selection interface.
 */
export default function SetProfileType() {
  const langCtx = useContext(LanguageContext);
  const notify = useNotification();
  const navigate = useNavigate();

  const [buttonKind, setButtonKind] = useState({
    ENGLISH: /** @type {"secondary" | "loading"} */ ("secondary"),
    BANGLA: /**  @type {"secondary" | "loading"} */ ("secondary"),
    HINDI: /**  @type {"secondary" | "loading"} */ ("secondary"),
  });

  /**
   * @param {"ENGLISH" | "BANGLA" | "HINDI"} type
   */
  function handleSubmit(type) {
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
      .then(() => navigate(PageUrls.HOME))
      .catch((e) => notify(e, "error"));
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

        <ButtonText rounded="all" title="English" kind={buttonKind.ENGLISH} onClick={() => handleSubmit("ENGLISH")} />
        <ButtonText rounded="all" title="বাংলা" kind={buttonKind.BANGLA} onClick={() => handleSubmit("BANGLA")} />
        <ButtonText rounded="all" title="हिंदी" kind={buttonKind.HINDI} onClick={() => handleSubmit("HINDI")} />
      </div>
    </div>
  );
}
