import React from "react";
import useCompositeUser from "../../hooks/compositeUser";

import "./styles.css";

/**
 * @returns {React.JSX.Element}
 */
export default function Profile() {
  const compUsr = useCompositeUser();

  return (
    <div className="pages-Profile">
      <div className="container">
        <h1>
          {compUsr.userCtx.user.type === "OWNER" ? "Owner" : "Tenant"} Profile
        </h1>
        <h4>Profile details will be visible publicly.</h4>
        <div className="desc">
          <p>
            Documents like work or institution identity card and aadhaar card
            may be used by you room owner to verify your identity.
          </p>
        </div>
      </div>
    </div>
  );
}
