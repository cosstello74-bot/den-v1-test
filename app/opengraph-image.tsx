import { ImageResponse } from "next/og";

export const runtime     = "edge";
export const alt         = "DEN — Decision Intelligence";
export const size        = { width: 1200, height: 630 };
export const contentType = "image/png";

const BARS = [
  { label: "Best Match",   score: 94, pct: "94%" },
  { label: "Strong Match", score: 87, pct: "87%" },
  { label: "Solid Option", score: 79, pct: "79%" },
];

const SIGNALS = ["Free", "No sign-up", "60 seconds", "UK Electronics"];

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width:           1200,
          height:          630,
          backgroundColor: "#030712",
          display:         "flex",
          padding:         "56px 72px",
          position:        "relative",
          overflow:        "hidden",
          fontFamily:      "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Ambient glow — top right */}
        <div
          style={{
            position:     "absolute",
            top:          -120,
            right:        -120,
            width:        560,
            height:       560,
            borderRadius: "50%",
            background:   "radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 70%)",
          }}
        />

        {/* ── Left column ──────────────────────────────── */}
        <div
          style={{
            display:       "flex",
            flexDirection: "column",
            flex:          1,
            paddingRight:  80,
          }}
        >
          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 52 }}>
            <div
              style={{
                width:           36,
                height:          36,
                backgroundColor: "#4f46e5",
                borderRadius:    8,
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                color:           "white",
                fontWeight:      700,
                fontSize:        18,
                marginRight:     12,
              }}
            >
              D
            </div>
            <span
              style={{
                color:          "white",
                fontWeight:     700,
                fontSize:       20,
                letterSpacing:  "-0.02em",
                marginRight:    16,
              }}
            >
              DEN
            </span>
            <span
              style={{
                color:          "#6b7280",
                fontSize:       11,
                fontWeight:     700,
                letterSpacing:  "0.1em",
                textTransform:  "uppercase",
              }}
            >
              Decision Intelligence
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize:      68,
              fontWeight:    700,
              color:         "white",
              lineHeight:    1.1,
              letterSpacing: "-0.04em",
              marginBottom:  4,
            }}
          >
            Stop scrolling
          </div>
          <div
            style={{
              fontSize:      68,
              fontWeight:    700,
              color:         "white",
              lineHeight:    1.1,
              letterSpacing: "-0.04em",
              marginBottom:  4,
            }}
          >
            Reddit.
          </div>
          <div
            style={{
              fontSize:      68,
              fontWeight:    700,
              color:         "#6366f1",
              lineHeight:    1.1,
              letterSpacing: "-0.04em",
              marginBottom:  32,
            }}
          >
            Get your match.
          </div>

          <div
            style={{
              color:        "#6b7280",
              fontSize:     18,
              lineHeight:   1.5,
              marginBottom: "auto",
            }}
          >
            Truth-calibrated electronics rankings. No sponsored results.
          </div>

          {/* Trust signals */}
          <div
            style={{
              display:    "flex",
              marginTop:  40,
              paddingTop: 24,
              borderTop:  "1px solid #1f2937",
            }}
          >
            {SIGNALS.map((s, i) => (
              <div
                key={s}
                style={{
                  display:     "flex",
                  alignItems:  "center",
                  color:       "#6b7280",
                  fontSize:    13,
                  marginRight: i < SIGNALS.length - 1 ? 28 : 0,
                }}
              >
                <div
                  style={{
                    width:           4,
                    height:          4,
                    borderRadius:    "50%",
                    backgroundColor: "#4f46e5",
                    marginRight:     8,
                  }}
                />
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column — score bars ─────────────────── */}
        <div
          style={{
            display:         "flex",
            flexDirection:   "column",
            justifyContent:  "center",
            width:           340,
            backgroundColor: "#111827",
            borderRadius:    16,
            border:          "1px solid #1f2937",
            padding:         "36px 32px",
          }}
        >
          <div
            style={{
              color:          "#6b7280",
              fontSize:       11,
              fontWeight:     700,
              letterSpacing:  "0.1em",
              textTransform:  "uppercase",
              marginBottom:   28,
            }}
          >
            Ranked Picks
          </div>

          {BARS.map(({ label, score, pct }, i) => (
            <div
              key={label}
              style={{
                display:       "flex",
                flexDirection: "column",
                marginBottom:  i < BARS.length - 1 ? 24 : 0,
              }}
            >
              <div
                style={{
                  display:        "flex",
                  justifyContent: "space-between",
                  alignItems:     "center",
                  marginBottom:   8,
                }}
              >
                <span
                  style={{
                    color:         i === 0 ? "#a5b4fc" : "#6b7280",
                    fontSize:      12,
                    fontWeight:    700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    color:      i === 0 ? "#a5b4fc" : "#4b5563",
                    fontSize:   14,
                    fontWeight: 700,
                  }}
                >
                  {score}
                </span>
              </div>
              {/* Track */}
              <div
                style={{
                  height:          8,
                  backgroundColor: "#1f2937",
                  borderRadius:    9999,
                  position:        "relative",
                }}
              >
                {/* Fill */}
                <div
                  style={{
                    position:        "absolute",
                    left:            0,
                    top:             0,
                    height:          8,
                    width:           pct,
                    backgroundColor: i === 0 ? "#4f46e5" : "#312e81",
                    borderRadius:    9999,
                  }}
                />
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop:    28,
              paddingTop:   20,
              borderTop:    "1px solid #1f2937",
              color:        "#374151",
              fontSize:     11,
              fontWeight:   700,
              letterSpacing:"0.08em",
              textTransform:"uppercase",
            }}
          >
            No sponsored results
          </div>
        </div>

      </div>
    ),
    { ...size },
  );
}
