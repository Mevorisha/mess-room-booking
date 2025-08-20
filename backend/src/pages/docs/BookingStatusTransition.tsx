/* eslint-disable */
// @ts-nocheck

import React, { useState } from "react";

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

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Status State Transition Diagram</h2>
        <p className="text-gray-600">Click on states to see details, hover over transitions to highlight paths</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* SVG Diagram */}
        <div className="flex-1">
          <svg width="800" height="400" className="border border-gray-200 rounded-lg bg-gray-50" viewBox="0 0 800 400">
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
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredTransition(index)}
                  onMouseLeave={() => setHoveredTransition(null)}
                />

                {/* Transition label */}
                <text
                  x={transition.labelPos.x}
                  y={transition.labelPos.y}
                  textAnchor="middle"
                  className={`text-sm font-medium cursor-pointer transition-all duration-200 ${
                    hoveredTransition === index ? "fill-gray-900" : "fill-gray-600"
                  }`}
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
                  className="cursor-pointer transition-all duration-200 hover:stroke-4"
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
                    className="pointer-events-none"
                  />
                )}

                {/* State name */}
                <text
                  x={state.x}
                  y={state.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-xs font-bold pointer-events-none ${
                    selectedState === name ? "fill-white" : "fill-gray-700"
                  }`}
                >
                  {name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* State Information Panel */}
        <div className="lg:w-80">
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">State Information</h3>

            {selectedState ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border-2"
                      style={{
                        backgroundColor: states[selectedState].color,
                        borderColor: states[selectedState].color,
                      }}
                    ></span>
                    {selectedState}
                    {states[selectedState].isTerminal && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Terminal</span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 mt-2">{getStateInfo(selectedState).description}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Allowed Actions:</h4>
                  {getStateInfo(selectedState).actions.length > 0 ? (
                    <ul className="space-y-1">
                      {getStateInfo(selectedState).actions.map((action, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-red-600 italic">No actions allowed (terminal state)</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">Click on a state to see its details</p>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 bg-white rounded-lg p-4 border">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-500 rounded-full"></div>
                <span>Regular State</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-6 h-6 border-2 border-red-500 rounded-full"></div>
                  <div className="absolute inset-1 border border-red-500 rounded-full"></div>
                </div>
                <span>Terminal State</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-gray-600"></div>
                <div className="w-0 h-0 border-l-4 border-l-gray-600 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                <span>Allowed Transition</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
