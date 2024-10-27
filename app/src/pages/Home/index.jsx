import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RtDbPaths } from "../../modules/firebase/init.js";
import { fbRtdbUpdate } from "../../modules/firebase/db.js";
import { AuthState, User } from "../../contexts/auth";
import useAuth from "../../hooks/auth.js";
import useNotification from "../../hooks/notification.js";
import ButtonText from "../../components/ButtonText";

import "./styles.css";

/**
 * @param {{ user: User }} props
 */
function SelectInitialType({ user }) {
  const [accountType, setAccountType] = useState(
    /** @type {"TENANT" | "OWNER" | "EMPTY"} */ ("EMPTY")
  );

  const notify = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if ("EMPTY" === accountType) return;
    // write the account type to the database
    fbRtdbUpdate(RtDbPaths.IDENTITY, `${user.uid}/`, {
      type: accountType,
    }).catch((e) => notify(e.toString(), "error"));
  }, [user.type, accountType]);

  return (
    <div className="pages-Home">
      <div className="select-type-container">
        <h1>Choose your type</h1>
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
  const { state: authState, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authState === AuthState.STILL_LOADING) navigate("/");
  }, [authState, navigate]);

  if (authState === AuthState.STILL_LOADING) return null;
  if (user.type === "EMPTY") return <SelectInitialType user={user} />;

  return user.type === "TENANT" ? (
    <HomeForTenant user={user} />
  ) : (
    <HomeForOwner user={user} />
  );
}
