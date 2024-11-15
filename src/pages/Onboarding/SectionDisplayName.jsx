import React from "react";
import { useNavigate } from "react-router-dom";
import { PageUrls } from "../../modules/util/pageUrls.js";
import { isEmpty } from "../../modules/util/validations.js";
import useAuth from "../../hooks/auth.js";
import useNotification from "../../hooks/notification.js";
import ButtonText from "../../components/ButtonText";

export default function SetDisplayName() {
  const auth = useAuth();
  const notify = useNotification();
  const navigate = useNavigate();

  function handleUpdateName(e) {
    e.preventDefault();

    /** @type {string} */
    const firstName = e.target[0]?.value;
    /** @type {string} */
    const lastName = e.target[1]?.value;

    if (firstName && lastName)
      auth
        .updateProfileName(firstName, lastName)
        .then(() => navigate(PageUrls.HOME))
        .catch((e) => notify(e.toString(), "error"));
    else notify("Please enter a valid name", "error");
  }

  return (
    <div className="pages-Onboarding">
      <div className="onboarding-container">
        <h1>Set Display Name</h1>
        <h4>Name can be changed later</h4>

        <div className="desc">
          <p>
            Name is required for identification and allows your room{" "}
            {auth.user.type === "TENANT" ? "owner" : "tenant"} to address you.
          </p>
        </div>

        <form className="form-container" onSubmit={handleUpdateName}>
          <input
            required
            type="text"
            name="firstName"
            placeholder="First Name"
            defaultValue={
              isEmpty(auth.user.firstName) ? "" : auth.user.firstName
            }
          />
          <input
            required
            type="text"
            name="lastName"
            placeholder="Last Name"
            defaultValue={
              1 && isEmpty(auth.user.lastName) ? "" : auth.user.lastName
            }
          />
          <div className="submit-container">
            <ButtonText
              width="40%"
              rounded="all"
              title="Update Name"
              kind="primary"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
