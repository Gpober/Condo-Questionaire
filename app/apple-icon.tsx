import { ImageResponse } from "next/og";

// Apple touch icon (iOS home-screen bookmarks). Rendered to PNG at build time
// from the same condo + checkmark mark used for the nav logo and favicon.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #2563eb, #4f46e5)",
        }}
      >
        <svg viewBox="0 0 32 32" width="180" height="180" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* taller condo tower */}
          <rect x="6" y="8" width="10" height="18" rx="1.4" fill="#ffffff" fillOpacity="0.95" />
          {/* tower windows */}
          <g fill="#2563eb">
            <rect x="8.4" y="11" width="2" height="2" rx="0.4" />
            <rect x="11.8" y="11" width="2" height="2" rx="0.4" />
            <rect x="8.4" y="14.6" width="2" height="2" rx="0.4" />
            <rect x="11.8" y="14.6" width="2" height="2" rx="0.4" />
            <rect x="8.4" y="18.2" width="2" height="2" rx="0.4" />
            <rect x="11.8" y="18.2" width="2" height="2" rx="0.4" />
          </g>
          {/* shorter front building */}
          <rect x="15" y="13" width="11" height="13" rx="1.4" fill="#ffffff" fillOpacity="0.7" />
          {/* checkmark — nods to the questionnaire */}
          <path d="M17.8 19.8l2.2 2.2 4.2-4.4" stroke="#2563eb" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
