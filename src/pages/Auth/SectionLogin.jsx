import React from "react";
import { EmailPasswdAuth } from "../../modules/firebase/auth.js";
import { checkForEasterEgg } from "../../modules/util/easterEggs.js";
import useNotification from "../../hooks/notification.js";
import ButtonText from "../../components/ButtonText";

export default function LoginSection({ setShowSection }) {
  const notify = useNotification();
  const [buttonKind, setButtonKind] = React.useState(
    /** @type {"primary" | "loading"} */ ("primary")
  );

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  function handleSubmit(e) {
    e.preventDefault();

    const email = e.target[0].value;
    const password = e.target[1].value;

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

    return setTimeout(
      () =>
        Promise.resolve()
          .then(() => setButtonKind("loading"))
          .then(() => EmailPasswdAuth.login(email, password))
          .then(() => setButtonKind("primary"))
          .catch((e) => {
            notify(e.toString(), "error");
            setButtonKind("primary");
          }),
      waitForEasterEggTime
    );
  }

  return (
    <form className="form-container" onSubmit={(e) => handleSubmit(e)}>
      <input required type="email" placeholder="Email" />
      <input required type="password" placeholder="Password" />
      <span
        className="reset-passwd-link"
        onClick={() => setShowSection("resetPasswd")}
      >
        Reset password
      </span>
      <div className="submit-container">
        <ButtonText
          title="Log In"
          rounded="all"
          width="50%"
          kind={buttonKind}
        />
      </div>
    </form>
  );
}
