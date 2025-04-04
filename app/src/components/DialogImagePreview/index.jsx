import React from "react";
import useDialog from "@/hooks/dialogbox.js";
import ImageLoader from "@/components/ImageLoader";

import "./styles.css";

/**
 * @param {{ largeImageUrl: string }} props
 * @returns {React.JSX.Element}
 */
export default function DialogImagePreview({ largeImageUrl }) {
  const dialog = useDialog();

  return (
    <div className="components-DialogImagePreview">
      <ImageLoader src={largeImageUrl} alt="preview" requireAuth />
      <i className="btn-close fa fa-close" onClick={() => dialog.hide()} />
    </div>
  );
}
