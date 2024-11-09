import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthStateEnum } from "../../contexts/auth.js";
import { EmailPasswdAuth, GoogleAuth } from "../../modules/firebase/auth.js";
import { checkForEasterEgg } from "../../modules/util/easterEggs.js";
import { PageUrls } from "../../modules/util/pageUrls.js";
import useAuth from "../../hooks/auth.js";
import useNotification from "../../hooks/notification.js";
import LoadingPage from "../Loading/index.jsx";
import ButtonText from "../../components/ButtonText";

// @ts-ignore
import dpMevorisha from "../../assets/images/dpMevorisha.png";
import "./styles.css";

// write a auth page that has 2 tabs: login and register and also 2=3 buttons "Sign in with Google", "Sign in with Apple", "Sign in with Microsoft"
export default function Auth() {
  const [showSection, setShowSection] = React.useState(
    /** @type {"login" | "register" | "resetPasswd"} */ ("login")
  );

  const auth = useAuth();
  const navigate = useNavigate();
  const notify = useNotification();

  useEffect(() => {
    if (auth.state === AuthStateEnum.LOGGED_IN) {
      navigate(PageUrls.ROOT);
    }
  }, [auth.state, navigate]);

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   * @param {"EMAIL_LOGIN" | "EMAIL_REGISTER" | "EMAIL_RESET_PASSWD"} kind
   */
  function handleSubmit(e, kind) {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;
    const confirmPassword = e.target[2]?.value;

    let waitForEasterEggTime = 0;

    const easterEggsInEmail = checkForEasterEgg(email);
    if (easterEggsInEmail) {
      notify(easterEggsInEmail, "warning");
      waitForEasterEggTime = 4000;
    } else {
      const easterEggsInPassword = checkForEasterEgg(password);
      if (easterEggsInPassword) {
        notify(easterEggsInPassword, "warning");
        waitForEasterEggTime = 4000;
      }
    }

    const timeout = setTimeout(() => {
      switch (kind) {
        case "EMAIL_LOGIN":
          EmailPasswdAuth.login(email, password).catch((e) => notify(e.toString(), "error")
          );
          break;
        case "EMAIL_REGISTER":
          if (password === confirmPassword) {
            EmailPasswdAuth.register(email, password).catch((e) => notify(e.toString(), "error")
            );
          } else {
            notify("Passwords do not match", "error");
          }
          break;
        case "EMAIL_RESET_PASSWD":
          EmailPasswdAuth.requestPasswordReset(email)
            .then(() => notify("Check your email for password reset link", "success")
            )
            .catch((e) => notify(e.toString(), "error"));
          break;
        default:
          break;
      }
    }, waitForEasterEggTime);

    return () => clearTimeout(timeout);
  }

  if (auth.state === "LOGGED_IN") return <LoadingPage />;

  return (
    <div className="pages-Auth">
      <span>
        <img className="logo" src={dpMevorisha} alt="logo" />
      </span>
      <span>
        <h1>Mevorisha</h1>
      </span>
      <span>
        <h2>Mess Booking App</h2>
      </span>
      <div className="container">
        <div className="button-container">
          <ButtonText
            title="Login"
            onclick={() => setShowSection("login")}
            rounded="all"
            kind={
              showSection === "login" || showSection === "resetPasswd"
                ? "primary"
                : "cannibalized"
            }
            width="50%"
          />
          <ButtonText
            title="Register"
            onclick={() => setShowSection("register")}
            rounded="all"
            kind={showSection === "register" ? "primary" : "cannibalized"}
            width="50%"
          />
        </div>
        {
          /* login form */
          showSection === "login" ? (
            <form
              className="form-container"
              onSubmit={(e) => handleSubmit(e, "EMAIL_LOGIN")}
            >
              <input required type="email" placeholder="Email" />
              <input required type="password" placeholder="Password" />
              <span
                className="reset-passwd-link"
                onClick={() => setShowSection("resetPasswd")}
              >
                Reset password
              </span>
              <div className="submit-container">
                <ButtonText title="Login" rounded="all" width="50%" />
              </div>
            </form>
          ) : /* registration form */
          showSection === "register" ? (
            <form
              className="form-container"
              onSubmit={(e) => handleSubmit(e, "EMAIL_REGISTER")}
            >
              <input required type="email" placeholder="Email" />
              <input required type="password" placeholder="Password" />
              <input required type="password" placeholder="Confirm Password" />
              <div className="submit-container">
                <ButtonText title="Register" rounded="all" width="50%" />
              </div>
            </form>
          ) : (
            /* reset password form */
            <form
              className="form-container"
              onSubmit={(e) => handleSubmit(e, "EMAIL_RESET_PASSWD")}
            >
              <input required type="email" placeholder="Email" />
              <p style={{ fontSize: "0.9rem", textAlign: "justify" }}>
                If the email exists in our database, you will receive a password
                reset link. If you don't receive an email, try again or contact
                us at{" "}
                <a href="mailto:mevorisha@gmail.com" target="_blank" rel="noreferrer">
                  mevorisha@gmail.com
                </a>
                .
              </p>
              <div className="submit-container">
                <ButtonText title="Reset Password" rounded="all" width="50%" />
              </div>
            </form>
          )
        }
        {/* implement login with Google, Apple & Microsoft */}
        <div className="oauth-container">
          <div
            className="oauth-button"
            onClick={() =>
              GoogleAuth.login().catch((e) => notify(e.toString(), "error"))
            }
          >
            <img
              style={{
                height: "26px",
                paddingTop: "0.5px",
                paddingLeft: "1px",
              }}
              src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
              alt="google"
            />
          </div>
          <div
            className="oauth-button"
            onClick={() =>
              notify("Apple Sign In is not implemented yet", "error")
            }
          >
            <img
              style={{ height: "24px", paddingBottom: "1.5px" }}
              src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
              alt="apple"
            />
          </div>
          <div
            className="oauth-button"
            onClick={() =>
              notify("Microsoft Sign In is not implemented yet", "error")
            }
          >
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
