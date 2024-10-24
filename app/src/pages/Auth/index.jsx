import React from "react";
import "./styles.css";

// write a auth page that has 2 tabs: login and register and also 2=3 buttons "Sign in with Google", "Sign in with Apple", "Sign in with Microsoft"
export default function Auth() {
  /**
   * @type {["login" | "register", React.Dispatch<React.SetStateAction<"login" | "register">>]}
   */
  const [showSection, setShowSection] = React.useState(
    /** @type {"login" | "register"} */ ("login")
  );

  return (
    <div className="Auth-page">
      <div className="Auth-container">

      </div>
    </div>
  );
}
