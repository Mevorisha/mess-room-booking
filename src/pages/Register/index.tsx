import React from "react";
import * as Auth from "aws-amplify/auth";

enum SignUpState {
  SIGN_UP,
  VERIFY,
}

interface SignUpProps {
  username: {
    value: string;
    setValue: (username: string) => void;
  };
  signUpState: {
    value: SignUpState;
    setValue: (signUpState: SignUpState) => void;
  };
}

function SignUp({ username, signUpState }: SignUpProps) {
}

interface VerifyProps {
  username: string;
}

function Verify({ username }: VerifyProps) {}

export default function Register() {
  /* load the state from local storage
     this is usefull in case the page refreshes
     while the user is fetching the OTP from another app */
  const _SignUpState = JSON.parse(
    localStorage.getItem("signUpState") || JSON.stringify(SignUpState.SIGN_UP)
  );

  const [username, setUsername] = React.useState("");
  const [signUpState, _SetSignUpState] = React.useState(_SignUpState);

  function setSignUpState(signUpState: SignUpState) {
    _SetSignUpState(signUpState);
    localStorage.setItem("signUpState", JSON.stringify(signUpState));
  }

  return (
    <>
      {signUpState === SignUpState.SIGN_UP && (
        <SignUp
          username={{ value: username, setValue: setUsername }}
          signUpState={{ value: signUpState, setValue: setSignUpState }}
        />
      )}
      {signUpState === SignUpState.VERIFY && <Verify username={username} />}
    </>
  );
}
