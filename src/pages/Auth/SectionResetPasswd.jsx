import React, { useEffect } from "react";
import { EmailPasswdAuth } from "../../modules/firebase/auth.js";
import { checkForEasterEgg } from "../../modules/util/easterEggs.js";
import useNotification from "../../hooks/notification.js";
import useDialogBox from "../../hooks/dialogbox.js";
import ButtonText from "../../components/ButtonText";

/**
 * @param {{
 *   email: string;
 *   setResetButtonKind: (val: "primary" | "loading") => void;
 * }} props
 * @returns {React.JSX.Element}
 */
function DialogContent({ email, setResetButtonKind }) {
  const notify = useNotification();
  const dialog = useDialogBox();

  const [confirmButtonKind, setConfirmButtonKind] = React.useState(
    /** @type {"primary" | "loading"} */ ("primary")
  );

  useEffect(() => {
    // if dialog is gone or is going out, primary reset button, else loading button
    if (dialog.isVisible) setResetButtonKind("loading");
    else setResetButtonKind("primary");
  }, [dialog.isVisible, setResetButtonKind]);

  function handleConfirmClick() {
    Promise.resolve()
      .then(() => setConfirmButtonKind("loading"))
      .then(() => EmailPasswdAuth.requestPasswordReset(email))
      .then(() => setConfirmButtonKind("primary"))
      .then(() => dialog.hide())
      .then(() => notify("Check your email for password reset link", "success"))
      .catch((e) => {
        dialog.hide();
        notify(e.toString(), "error");
      });
  }

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
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  function handleSubmit(e) {
    e.preventDefault();

    const email = e.target[0].value;

    let waitForEasterEggTime = 0;

    const easterEggsInEmail = checkForEasterEgg(email);
    if (easterEggsInEmail) {
      notify(easterEggsInEmail, "warning");
      waitForEasterEggTime = 4000;
    }

    return setTimeout(() => {
      dialog.show(
        <DialogContent email={email} setResetButtonKind={setResetButtonKind} />
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
