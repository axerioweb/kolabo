import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

type Props = {
  title: string;
  subtitle?: string;
  chips?: string[];
  /** Small label above the title, e.g. "Kreator na Kolabo" */
  kicker?: string;
  /** Avatar URL (must be absolute) — falls back to initials. */
  image?: string | null;
  initials?: string;
  /** Footer line, e.g. "kolabo.rs". */
  footer: string;
  footerTag: string;
};

/**
 * Shared Open Graph card (1200×630) — brand gradient, Kolabo mark, big
 * title, optional avatar and chips. Rendered at the edge by next/og.
 */
export function ogImage(p: Props) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background:
            "linear-gradient(135deg, #5b21b6 0%, #7c3aed 45%, #ec4899 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            K
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>kolabo</div>
          {p.kicker && (
            <div
              style={{
                marginLeft: "auto",
                fontSize: 24,
                padding: "10px 22px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.18)",
              }}
            >
              {p.kicker}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          {(p.image || p.initials) && (
            <div
              style={{
                width: 200,
                height: 200,
                borderRadius: 100,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.2)",
                border: "6px solid rgba(255,255,255,0.7)",
                fontSize: 80,
                fontWeight: 800,
                overflow: "hidden",
              }}
            >
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt="" width={200} height={200} style={{ objectFit: "cover" }} />
              ) : (
                p.initials
              )}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0, flex: 1, maxWidth: 820 }}>
            <div
              style={{
                fontSize: p.title.length > 40 ? 56 : 72,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: -2,
                textShadow: "0 2px 12px rgba(0,0,0,0.18)",
              }}
            >
              {p.title}
            </div>
            {p.subtitle && (
              <div style={{ fontSize: 30, opacity: 0.92, lineHeight: 1.3 }}>{p.subtitle}</div>
            )}
            {p.chips && p.chips.length > 0 && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {p.chips.slice(0, 3).map((c) => (
                  <div
                    key={c}
                    style={{
                      fontSize: 24,
                      padding: "8px 20px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.92)",
                      color: "#5b21b6",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, opacity: 0.9 }}>
          <div>{p.footer}</div>
          <div>{p.footerTag}</div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
