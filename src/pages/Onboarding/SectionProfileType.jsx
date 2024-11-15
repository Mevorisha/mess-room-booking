import React from "react";
import { useNavigate } from "react-router-dom";
import { PageUrls } from "../../modules/util/pageUrls.js";
import useAuth from "../../hooks/auth.js";
import useNotification from "../../hooks/notification.js";
import ButtonText from "../../components/ButtonText";

export default function SelectInitialType() {
  const auth = useAuth();
  const notify = useNotification();
  const navigate = useNavigate();

  /**
   * @param {"TENANT" | "OWNER"} type
   */
  function handleSubmit(type) {
    auth
      .updateProfileType(type)
      .then(() => navigate(PageUrls.HOME))
      .catch((e) => notify(e.toString(), "error"));
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

        <ButtonText
          rounded="all"
          title="Tenant"
          kind="primary"
          onClick={() => handleSubmit("TENANT")}
        />
        <ButtonText
          rounded="all"
          title="Owner"
          kind="primary"
          onClick={() => handleSubmit("OWNER")}
        />
      </div>
    </div>
  );
}
