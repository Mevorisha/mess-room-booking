import React from "react";
import useAuth from "../../hooks/auth.js";
import ButtonText from "../../components/ButtonText";

/**
 * Section where the user can upload their identity documents.
 * @return {React.ReactElement}
 */
export default function SectionIdentiyDocs() {
  const auth = useAuth();

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   * @param {"WORK_ID" | "GOV_ID"} type
   */
  function handleSubmit(e, type) {
    e.preventDefault();
  }

  return (
    <div className="pages-Onboarding">
      <div className="onboarding-container">
        <h1>Upload ID Documents</h1>
        <h4>Documents may be removed or re-uploaded later.</h4>

        <div className="desc">
          <p>
            Documents like work or institution identity card and aadhaar card
            may be used by you room owner to verify your identity.
          </p>
          <p>You can make document visibility public or private.</p>
        </div>

        <div className="uploadid-container">
          {auth.user.identityPhotos?.workId ? (
            <form
              className="form-container"
              onSubmit={(e) => handleSubmit(e, "WORK_ID")}
            ></form>
          ) : (
            <form
              className="form-container"
              onSubmit={(e) => handleSubmit(e, "WORK_ID")}
            >
              <div className="missing-id">
                <div>
                  <h4>Upload Work ID</h4>
                  <p>Eg: Photo ID Card</p>
                </div>
                <ButtonText title="Upload" rounded="all" kind="secondary" />
              </div>
            </form>
          )}
        </div>

        <div className="uploadid-container">
          {auth.user.identityPhotos?.govId ? (
            <form
              className="form-container"
              onSubmit={(e) => handleSubmit(e, "GOV_ID")}
            ></form>
          ) : (
            <form
              className="form-container"
              onSubmit={(e) => handleSubmit(e, "GOV_ID")}
            >
              <div className="missing-id">
                <div>
                  <h4>Upload Government ID</h4>
                  <p>Eg: Aadhaar Card</p>
                </div>
                <ButtonText title="Upload" rounded="all" kind="secondary" />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
