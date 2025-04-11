import React, { useState } from "react";
import useDialog from "@/hooks/dialogbox.js";
import ImageLoader from "@/components/ImageLoader";

import "./styles.css";

/**
 * @param {{ largeImageUrl: string }} props
 * @returns {React.JSX.Element}
 */
export default function DialogImagePreview({ largeImageUrl }) {
  const dialog = useDialog();
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="components-DialogImagePreview">
      <ImageLoader src={largeImageUrl} alt="preview" requireAuth onLoad={() => setLoaded(true)} />
      {loaded && <i className="btn-close fa fa-close" onClick={() => dialog.hide()} />}
    </div>
  );
}
