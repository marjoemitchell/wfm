import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e4322b",
          color: "#0e0f12",
          fontFamily: "Arial, sans-serif",
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: 0.2,
        }}
      >
        WFM
      </div>
    ),
    { ...size },
  );
}
