import React, { useState, useCallback, useEffect } from "react";
import ButtonText from "@/components/ButtonText";
import useDialogBox from "@/hooks/dialogbox";
import { CachePaths } from "@/modules/util/caching";
import { base64FileDataToFile } from "@/modules/util/dataConversion";
import { lang } from "@/modules/util/language";
import SectionRoomCreateForm from "@/pages/unparameterized/OwnerRooms/SectionRoomCreateForm";
import useNotification from "@/hooks/notification";

/**
 * @param {{ handleAddNewRoom: () => void }} props
 * @returns {React.JSX.Element}
 */
export default function SectionDrafts({ handleAddNewRoom }) {
  const notify = useNotification();
  const dialog = useDialogBox();

  const [drafts, setDrafts] = useState([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);

  const loadDrafts = useCallback(async () => {
    try {
      setIsLoadingDrafts(true);
      const cache = await caches.open(CachePaths.SECTION_ROOM_FORM);
      const cacheKeys = await cache.keys();

      const draftPromises = cacheKeys.map(async (request) => {
        const url = request.url;

        if (url.endsWith("/last-id")) {
          return null; // Skip the last-id entry
        }

        const response = await cache.match(request);
        const data = await response.json();

        // Extract the first image if available
        let firstImage = null;
        if (data.files && data.files.length > 0) {
          firstImage = data.files[0];
        }

        return {
          url,
          landmark: data.landmark || "",
          searchTags: data.searchTags || [],
          majorTags: data.majorTags || [],
          city: data.city || "",
          state: data.state || "",
          firstImage,
        };
      });

      const loadedDrafts = await Promise.all(draftPromises);
      setDrafts(loadedDrafts.filter(Boolean));
    } catch (error) {
      console.error(error);
      notify(
        lang("Error loading drafts", "ড্রাফট লোড করতে সমস্যা হয়েছে", "ड्राफ्ट लोड करने में त्रुटि हुई है"),
        "error"
      );
    } finally {
      // This timeout reduces flicker by giving user time to adjust to the new UI before popuating it
      setTimeout(() => setIsLoadingDrafts(false), 2000);
    }
  }, [notify]);

  /**
   * @param {string} draftUrl
   */
  function handleOpenDraft(draftUrl) {
    dialog.show(<SectionRoomCreateForm draftCacheUrl={draftUrl} />, "fullwidth");
  }

  /**
   * @param {string} draftUrl
   * @returns {Promise<void>}
   */
  async function handleDeleteDraft(draftUrl) {
    try {
      const cache = await caches.open(CachePaths.SECTION_ROOM_FORM);
      await cache.delete(draftUrl);
      // Refresh the drafts list
      loadDrafts();
    } catch (error) {
      console.error("Error deleting draft:", error);
    }
  }

  useEffect(() => loadDrafts() && void 0, [loadDrafts]);

  return (
    <div className="section-container">
      <div className="section-header">
        <h2>{lang("Drafts", "খসড়া", "ड्राफ्ट")}</h2>
        <button className="reload-button" onClick={loadDrafts} disabled={isLoadingDrafts}>
          <i className="fa fa-refresh" aria-hidden="true"></i>
        </button>
      </div>

      {isLoadingDrafts ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : drafts.length > 0 ? (
        <ul className="content-list">
          {drafts.map((draft, index) => (
            <li key={index} className="content-item draft-item">
              <div className="draft-preview">
                {draft.firstImage && (
                  <div className="draft-image">
                    <img
                      src={URL.createObjectURL(base64FileDataToFile(draft.firstImage))}
                      alt={draft.landmark}
                      onLoad={(e) => {
                        // Properly type the event target as HTMLImageElement
                        const img = e.target;
                        if (img instanceof HTMLImageElement) {
                          URL.revokeObjectURL(img.src);
                        }
                      }}
                    />
                  </div>
                )}
                <div className="draft-info">
                  <div className="draft-landmark" title={draft.landmark}>
                    {draft.landmark}
                  </div>
                  <div className="draft-location">
                    {draft.city}, {draft.state}
                  </div>
                  <div className="draft-tags">
                    {/* Show only 2 search tags and 1 major tag */}
                    {draft.searchTags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="tag search-tag">
                        {tag}
                      </span>
                    ))}
                    {draft.majorTags.slice(0, 1).map((tag, idx) => (
                      <span key={idx} className="tag major-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="draft-actions">
                  <button
                    className="edit-draft-button"
                    onClick={() => handleOpenDraft(draft.url)}
                    title={lang("Edit", "এডিট করুন", "एडिट करें")}
                  >
                    <i className="fa fa-pencil" aria-hidden="true"></i>
                  </button>
                  <button
                    className="delete-draft-button"
                    onClick={() => handleDeleteDraft(draft.url)}
                    title={lang("Delete", "মুছে ফেলুন", "हटाएं")}
                  >
                    <i className="fa fa-trash" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-drafts-message">
          <p>{lang("No drafts found", "কোন খসড়া পাওয়া যায়নি", "कोई ड्राफ्ट नहीं मिला")}</p>
          <ButtonText
            width="50%"
            rounded="all"
            title={lang("Add Room", "রুম যোগ করুন", "रूम जोड़ें")}
            kind="secondary"
            onClick={handleAddNewRoom}
          />
        </div>
      )}
    </div>
  );
}
