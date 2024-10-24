import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  isLoggedIn,
  EmailPasswdAuth,
  GoogleAuth,
  AppleAuth,
  MicrosoftAuth,
} from "../../modules/firebase/auth.js";
import useNotification from "../../hooks/notification.js";
import ButtonText from "../../components/ButtonText";
import "./styles.css";

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

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  return (
    <div className="Auth-page">
      <div className="Auth-container">
        <div className="button-container">
          <ButtonText
            title="Login"
            onclick={() => setShowSection("login")}
            rounded="left"
            kind={showSection === "login" ? "primary" : "secondary"}
            width="50%"
          />
          <ButtonText
            title="Register"
            onclick={() => setShowSection("register")}
            rounded="right"
            kind={showSection === "register" ? "primary" : "secondary"}
            width="50%"
          />
        </div>
        {showSection === "login" ? (
          <form className="form-container">
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              required
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="submit-container">
              <ButtonText
                title="Login"
                rounded="all"
                width="50%"
                onclick={(e) => {
                  e.preventDefault();
                  EmailPasswdAuth.login(email, password);
                }}
              />
            </div>
          </form>
        ) : (
          <form className="form-container">
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              required
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              required
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <div className="submit-container">
              <ButtonText
                title="Register"
                rounded="all"
                width="50%"
                onclick={(e) => {
                  e.preventDefault();
                  if (password === confirmPassword) {
                    EmailPasswdAuth.register(email, password);
                  } else {
                    notify("Passwords do not match", "error");
                    console.error("Passwords do not match");
                  }
                }}
              />
            </div>
          </form>
        )}
        {/* implement login with Google, Apple & Microsoft */}
        <div className="oauth-container">
          <div className="oauth-button" onClick={GoogleAuth.login}>
            <img
              style={{ paddingLeft: "1px" }}
              src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
              alt="google"
            />
          </div>
          <div className="oauth-button" onClick={AppleAuth.login}>
            <img
              style={{ height: "27px", paddingBottom: "1.5px" }}
              src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
              alt="apple"
            />
          </div>
          <div className="oauth-button" onClick={MicrosoftAuth.login}>
            <img
              style={{ height: "24px" }}
              src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
              alt="microsoft"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
