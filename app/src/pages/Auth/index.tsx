import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthStateEnum } from "@/contexts/auth.jsx";
import { PageType } from "@/modules/util/pageUrls.js";

import useCompositeUser from "@/hooks/compositeUser.js";

import ButtonText from "@/components/ButtonText";
import ImageLoader from "@/components/ImageLoader";

import LoginSection from "./SectionLogin";
import RegisterSection from "./SectionRegister";
import ResetPasswdSection from "./SectionResetPasswd";
import OAuthSection from "./SectionOAuth";

import LoadingPage from "@/pages/Loading";

import "./styles.css";

import dpMevorisha from "@/assets/images/dpMevorisha.png";

function SectionButtons({
  showSection,
  setShowSection,
}: {
  showSection: "login" | "register" | "resetPasswd";
  setShowSection: React.Dispatch<React.SetStateAction<"login" | "register" | "resetPasswd">>;
}): React.ReactNode {
  return (
    <div className="button-container">
      <ButtonText
        title="Login"
        onClick={() => setShowSection("login")}
        rounded="all"
        kind={showSection === "login" ? "primary" : showSection === "resetPasswd" ? "secondary" : "cannibalized"}
        width="50%"
      />
      <ButtonText
        title="Register"
        onClick={() => setShowSection("register")}
        rounded="all"
        kind={showSection === "register" ? "primary" : "cannibalized"}
        width="50%"
      />
    </div>
  );
}

export default function Auth(): React.ReactNode {
  const [showSection, setShowSection] = useState<"login" | "register" | "resetPasswd">("login");

  const compUsr = useCompositeUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (compUsr.authCtx.state === AuthStateEnum.LOGGED_IN) {
      navigate(PageType.ROOT);
    }
  }, [compUsr.authCtx.state, navigate]);

  if (compUsr.authCtx.state === AuthStateEnum.LOGGED_IN) return <LoadingPage />;

  return (
    <div className="pages-Auth">
      <span>
        <ImageLoader className="logo" src={dpMevorisha} alt="logo" />
      </span>
      <span>
        <h1>Mevorisha</h1>
      </span>
      <span>
        <h2>Mess Booking App</h2>
      </span>
      <div className="container">
        <SectionButtons showSection={showSection} setShowSection={setShowSection} />
        {
          /* login form */
          showSection === "login" ? (
            <LoginSection setShowSection={setShowSection} />
          ) : showSection === "register" ? (
            <RegisterSection />
          ) : (
            <ResetPasswdSection />
          )
        }
        {/* implement login with Google, Apple & Microsoft */}
        <OAuthSection />
      </div>
    </div>
  );
}
