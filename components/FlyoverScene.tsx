// Animated aerial "flyover" backdrop for the hero. Pure SVG + CSS so it stays
// crisp at any width and adds no asset weight. Several skyline layers scroll at
// different speeds (parallax) while clouds drift across the foreground — the
// combination reads as a camera flying past/over a city. Motion is paused for
// users who prefer reduced motion (see globals.css). Anchored to the bottom so
// the hero copy stays readable up top.
export default function FlyoverScene() {
  return (
    <div className="flyover" aria-hidden="true">
      {/* atmospheric sky wash */}
      <div className="sky" />

      {/* far skyline — small, pale, slow */}
      <div className="layer far">
        <div className="track">
          <SkylineStrip variant="far" />
          <SkylineStrip variant="far" />
        </div>
      </div>

      {/* mid skyline */}
      <div className="layer mid">
        <div className="track">
          <SkylineStrip variant="mid" />
          <SkylineStrip variant="mid" />
        </div>
      </div>

      {/* near skyline — tall, saturated, fast */}
      <div className="layer near">
        <div className="track">
          <SkylineStrip variant="near" />
          <SkylineStrip variant="near" />
        </div>
      </div>

      {/* foreground clouds streaking past to sell altitude + speed */}
      <div className="layer clouds">
        <div className="track">
          <CloudStrip />
          <CloudStrip />
        </div>
      </div>
    </div>
  );
}

type Variant = "far" | "mid" | "near";

// Per-depth styling. Closer layers are taller, more saturated, and span less of
// the tile width so their buildings appear larger.
const STYLE: Record<Variant, { fill: string; win: string; opacity: number; base: number; span: number; gap: number }> = {
  far: { fill: "#cfe7e9", win: "#eaf6f7", opacity: 0.8, base: 150, span: 90, gap: 26 },
  mid: { fill: "#9fd2d8", win: "#f0fafb", opacity: 0.9, base: 230, span: 120, gap: 30 },
  near: { fill: "#5fa9b3", win: "#eafaff", opacity: 1, base: 330, span: 170, gap: 40 },
};

// Deterministic height rhythm so the two duplicated copies tile seamlessly.
const RHYTHM = [0.62, 0.95, 0.74, 1, 0.55, 0.86, 0.7, 0.98, 0.6, 0.9, 0.78, 0.66];

function SkylineStrip({ variant }: { variant: Variant }) {
  const s = STYLE[variant];
  const H = 600;
  const W = 1440;
  const buildings: JSX.Element[] = [];
  const windows: JSX.Element[] = [];

  let x = 0;
  let i = 0;
  while (x < W) {
    const w = s.span * (0.7 + (RHYTHM[i % RHYTHM.length] % 0.5));
    const h = s.base * (0.6 + RHYTHM[i % RHYTHM.length] * 0.6);
    const y = H - h;
    buildings.push(<rect key={`b${i}`} x={x} y={y} width={w} height={h} rx={5} />);

    // sparse window grid
    const cols = Math.max(2, Math.floor(w / 26));
    const rows = Math.max(2, Math.floor(h / 40));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if ((r + c + i) % 3 === 0) continue; // skip some for a lived-in look
        windows.push(
          <rect
            key={`w${i}-${r}-${c}`}
            x={x + 9 + c * ((w - 14) / cols)}
            y={y + 12 + r * 34}
            width={9}
            height={12}
            rx={2}
          />
        );
      }
    }
    x += w + s.gap;
    i++;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <g fill={s.fill} opacity={s.opacity}>{buildings}</g>
      <g fill={s.win} opacity={Math.min(1, s.opacity)}>{windows}</g>
    </svg>
  );
}

// Soft cloud puffs drifting across the foreground.
function CloudStrip() {
  const W = 1440;
  const H = 600;
  const clouds = [
    { x: 120, y: 90, s: 1.1 },
    { x: 520, y: 150, s: 0.8 },
    { x: 900, y: 70, s: 1.3 },
    { x: 1240, y: 170, s: 0.7 },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg">
      <g fill="#ffffff" opacity="0.7">
        {clouds.map((c, i) => (
          <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
            <ellipse cx="0" cy="0" rx="70" ry="26" />
            <ellipse cx="48" cy="8" rx="54" ry="22" />
            <ellipse cx="-46" cy="10" rx="46" ry="20" />
          </g>
        ))}
      </g>
    </svg>
  );
}
