import React, { useState } from "react";

import { EmailPasswdAuth } from "@/modules/firebase/auth.js";
import { checkForEasterEgg } from "@/modules/util/easterEggs.js";

import useNotification from "@/hooks/notification.js";

import ButtonText from "@/components/ButtonText";

export default function RegisterSection(): React.ReactNode {
  const notify = useNotification();
  const [buttonKind, setButtonKind] = useState<"primary" | "loading">("primary");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = e.target as unknown as { value: string }[];
    const email = target[0]?.value;
    const password = target[1]?.value;
    const confirmPassword = target[2]?.value;

    let waitForEasterEggTime = 0;
    const easterEggsInEmail = checkForEasterEgg(email ?? "");

    if (easterEggsInEmail != null) {
      notify(easterEggsInEmail, "warning");
      waitForEasterEggTime = 4000;
    } else {
      const easterEggsInPassword = checkForEasterEgg(password ?? "");
      if (easterEggsInPassword != null) {
        notify(easterEggsInPassword, "warning");
        waitForEasterEggTime = 4000;
      }
    }

    return setTimeout(() => {
      if (password !== confirmPassword) {
        notify("Passwords do not match", "error");
        return;
      }

      Promise.resolve()
        .then(() => setButtonKind("loading"))
        .then(() => EmailPasswdAuth.register(email ?? "", password ?? ""))
        .then(() => setButtonKind("primary"))
        .catch((e: Error) => {
          notify(e, "error");
          setButtonKind("primary");
        });
    }, waitForEasterEggTime);
  }

  return (
    <form className="form-container" onSubmit={(e) => handleSubmit(e)}>
      <input required type="email" placeholder="Email" />
      <input required type="password" placeholder="Password" />
      <input required type="password" placeholder="Confirm Password" />
      <div className="submit-container">
        <ButtonText title="Register" rounded="all" width="50%" kind={buttonKind} />
      </div>
    </form>
  );
}
