import React, { useEffect, useRef, useState } from "react";
import useDialog from "../../../../hooks/dialogbox.js";

import {
  base64FileDataToFile,
  fileToBase64FileData,
} from "../../../../modules/util/dataConversion.js";
import {
  CachePaths,
  createNewCacheUrl,
  putLastCacheUrl,
} from "../../../../modules/util/caching.js";
import useNotification from "../../../../hooks/notification.js";

import PillsInput from "../../../../components/PillsInput/index.jsx";
import ButtonText from "../../../../components/ButtonText/index.jsx";
import { lang } from "../../../../modules/util/language.js";

import "./styles.css";

const SECTION_ROOM_FORM_CACHE_PATH = CachePaths.SECTION_ROOM_FORM;

/**
 * @typedef {import("../../../../modules/util/dataConversion.js").Base64FileData} Base64FileData
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
 * Docs:
 * - If `viewDraftCacheUrl` is provided, the form will load the draft data from the cache.
 * - If `editExistingRoomId` is provided, the form expects the data of the room to be edited to be already loaded in the cache.
 *   This implies that if `editExistingRoomId` is provided, `viewDraftCacheUrl` SHOULD ALSO be provided.
 * - If `editExistingRoomId` is provided, the form on submit will delete all entries of the room from the database and storage.
 *   Only then will it create a new database entry and upload the files to storage with id as `editExistingRoomId` (new id is not generated).
 * - If `editExistingRoomId` is not provided, the form on submit will generate a new id same as current unix timestamp.
 * - When a form is submitted, the cache data will be deleted.
 * - If `viewOnly` is true, the form can neither be submitted nor saved to cache as draft.
 * @param {{ viewDraftCacheUrl?: string, editExistingRoomId?: string, viewOnly: boolean }} props
 * @returns {JSX.Element}
 */
export default function SectionRoomForm({ viewDraftCacheUrl, editExistingRoomId, viewOnly }) {
  const notify = useNotification();

  const [internalCacheUrl, setInternalCacheUrl] = useState(
    viewDraftCacheUrl ?? ""
  );

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

  const addressInput = /** @type {React.MutableRefObject<HTMLInputElement>} */ (
    useRef()
  );
  const cityInput = /** @type {React.MutableRefObject<HTMLInputElement>} */ (
    useRef()
  );
  const stateInput = /** @type {React.MutableRefObject<HTMLInputElement>} */ (
    useRef()
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

  /* useEffect to load cache data */
  useEffect(() => {
    if (!viewDraftCacheUrl) return;
    if (!addressInput.current || !cityInput.current || !stateInput.current)
      return;

    caches
      .open(SECTION_ROOM_FORM_CACHE_PATH)
      .then((cache) => cache.match(internalCacheUrl))
      .then((response) => response?.json())
      .then((/** @type {CachableDraftFormData} */ data) => {
        if (!data) return;
        setLandmarksSet(new Set(data.landmarks));
        if (addressInput.current) addressInput.current.value = data.address;
        if (cityInput.current) cityInput.current.value = data.city;
        if (stateInput.current) stateInput.current.value = data.state;
        setMajorTagsSet(new Set(data.majorTags));
        setMinorTagsSet(new Set(data.minorTags));
        setFilesSet(
          new Set(data.files.map((fileData) => base64FileDataToFile(fileData)))
        );
      })
      .catch((e) => notify(e, "error"));
  }, [
    viewDraftCacheUrl,
    addressInput.current,
    cityInput.current,
    stateInput.current,
  ]);

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
      const cache = await caches.open(SECTION_ROOM_FORM_CACHE_PATH);
      const newUrl = await createNewCacheUrl(SECTION_ROOM_FORM_CACHE_PATH);
      await cache.put(newUrl, new Response(jsonString, { status: 200 }));
      await putLastCacheUrl(SECTION_ROOM_FORM_CACHE_PATH, newUrl);
      setInternalCacheUrl(newUrl);
    }

    if (submitAction === "submit") {
      Promise.resolve() // <-- submission db call placeholder
        .then(() => caches.open(SECTION_ROOM_FORM_CACHE_PATH))
        .then((cache) => cache.delete(internalCacheUrl))
        .catch((e) => notify(e, "error"));
    }
  }

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   * @returns {void}
   */
  function handleSubmitSync(e) {
    e.preventDefault(); // <-- this HAS to be synchronous or else the form will submit before the cache is updated

    if (viewOnly) {
      notify(
        lang(
          "This form is view only",
          "এই ফর্মটি শুধুমাত্র দেখার জন্য",
          "यह फॉर्म केवल देखने के लिए है"
        ),
        "error"
      );
      return;
    }

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
            disabled={viewOnly}
            placeholder="Set landmarks"
            pillsSet={landmarksSet}
            setPillsSet={setLandmarksSet}
          />
          <input
            required
            disabled={viewOnly}
            ref={addressInput}
            type="text"
            placeholder="Address"
            name="address"
          />
          <div className="city-state-container">
            <input
              required
              disabled={viewOnly}
              ref={cityInput}
              type="text"
              placeholder="City"
              name="city"
            />
            <input
              required
              disabled={viewOnly}
              ref={stateInput}
              type="text"
              placeholder="State"
              name="state"
            />
          </div>
          <PillsInput
            disabled={viewOnly}
            placeholder="Set major tags"
            pillsSet={majorTagsSet}
            setPillsSet={setMajorTagsSet}
          />
          <PillsInput
            disabled={viewOnly}
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
          disabled={viewOnly}
          name="save-draft"
          title="Save Draft"
          rounded="all"
          width="50%"
          kind={draftButtonKind}
          onClick={() => setSubmitAction("save-draft")}
        />
        <ButtonText
          disabled={viewOnly}
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
