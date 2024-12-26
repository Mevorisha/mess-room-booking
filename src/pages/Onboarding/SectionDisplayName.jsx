import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageUrls } from "../../modules/util/pageUrls.js";
import { isEmpty } from "../../modules/util/validations.js";
import useUsrCompositeCtx from "../../hooks/compositeUser.js";
import useNotification from "../../hooks/notification.js";
import ButtonText from "../../components/ButtonText";

/**
 * @returns {React.JSX.Element}
 */
export default function SetDisplayName() {
  const compUsrCtx = useUsrCompositeCtx();
  const notify = useNotification();
  const navigate = useNavigate();

  const [buttonKind, setButtonKind] = useState(
    /** @type {"primary" | "loading"} */ ("primary")
  );

  function handleUpdateName(e) {
    e.preventDefault();

    /** @type {string} */
    const firstName = e.target[0]?.value;
    /** @type {string} */
    const lastName = e.target[1]?.value;

    if (firstName && lastName)
      Promise.resolve()
        .then(() => setButtonKind("loading"))
        .then(() =>
          compUsrCtx.profileCtx.updateProfileName(firstName, lastName)
        )
        .then(() => setButtonKind("primary"))
        .then(() => navigate(PageUrls.HOME))
        .catch((e) => {
          setButtonKind("primary");
          notify(e, "error");
        });
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
            {compUsrCtx.userCtx.user.type === "TENANT" ? "owner" : "tenant"} to
            address you.
          </p>
        </div>

        <form className="form-container" onSubmit={handleUpdateName}>
          <input
            required
            type="text"
            name="firstName"
            placeholder="First Name"
            defaultValue={
              isEmpty(compUsrCtx.userCtx.user.firstName)
                ? ""
                : compUsrCtx.userCtx.user.firstName
            }
          />
          <input
            required
            type="text"
            name="lastName"
            placeholder="Last Name"
            defaultValue={
              1 && isEmpty(compUsrCtx.userCtx.user.lastName)
                ? ""
                : compUsrCtx.userCtx.user.lastName
            }
          />
          <div className="submit-container">
            <ButtonText
              width="40%"
              rounded="all"
              title="Update Name"
              kind={buttonKind}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
