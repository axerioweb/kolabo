"use client";

/**
 * Root error boundary (replaces the root layout when it crashes).
 * No i18n provider is available here, so the copy is bilingual and static.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="sr-Latn">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#fdfcff",
          color: "#150c2e",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <p style={{ fontSize: 48, fontWeight: 700, margin: 0 }}>500</p>
          <h1 style={{ fontSize: 22, margin: "12px 0 8px" }}>
            Došlo je do greške / Something went wrong
          </h1>
          <p style={{ color: "#6f6790", margin: 0 }}>
            Pokušaj ponovo. Ako se greška ponavlja, piši nam na hello@kolabo.rs.
          </p>
          {error.digest && (
            <p style={{ color: "#6f6790", fontSize: 12, marginTop: 8 }}>Kod: {error.digest}</p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "12px 24px",
              borderRadius: 999,
              border: 0,
              background: "linear-gradient(90deg,#6d28d9,#ec4899)",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Pokušaj ponovo / Try again
          </button>
        </div>
      </body>
    </html>
  );
}
