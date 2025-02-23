import React, { useState } from "react";
import useDialog from "../../../hooks/dialogbox.js";

import { fileToBase64FileData } from "../../../modules/util/dataConversion.js";
import {
  CachePaths,
  createNewCacheUrl,
  putLastCacheUrl,
} from "../../../modules/util/caching.js";
import useNotification from "../../../hooks/notification.js";

import PillsInput from "../../../components/PillsInput";
import ButtonText from "../../../components/ButtonText/index.jsx";
import { lang } from "../../../modules/util/language.js";

const SECTION_ROOM_FROM_CACHE_PATH = CachePaths.SECTION_ROOM_FROM;

/**
 * @typedef {import("../../../modules/util/dataConversion.js").Base64FileData} Base64FileData
 */

/**
 * @typedef {Object} CachableDraftFormData
 * @property {string[]} landmarks
 * @property {string} address
 * @property {string} city
 * @property {string} state
 * @property {string[]} majorTags
 * @property {string[]} minorTags
 * @property {Base64FileData[]} files
 */

/**
 * @returns {JSX.Element}
 */
export default function SectionRoomForm() {
  const notify = useNotification();

  const [draftButtonKind, setDraftButtonKind] = useState(
    /** @type {"secondary" | "loading"} */ ("secondary")
  );

  const [submitButtonKind, setSubmitButtonKind] = useState(
    /** @type {"primary" | "loading"} */ ("primary")
  );

  /**
   * @param {"not-loading" | "loading"} kind
   */
  function setActiveButtonKind(kind) {
    if (submitAction === "submit") {
      setSubmitButtonKind(kind === "loading" ? "loading" : "primary");
    }
    if (submitAction === "save-draft") {
      setDraftButtonKind(kind === "loading" ? "loading" : "secondary");
    }
  }

  const [landmarksSet, setLandmarksSet] = useState(
    /** @type {Set<string>} */ (new Set())
  );

  const [majorTagsSet, setMajorTagsSet] = useState(
    /** @type {Set<string>} */ (new Set())
  );

  const [minorTagsSet, setMinorTagsSet] = useState(
    /** @type {Set<string>} */ (new Set())
  );

  const [filesSet, setFilesSet] = useState(
    /** @type {Set<File>} */ (new Set())
  );

  const [submitAction, setSubmitAction] = useState(
    /** @type {"save-draft" | "submit"} */ ("save-draft")
  );

  const dialog = useDialog();

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  async function handleSubmitAsync(e) {
    // e.preventDefault(); // <-- HAS to be done in handleSubmitSync synchroneously

    const base64Files = /** @type {Base64FileData[]} */ ([]);

    for (const file of Array.from(filesSet)) {
      base64Files.push(await fileToBase64FileData(file));
    }

    /**
     * @type {CachableDraftFormData}
     */
    const formData = {
      landmarks: Array.from(landmarksSet),
      // @ts-ignore
      address: /** @type {string} */ (e.target.address.value),
      // @ts-ignore
      city: /** @type {string} */ (e.target.city.value),
      // @ts-ignore
      state: /** @type {string} */ (e.target.state.value),
      majorTags: Array.from(majorTagsSet),
      minorTags: Array.from(minorTagsSet),

      files: base64Files,
    };

    const jsonString = JSON.stringify(formData);

    // save form data draft in cache
    if (submitAction === "save-draft") {
      const cache = await caches.open(SECTION_ROOM_FROM_CACHE_PATH);
      const newUrl = await createNewCacheUrl(SECTION_ROOM_FROM_CACHE_PATH);
      await cache.put(
        newUrl,
        new Response(jsonString, { status: 200 })
      );
      await putLastCacheUrl(SECTION_ROOM_FROM_CACHE_PATH, newUrl);
    }

    if (submitAction === "submit") {
    }
  }

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   * @returns {void}
   */
  function handleSubmitSync(e) {
    e.preventDefault(); // <-- this HAS to be synchronous or else the form will submit before the cache is updated

    setActiveButtonKind("loading");
    handleSubmitAsync(e)
      .then(() =>
        notify(
          lang(
            "Form draft saved to this computer",
            "ফর্মের ড্রাফ্ট এই কম্পিউটারে সেভ করা হলো",
            "फॉर्म ड्राफ्ट इस कंप्यूटर में सेव किया गया है"
          ),
          "success"
        )
      )
      .then(() => setActiveButtonKind("not-loading"))
      .catch((e) => {
        notify(e, "error");
        setActiveButtonKind("not-loading");
      });
  }

  return (
    <form
      className="pages-OwnerRooms-SectionRoomForm form-container"
      onSubmit={(e) => handleSubmitSync(e)}
    >
      <div className="editable-container">
        <div className="textedit-container">
          <PillsInput
            placeholder="Set landmarks"
            pillsSet={landmarksSet}
            setPillsSet={setLandmarksSet}
          />
          <input required type="text" placeholder="Address" name="address" />
          <div className="city-state-container">
            <input required type="text" placeholder="City" name="city" />
            <input required type="text" placeholder="State" name="state" />
          </div>
          <PillsInput
            placeholder="Set major tags"
            pillsSet={majorTagsSet}
            setPillsSet={setMajorTagsSet}
          />
          <PillsInput
            placeholder="Set minor tags"
            pillsSet={minorTagsSet}
            setPillsSet={setMinorTagsSet}
          />
        </div>

        <div className="filedit-container">
          {/* TODO: Add multi-file input */}
        </div>
      </div>

      <div className="submit-container">
        <ButtonText
          name="save-draft"
          title="Save Draft"
          rounded="all"
          width="50%"
          kind={draftButtonKind}
          onClick={() => setSubmitAction("save-draft")}
        />
        <ButtonText
          name="submit"
          title="Submit"
          rounded="all"
          width="50%"
          kind={submitButtonKind}
          onClick={() => setSubmitAction("submit")}
        />
      </div>

      <i className="btn-close fa fa-close" onClick={() => dialog.hide()} />
    </form>
  );
}
