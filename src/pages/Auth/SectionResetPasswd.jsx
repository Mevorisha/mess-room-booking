import React from "react";
import { EmailPasswdAuth } from "../../modules/firebase/auth.js";
import { checkForEasterEgg } from "../../modules/util/easterEggs.js";
import useNotification from "../../hooks/notification.js";
import ButtonText from "../../components/ButtonText";

export default function ResetPasswdSection() {
  const notify = useNotification();

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

    return setTimeout(() => {
      EmailPasswdAuth.requestPasswordReset(email)
        .then(() =>
          notify("Check your email for password reset link", "success")
        )
        .catch((e) => notify(e.toString(), "error"));
    }, waitForEasterEggTime);
  }

  return (
    <form className="form-container" onSubmit={(e) => handleSubmit(e)}>
      <input required type="email" placeholder="Email" />
      <p style={{ fontSize: "0.9rem", textAlign: "justify" }}>
        If the email exists in our database, you will receive a password reset
        link. If you don't receive an email, try again or contact us at{" "}
        <a href="mailto:mevorisha@gmail.com" target="_blank" rel="noreferrer">
          mevorisha@gmail.com
        </a>
        .
      </p>
      <div className="submit-container">
        <ButtonText title="Reset Password" rounded="all" width="50%" />
      </div>
    </form>
  );
}
