import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthState, User } from "../../contexts/auth";
import useAuth from "../../hooks/auth.js";
import ButtonText from "../../components/ButtonText";

import "./styles.css";

/**
 * @param {{ auth: {
 *   state: AuthState;
 *   user: User;
 *   updateUserDetailsInDb: (type: "TENANT" | "OWNER" | "EMPTY", photoURL: string) => void;
 * } }} props
 */
function SelectInitialType({ auth }) {
  const [accountType, setAccountType] = useState(
    /** @type {"TENANT" | "OWNER" | "EMPTY"} */ ("EMPTY")
  );

  useEffect(() => {
    if ("EMPTY" === accountType) return;
    // write the account type to the database
    auth.updateUserDetailsInDb(accountType, auth.user.photoURL);
  }, [auth.user.type, accountType]);

  return (
    <div className="pages-Home">
      <div className="select-type-container">
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
          onclick={() => setAccountType("TENANT")}
        />
        <ButtonText
          rounded="all"
          title="Owner"
          kind="primary"
          onclick={() => setAccountType("OWNER")}
        />
      </div>
    </div>
  );
}

/**
 * @param {{ user: User }} props
 */
function HomeForTenant({ user }) {
  return (
    <div className="pages-Home">
      <div className="topbar"></div>
      <div className="content-container">
        <div className="contents">
          <ul className="content-list">
            <li className="content-item"></li>
            <li className="content-item"></li>
            <li className="content-item"></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{ user: User }} props
 */
function HomeForOwner({ user }) {
  return (
    <div className="pages-Home">
      <div className="topbar"></div>
      <div className="content-container">
        <div className="contents">
          <ul className="content-list">
            <li className="content-item"></li>
            <li className="content-item"></li>
            <li className="content-item"></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.state === AuthState.STILL_LOADING) navigate("/");
  }, [auth.state, navigate]);

  if (auth.state === AuthState.STILL_LOADING) return null;
  if (auth.user.type === "EMPTY") return <SelectInitialType auth={auth} />;

  return auth.user.type === "TENANT" ? (
    <HomeForTenant user={auth.user} />
  ) : (
    <HomeForOwner user={auth.user} />
  );
}
