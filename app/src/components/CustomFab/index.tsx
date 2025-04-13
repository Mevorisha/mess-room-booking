import React from "react";
import "./styles.css";

export interface CustomFabProps {
  marginBottom?: number;
  title: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}

/**
 * CustomFab - A custom floating action button component
 */
export default function CustomFab({ marginBottom, title, onClick }: CustomFabProps): React.JSX.Element {
  const buttonStyle = {
    bottom: marginBottom != null ? `${marginBottom}px` : "20px",
  };

  return (
    <button className="components-CustomFab" style={buttonStyle} onClick={onClick}>
      <span className="text">{title}</span>
    </button>
  );
}
