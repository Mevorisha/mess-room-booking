import React from "react";
import { EmailPasswdAuth, GoogleAuth } from "../../modules/firebase/auth.js";
import ButtonText from "../../components/ButtonText";
import useNotification from "../../hooks/notification.js";

// @ts-ignore
import dpMevorisha from "../../assets/images/dpMevorisha.png";
import "./styles.css";
import { checkForEasterEgg } from "../../modules/util/easterEggs.js";

// write a auth page that has 2 tabs: login and register and also 2=3 buttons "Sign in with Google", "Sign in with Apple", "Sign in with Microsoft"
export default function Auth() {
  /**
   * @type {["login" | "register", React.Dispatch<React.SetStateAction<"login" | "register">>]}
   */
  const [showSection, setShowSection] = React.useState(
    /** @type {"login" | "register"} */ ("login")
  );

  const notify = useNotification();

  /**
   * @param {"EMAIL_LOGIN" | "EMAIL_REGISTER"} kind
   */
  const handleSubmit = (e, kind) => {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;
    const confirmPassword = e.target[2]?.value;

    const easterEggsInEmail = checkForEasterEgg(email);
    if (easterEggsInEmail) {
      notify(easterEggsInEmail, "warning");
    } else {
      const easterEggsInPassword = checkForEasterEgg(password);
      if (easterEggsInPassword) {
        notify(easterEggsInPassword, "warning");
      }
    }

    switch (kind) {
      case "EMAIL_LOGIN":
        EmailPasswdAuth.login(email, password).catch((e) =>
          notify(e.toString(), "error")
        );
        break;
      case "EMAIL_REGISTER":
        if (password === confirmPassword) {
          EmailPasswdAuth.register(email, password).catch((e) =>
            notify(e.toString(), "error")
          );
        } else {
          notify("Passwords do not match", "error");
        }
        break;
      default:
        break;
    }
  };

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
            kind={showSection === "login" ? "primary" : "cannibalized"}
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
        {showSection === "login" ? (
          <form
            className="form-container"
            onSubmit={(e) => handleSubmit(e, "EMAIL_LOGIN")}
          >
            <input required type="email" placeholder="Email" />
            <input required type="password" placeholder="Password" />
            <div className="submit-container">
              <ButtonText title="Login" rounded="all" width="50%" />
            </div>
          </form>
        ) : (
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
        )}
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
