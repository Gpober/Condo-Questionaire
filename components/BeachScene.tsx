// Decorative beach + condo skyline scene used behind the hero and the login
// screen. Pure SVG so it stays crisp at any width and adds no asset weight.
// Calm/minimal styling: flat muted bands, a simplified skyline, and soft color
// so it reads as a quiet backdrop rather than a busy illustration. Anchored to
// the bottom (xMidYMax slice) with the sky kept light up top so copy stays
// readable.
export default function BeachScene() {
  return (
    <div className="hero-scene" aria-hidden="true">
      <svg
        viewBox="0 0 1440 600"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#eef8fb" />
            <stop offset="1" stopColor="#dcf0f3" />
          </linearGradient>
          <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9fd9df" />
            <stop offset="1" stopColor="#6fc4cf" />
          </linearGradient>
        </defs>

        {/* sky + soft sun */}
        <rect width="1440" height="600" fill="url(#sky)" />
        <circle cx="1130" cy="170" r="66" fill="#fdf2dd" opacity="0.9" />

        {/* distant skyline — single soft tone, simple shapes */}
        <g fill="#cfe7e9">
          <rect x="120" y="300" width="74" height="120" rx="4" />
          <rect x="210" y="270" width="58" height="150" rx="4" />
          <rect x="1190" y="288" width="70" height="132" rx="4" />
          <rect x="1280" y="266" width="64" height="154" rx="4" />
        </g>

        {/* foreground condo towers — calm muted teal, sparse windows */}
        <g fill="#8ec9cf">
          <rect x="430" y="232" width="150" height="188" rx="6" />
          <rect x="610" y="196" width="180" height="224" rx="6" />
          <rect x="820" y="252" width="140" height="168" rx="6" />
        </g>
        <g fill="#f2fafb" opacity="0.7">
          {windows(452, 258, 5, 4)}
          {windows(636, 222, 6, 5)}
          {windows(842, 278, 4, 4)}
        </g>

        {/* calm ocean band */}
        <rect x="0" y="420" width="1440" height="96" fill="url(#ocean)" />

        {/* sand */}
        <path d="M0 500 q360 -20 720 -4 t720 2 V600 H0 Z" fill="#f4e7c8" />
      </svg>
    </div>
  );
}

// Sparse window grid for the foreground towers.
function windows(x: number, y: number, rows: number, cols: number) {
  const cells = [];
  const w = 13;
  const h = 15;
  const gx = 30;
  const gy = 34;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(
        <rect key={`${x}-${y}-${r}-${c}`} x={x + c * gx} y={y + r * gy} width={w} height={h} rx={2} />
      );
    }
  }
  return cells;
}
