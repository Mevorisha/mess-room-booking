import React, { useEffect } from "react";
import ButtonText from "@/components/ButtonText";
import useDialog from "@/hooks/dialogbox";
import { CachePaths } from "@/modules/util/caching";
import { lang } from "@/modules/util/language";
import SectionRoomCreateForm from "@/pages/Home/sections/RoomCreateForm";
import useNotification from "@/hooks/notification";
import ConfirmDialog from "@/components/ConfirmDialog";
import ImageLoader from "@/components/ImageLoader";

import "./styles.css";

export interface DraftData {
  url: string;
  landmark: string;
  city: string;
  state: string;
  searchTags: string[];
  majorTags: string[];
  firstImage?: string;
}

export interface SectionDraftsProps {
  handleAddNewRoom: () => void;
  reloadDraft: () => Promise<void>;
  reloadApi: (params?: { page?: number; invalidateCache?: boolean }) => Promise<void>;
  isLoadingDrafts: boolean;
  isLoadingRooms: boolean;
  drafts: DraftData[];
}

export default function SectionDrafts({
  handleAddNewRoom,
  reloadDraft,
  reloadApi,
  isLoadingDrafts,
  isLoadingRooms: _,
  drafts,
}: SectionDraftsProps): React.ReactNode {
  const notify = useNotification();
  const dialog = useDialog();

  function handleOpenDraft(draftUrl: string): void {
    dialog.show(
      <SectionRoomCreateForm draftCacheUrl={draftUrl} reloadApi={reloadApi} reloadDraft={reloadDraft} />,
      "uibox"
    );
  }

  function handleDeleteDraft(draftUrl: string): void {
    caches
      .open(CachePaths.SECTION_ROOM_FORM)
      .then((cache) => cache.delete(draftUrl))
      .then(() => reloadDraft())
      .catch((e: Error) => notify(e, "error"));
  }

  useEffect(() => {
    reloadDraft().catch((e: Error) => notify(e, "error"));
    // The void 0 was unnecessary in TypeScript
  }, [notify, reloadDraft]);

  return (
    <div className="section-RoomDrafts">
      <div className="section-header">
        <h2>{lang("Drafts", "খসড়া", "ड्राफ्ट")}</h2>
        <button
          className="reload-button"
          onClick={() => void reloadDraft().catch((e: Error) => notify(e, "error"))}
          disabled={isLoadingDrafts}
        >
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
            <li key={index} className="content-item item-item">
              <div className="item-preview">
                {draft.firstImage != null && (
                  <div className="item-image">
                    <ImageLoader src={draft.firstImage} alt={draft.landmark} />
                  </div>
                )}
                <div className="item-preview-nonimg">
                  <div className="item-info">
                    <div className="item-landmark" title={draft.landmark}>
                      {draft.landmark}
                    </div>
                    <div className="item-location">
                      {draft.city}, {draft.state}
                    </div>
                    <div className="item-tags">
                      {/* Show only 2 search tags and 1 major tag */}
                      {draft.searchTags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} title={tag} className="tag search-tag">
                          {tag}
                        </span>
                      ))}
                      {draft.majorTags.slice(0, 1).map((tag, idx) => (
                        <span key={idx} title={tag} className="tag major-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button
                      className="edit-item-button"
                      onClick={() => handleOpenDraft(draft.url)}
                      title={lang("Edit", "এডিট করুন", "एडिट करें")}
                    >
                      <i className="fa fa-pencil" aria-hidden="true"></i>
                    </button>
                    <button
                      className="delete-item-button"
                      onClick={() =>
                        dialog.show(
                          <ConfirmDialog
                            title={lang(
                              "Confirm Delete Draft",
                              "ড্রাফট মুছে ফেলতে নিশ্চিত করুন",
                              "ड्राफ्ट हटाने के लिए कन्फर्म करें"
                            )}
                            text={lang(
                              "Click confirm to delete draft. This action cannot be undone and your data will be deleted.",
                              "ড্রাফট মুছে ফেলতে কনফার্ম চাপুন। এই কাজটি বাতিল করা যাবে না এবং আপনার ডেটা মুছে যাবে।",
                              "ड्राफ्ट हटाने के लिए कन्फर्म पर क्लिक करें। यह क्रिया पूर्ववत नहीं की जा सकती और आपका डेटा हट जाएगा।"
                            )}
                            onConfirm={() => handleDeleteDraft(draft.url)}
                          />
                        )
                      }
                      title={lang("Delete", "মুছে ফেলুন", "हटाएं")}
                    >
                      <i className="fa fa-trash" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-item-message">
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
