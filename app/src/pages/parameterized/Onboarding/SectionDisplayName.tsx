import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageType } from "@/modules/util/pageUrls.js";
import { isEmpty } from "@/modules/util/validations.js";

import useCompositeUser from "@/hooks/compositeUser.js";
import useNotification from "@/hooks/notification.js";

import ButtonText from "@/components/ButtonText";
import { lang } from "@/modules/util/language.js";

export default function SetDisplayName(): React.ReactNode {
  const compUsr = useCompositeUser();
  const notify = useNotification();
  const navigate = useNavigate();

  const [buttonKind, setButtonKind] = useState<"primary" | "loading">("primary");

  function handleUpdateName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = e.target as unknown as { value: string | null }[];
    const firstName = target[0]?.value as string | null;
    const lastName = target[1]?.value as string | null;

    if (firstName != null && lastName != null)
      Promise.resolve()
        .then(() => setButtonKind("loading"))
        .then(() => compUsr.profileCtx.updateProfileName(firstName, lastName))
        .then(() => setButtonKind("primary"))
        .then(() => navigate(PageType.HOME))
        .catch((e: Error) => {
          setButtonKind("primary");
          notify(e, "error");
        });
    else notify("Please enter a valid name", "error");
  }

  return (
    <div className="pages-Onboarding">
      <div className="onboarding-container">
        <h1>{lang("Set Display Name", "ডিসপ্লে নাম সেট করুন", "डिस्प्ले नाम सेट करें")}</h1>
        <h4>{lang("Name can be changed later", "নাম পরে পরিবর্তন করা যেতে পারে", "नाम बाद में बदला जा सकता है")}</h4>
        <div className="desc">
          <p>
            {lang(
              "Name is required for identification and allows your room " +
                (compUsr.userCtx.user.type === "TENANT" ? "owner" : "tenant") +
                " to address you.",
              "পরিচিতির জন্য নাম প্রয়োজন এবং আপনার রুম " +
                (compUsr.userCtx.user.type === "TENANT" ? "মালিক" : "ভাড়াটে") +
                " আপনাকে সম্বোধন করতে পারবে।",
              "पहचान के लिए नाम आवश्यक है और आपके कमरे का " +
                (compUsr.userCtx.user.type === "TENANT" ? "मालिक" : "किरायेदार") +
                " आपको संबोधित कर सकेगा।"
            )}
          </p>
        </div>

        <form className="form-container" onSubmit={handleUpdateName}>
          <input
            required
            type="text"
            name="firstName"
            placeholder="First Name"
            defaultValue={isEmpty(compUsr.userCtx.user.firstName) ? "" : compUsr.userCtx.user.firstName}
          />
          <input
            required
            type="text"
            name="lastName"
            placeholder="Last Name"
            defaultValue={isEmpty(compUsr.userCtx.user.lastName) ? "" : compUsr.userCtx.user.lastName}
          />
          <div className="submit-container">
            <ButtonText width="40%" rounded="all" title="Update Name" kind={buttonKind} />
          </div>
        </form>
      </div>
    </div>
  );
}
