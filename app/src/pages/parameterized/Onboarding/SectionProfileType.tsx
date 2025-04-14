import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageType } from "@/modules/util/pageUrls.js";

import useCompositeUser from "@/hooks/compositeUser.js";
import useNotification from "@/hooks/notification.js";

import ButtonText from "@/components/ButtonText";
import { IdentityType } from "@/modules/networkTypes/Identity";

export default function SetProfileType(): React.ReactNode {
  const compUsr = useCompositeUser();
  const notify = useNotification();
  const navigate = useNavigate();

  const [buttonKind, setButtonKind] = useState<Record<IdentityType, "secondary" | "loading">>({
    TENANT: "secondary",
    OWNER: "secondary",
  });

  function handleSubmit(type: IdentityType) {
    Promise.resolve()
      .then(() => setButtonKind((oldKind) => ({ ...oldKind, [type]: "loading" })))
      .then(() => compUsr.profileCtx.updateProfileType(type))
      .then(() => setButtonKind({ TENANT: "secondary", OWNER: "secondary" }))
      .then(() => navigate(PageType.HOME))
      .catch((e: Error) => notify(e, "error"));
  }

  return (
    <div className="pages-Onboarding">
      <div className="onboarding-container">
        <h1>Choose Profile Type</h1>
        <h4>Profile type can be changed later</h4>

        <div className="desc">
          <p>If you are going to stay in a room, select Tenant.</p>
          <p> If you are the owner giving a room for rent select Owner.</p>
        </div>

        <ButtonText rounded="all" title="Tenant" kind={buttonKind.TENANT} onClick={() => handleSubmit("TENANT")} />
        <ButtonText rounded="all" title="Owner" kind={buttonKind.OWNER} onClick={() => handleSubmit("OWNER")} />
      </div>
    </div>
  );
}
