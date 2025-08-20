/* eslint-disable */
// @ts-nocheck

import React, { useState } from "react";

BookingStatusTransition;

export default function BookingStatusTransition(): React.ReactNode {
  const [selectedState, setSelectedState] = useState(null);
  const [hoveredTransition, setHoveredTransition] = useState(null);

  const states = {
    UNSUBMITTED: { x: 150, y: 100, color: "#3B82F6", isTerminal: false },
    SUBMITTED: { x: 400, y: 100, color: "#F59E0B", isTerminal: false },
    CANCELLED: { x: 150, y: 300, color: "#EF4444", isTerminal: true },
    ACCEPTED: { x: 650, y: 100, color: "#10B981", isTerminal: false },
    REJECTED: { x: 400, y: 300, color: "#EF4444", isTerminal: true },
    CLEARED: { x: 650, y: 300, color: "#6B7280", isTerminal: true },
  };

  const transitions = [
    {
      from: "UNSUBMITTED",
      to: "SUBMITTED",
      action: "Submit",
      path: "M 200 100 L 350 100",
      labelPos: { x: 275, y: 90 },
    },
    {
      from: "SUBMITTED",
      to: "CANCELLED",
      action: "Cancel",
      path: "M 380 120 Q 275 200 170 280",
      labelPos: { x: 275, y: 180 },
    },
    {
      from: "SUBMITTED",
      to: "ACCEPTED",
      action: "Accept",
      path: "M 450 100 L 600 100",
      labelPos: { x: 525, y: 90 },
    },
    {
      from: "SUBMITTED",
      to: "REJECTED",
      action: "Reject",
      path: "M 400 150 L 400 250",
      labelPos: { x: 420, y: 200 },
    },
    {
      from: "ACCEPTED",
      to: "CLEARED",
      action: "Clear",
      path: "M 650 150 L 650 250",
      labelPos: { x: 670, y: 200 },
    },
  ];

  const getStateInfo = (stateName) => {
    const stateDescriptions = {
      UNSUBMITTED: "Booking created but not yet submitted by tenant",
      SUBMITTED: "Booking submitted by tenant, awaiting owner decision",
      CANCELLED: "Booking cancelled by tenant (terminal state)",
      ACCEPTED: "Booking accepted by owner, tenant can occupy room",
      REJECTED: "Booking rejected by owner (terminal state)",
      CLEARED: "Tenant has left the room after occupying it (terminal state)",
    };

    const allowedActions = {
      UNSUBMITTED: ["Submit"],
      SUBMITTED: ["Cancel", "Accept", "Reject"],
      CANCELLED: [],
      ACCEPTED: ["Clear"],
      REJECTED: [],
      CLEARED: [],
    };

    return {
      description: stateDescriptions[stateName],
      actions: allowedActions[stateName],
    };
  };

  const containerStyle = {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px",
    backgroundColor: "#ffffff",
    fontFamily: "sans-serif",
  };

  const headerStyle = {
    marginBottom: "24px",
  };

  const titleStyle = {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: "8px",
  };

  const subtitleStyle = {
    color: "#6B7280",
  };

  const mainContentStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  };

  const svgContainerStyle = {
    flex: 1,
  };

  const svgStyle = {
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    backgroundColor: "#F9FAFB",
    width: "100%",
    height: "auto",
  };

  const sidebarStyle = {
    width: "320px",
  };

  const infoPanelStyle = {
    backgroundColor: "#F9FAFB",
    borderRadius: "8px",
    padding: "16px",
    border: "1px solid #E5E7EB",
  };

  const infoPanelTitleStyle = {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: "12px",
  };

  const stateHeaderStyle = {
    fontWeight: "500",
    color: "#374151",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  };

  const stateIndicatorStyle = (state) => ({
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: `2px solid ${state.color}`,
    backgroundColor: state.color,
  });

  const terminalBadgeStyle = {
    fontSize: "12px",
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    padding: "2px 8px",
    borderRadius: "4px",
  };

  const descriptionStyle = {
    fontSize: "14px",
    color: "#6B7280",
    marginTop: "8px",
    marginBottom: "16px",
  };

  const actionsHeaderStyle = {
    fontWeight: "500",
    color: "#374151",
    marginBottom: "8px",
  };

  const actionItemStyle = {
    fontSize: "14px",
    color: "#6B7280",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  };

  const actionDotStyle = {
    width: "8px",
    height: "8px",
    backgroundColor: "#10B981",
    borderRadius: "50%",
  };

  const noActionsStyle = {
    fontSize: "14px",
    color: "#DC2626",
    fontStyle: "italic",
  };

  const placeholderStyle = {
    color: "#9CA3AF",
    fontStyle: "italic",
  };

  const legendStyle = {
    marginTop: "16px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "16px",
    border: "1px solid #E5E7EB",
  };

  const legendTitleStyle = {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: "12px",
  };

  const legendItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    fontSize: "14px",
  };

  const regularStateStyle = {
    width: "24px",
    height: "24px",
    border: "2px solid #3B82F6",
    borderRadius: "50%",
    backgroundColor: "transparent",
  };

  const terminalStateContainerStyle = {
    position: "relative",
    width: "24px",
    height: "24px",
  };

  const terminalStateOuterStyle = {
    width: "24px",
    height: "24px",
    border: "2px solid #EF4444",
    borderRadius: "50%",
    backgroundColor: "transparent",
  };

  const terminalStateInnerStyle = {
    position: "absolute",
    top: "4px",
    left: "4px",
    width: "16px",
    height: "16px",
    border: "1px solid #EF4444",
    borderRadius: "50%",
  };

  const arrowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  };

  const arrowLineStyle = {
    width: "24px",
    height: "2px",
    backgroundColor: "#6B7280",
  };

  const arrowHeadStyle = {
    width: "0",
    height: "0",
    borderLeft: "8px solid #6B7280",
    borderTop: "4px solid transparent",
    borderBottom: "4px solid transparent",
  };

  // Media query styles for responsiveness
  const mediaQueryStyle = `
    @media (min-width: 1024px) {
      .main-content {
        flex-direction: row !important;
      }
    }
  `;

  return (
    <div style={containerStyle}>
      <style>{mediaQueryStyle}</style>

      <div style={headerStyle}>
        <h2 style={titleStyle}>Booking Status State Transition Diagram</h2>
        <p style={subtitleStyle}>Click on states to see details, hover over transitions to highlight paths</p>
      </div>

      <div className="main-content" style={mainContentStyle}>
        {/* SVG Diagram */}
        <div style={svgContainerStyle}>
          <svg width="800" height="400" style={svgStyle} viewBox="0 0 800 400">
            {/* Transitions */}
            {transitions.map((transition, index) => (
              <g key={index}>
                {/* Transition path */}
                <path
                  d={transition.path}
                  stroke={hoveredTransition === index ? "#1F2937" : "#6B7280"}
                  strokeWidth={hoveredTransition === index ? "3" : "2"}
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  style={{ cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={() => setHoveredTransition(index)}
                  onMouseLeave={() => setHoveredTransition(null)}
                />

                {/* Transition label */}
                <text
                  x={transition.labelPos.x}
                  y={transition.labelPos.y}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="500"
                  fill={hoveredTransition === index ? "#1F2937" : "#6B7280"}
                  style={{ cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={() => setHoveredTransition(index)}
                  onMouseLeave={() => setHoveredTransition(null)}
                >
                  {transition.action}
                </text>
              </g>
            ))}

            {/* Arrow marker definition */}
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={hoveredTransition !== null ? "#1F2937" : "#6B7280"} />
              </marker>
            </defs>

            {/* States */}
            {Object.entries(states).map(([name, state]) => (
              <g key={name}>
                {/* State circle */}
                <circle
                  cx={state.x}
                  cy={state.y}
                  r="40"
                  fill={selectedState === name ? state.color : "#FFFFFF"}
                  stroke={state.color}
                  strokeWidth={selectedState === name ? "4" : "3"}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.2s",
                    filter: selectedState === name ? "none" : "hover:brightness(1.1)",
                  }}
                  onClick={() => setSelectedState(selectedState === name ? null : name)}
                />

                {/* Terminal state indicator */}
                {state.isTerminal && (
                  <circle
                    cx={state.x}
                    cy={state.y}
                    r="32"
                    fill="none"
                    stroke={state.color}
                    strokeWidth="2"
                    style={{ pointerEvents: "none" }}
                  />
                )}

                {/* State name */}
                <text
                  x={state.x}
                  y={state.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill={selectedState === name ? "white" : "#374151"}
                  style={{ pointerEvents: "none" }}
                >
                  {name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* State Information Panel */}
        <div style={sidebarStyle}>
          <div style={infoPanelStyle}>
            <h3 style={infoPanelTitleStyle}>State Information</h3>

            {selectedState ? (
              <div>
                <div>
                  <h4 style={stateHeaderStyle}>
                    <span style={stateIndicatorStyle(states[selectedState])}></span>
                    {selectedState}
                    {states[selectedState].isTerminal && <span style={terminalBadgeStyle}>Terminal</span>}
                  </h4>
                  <p style={descriptionStyle}>{getStateInfo(selectedState).description}</p>
                </div>

                <div>
                  <h4 style={actionsHeaderStyle}>Allowed Actions:</h4>
                  {getStateInfo(selectedState).actions.length > 0 ? (
                    <div>
                      {getStateInfo(selectedState).actions.map((action, index) => (
                        <div key={index} style={actionItemStyle}>
                          <span style={actionDotStyle}></span>
                          {action}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={noActionsStyle}>No actions allowed (terminal state)</p>
                  )}
                </div>
              </div>
            ) : (
              <p style={placeholderStyle}>Click on a state to see its details</p>
            )}
          </div>

          {/* Legend */}
          <div style={legendStyle}>
            <h3 style={legendTitleStyle}>Legend</h3>
            <div>
              <div style={legendItemStyle}>
                <div style={regularStateStyle}></div>
                <span>Regular State</span>
              </div>
              <div style={legendItemStyle}>
                <div style={terminalStateContainerStyle}>
                  <div style={terminalStateOuterStyle}></div>
                  <div style={terminalStateInnerStyle}></div>
                </div>
                <span>Terminal State</span>
              </div>
              <div style={legendItemStyle}>
                <div style={arrowStyle}>
                  <div style={arrowLineStyle}></div>
                  <div style={arrowHeadStyle}></div>
                </div>
                <span>Allowed Transition</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
