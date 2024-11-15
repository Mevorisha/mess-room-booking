import React from "react";
import { EmailPasswdAuth } from "../../modules/firebase/auth.js";
import { checkForEasterEgg } from "../../modules/util/easterEggs.js";
import useNotification from "../../hooks/notification.js";
import useDialogBox from "../../hooks/dialogbox.js";
import ButtonText from "../../components/ButtonText";

/**
 * @param {{ confirmButtonKind: "primary" | "loading"; handleConfirmClick: () => void; }} props
 */
function DialogContent({ confirmButtonKind, handleConfirmClick }) {
  return (
    <div className="form-container" style={{ padding: "var(--pad-5)" }}>
      <h2>Confirm Send Reset Email</h2>
      <p style={{ textAlign: "justify" }}>
        If the email exists in our database, you will receive a password reset
        link. If you don't receive an email, try again or contact us at{" "}
        <a
          style={{ color: "var(--color-link)" }}
          href="mailto:mevorisha@gmail.com"
          target="_blank"
          rel="noreferrer"
        >
          mevorisha@gmail.com
        </a>
        .
      </p>
      <p style={{ textAlign: "justify" }}>
        To keep your account secure, do not share your reset link with anyone.
      </p>
      <div
        style={{
          marginTop: "var(--pad-5)",
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ButtonText
          title="Confirm"
          rounded="all"
          kind={confirmButtonKind}
          width="50%"
          onClick={handleConfirmClick}
        />
      </div>
    </div>
  );
}

export default function ResetPasswdSection() {
  const notify = useNotification();
  const dialog = useDialogBox();

  const [resetButtonKind, setResetButtonKind] = React.useState(
    /** @type {"primary" | "loading"} */ ("primary")
  );

  /**
   * @param {string} email
   */
  function handleConfirmClick(email) {
    Promise.resolve()
      .then(() => setResetButtonKind("loading"))
      .then(() => dialog.hide())
      .then(() => EmailPasswdAuth.requestPasswordReset(email))
      .then(() => notify("Check your email for password reset link", "success"))
      .then(() => setResetButtonKind("primary"))
      .catch((e) => {
        dialog.hide();
        setResetButtonKind("primary");
        notify(e.toString(), "error");
      });
  }

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
      dialog.show(
        <DialogContent
          confirmButtonKind={resetButtonKind}
          handleConfirmClick={() => handleConfirmClick(email)}
        />
      );
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
        <ButtonText
          title="Reset Password"
          rounded="all"
          width="50%"
          kind={resetButtonKind}
        />
      </div>
    </form>
  );
}
