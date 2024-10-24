import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn } from "../../modules/firebase/auth.js";
import "./styles.css";
import useNotification from "../../hooks/notification.js";

// write a auth page that has 2 tabs: login and register and also 2=3 buttons "Sign in with Google", "Sign in with Apple", "Sign in with Microsoft"
export default function Auth() {
  /**
   * @type {["login" | "register", React.Dispatch<React.SetStateAction<"login" | "register">>]}
   */
  const [showSection, setShowSection] = React.useState(
    /** @type {"login" | "register"} */ ("login")
  );

  const navigate = useNavigate();
  const notify = useNotification();

  // check if user is logged in
  useEffect(() => {
    isLoggedIn()
      .then(() => navigate("/home"))
      .catch(() => {
        navigate("/auth");
        notify("You are not logged in", "warning");
      });
  }, [navigate, notify]);

  return (
    <div className="Auth-page">
      <div className="Auth-container"></div>
    </div>
  );
}
