import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageUrls } from "../../../modules/util/pageUrls.js";

import LanguageContext from "../../../contexts/language.js";
import useNotification from "../../../hooks/notification.js";

import ButtonText from "../../../components/ButtonText";

/**
 * @returns {React.JSX.Element}
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
      .then(() =>
        setButtonKind((oldKind) => ({ ...oldKind, [type]: "loading" }))
      )
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
        <h1>Choose Language</h1>
        <h4>Language can be changed later</h4>

        <div className="desc">
          <p>Choose a language to get started.</p>
          <p>
            {" একটি ভাষা নির্বাচন করুন।"}
            <br />
            {" एक भाषा चयन करें।"}
          </p>
        </div>

        <ButtonText
          rounded="all"
          title="English"
          kind={buttonKind.ENGLISH}
          onClick={() => handleSubmit("ENGLISH")}
        />
        <ButtonText
          rounded="all"
          title="বাংলা"
          kind={buttonKind.BANGLA}
          onClick={() => handleSubmit("BANGLA")}
        />
        <ButtonText
          rounded="all"
          title="हिंदी"
          kind={buttonKind.HINDI}
          onClick={() => handleSubmit("HINDI")}
        />
      </div>
    </div>
  );
}
