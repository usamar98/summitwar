"use client";

export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#07101b",
          color: "#f4f1e8",
          fontFamily: "system-ui",
          display: "grid",
          minHeight: "100vh",
          placeItems: "center",
        }}
      >
        <div style={{ maxWidth: 520, padding: 32, textAlign: "center" }}>
          <h1>SummitWar hit rough weather.</h1>
          <p style={{ color: "#9badb5", lineHeight: 1.6 }}>
            No browser error can apply a payment or change a rank. Please try
            again.
          </p>
          <button
            onClick={retry}
            style={{
              marginTop: 18,
              padding: "10px 18px",
              borderRadius: 10,
              border: 0,
              background: "#f1c75b",
              color: "#201805",
              fontWeight: 700,
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
