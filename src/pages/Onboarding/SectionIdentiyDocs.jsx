import React from "react";

/**
 * Section where the user can upload their identity documents.
 * @return {React.ReactElement}
 */
export default function SectionIdentiyDocs() {
  function handleSubmit() {}

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

        <form className="form-container" onSubmit={handleSubmit}></form>
      </div>
    </div>
  );
}
