// Decorative beach + condo skyline scene used behind the hero. Pure SVG so it
// stays crisp at any width and adds no asset weight. Anchored to the bottom of
// the hero (xMidYMax slice) with the sky kept light up top so headline copy
// stays readable.
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
            <stop offset="0" stopColor="#e3f7fb" />
            <stop offset="0.55" stopColor="#dff1f7" />
            <stop offset="1" stopColor="#ffe9d4" />
          </linearGradient>
          <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff6e6" />
            <stop offset="0.5" stopColor="#ffe6b8" />
            <stop offset="1" stopColor="#ffe6b8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5fccd6" />
            <stop offset="1" stopColor="#0891b2" />
          </linearGradient>
          <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f7e7c4" />
            <stop offset="1" stopColor="#eccf93" />
          </linearGradient>
          <linearGradient id="towerFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#13a092" />
            <stop offset="1" stopColor="#0a7d8f" />
          </linearGradient>
        </defs>

        {/* sky + sun */}
        <rect width="1440" height="600" fill="url(#sky)" />
        <circle cx="1120" cy="150" r="220" fill="url(#sun)" />
        <circle cx="1120" cy="150" r="58" fill="#fff1d6" />

        {/* far skyline haze */}
        <g fill="#bfe3e6" opacity="0.7">
          <rect x="60" y="250" width="70" height="120" rx="3" />
          <rect x="150" y="220" width="54" height="150" rx="3" />
          <rect x="1230" y="240" width="64" height="130" rx="3" />
          <rect x="1320" y="265" width="80" height="105" rx="3" />
        </g>

        {/* mid condo towers */}
        <g fill="#5cb6bd">
          <rect x="250" y="210" width="120" height="170" rx="5" />
          <rect x="1080" y="225" width="120" height="155" rx="5" />
        </g>
        {/* mid tower windows */}
        <g fill="#eafafb" opacity="0.65">
          {midWindows(266, 232, 6, 4)}
          {midWindows(1096, 247, 6, 4)}
        </g>

        {/* foreground condo towers */}
        <g fill="url(#towerFront)">
          <rect x="400" y="150" width="170" height="230" rx="7" />
          <rect x="600" y="110" width="200" height="270" rx="7" />
          <rect x="830" y="170" width="160" height="210" rx="7" />
        </g>
        {/* rooftop railings */}
        <g fill="#0a7d8f">
          <rect x="600" y="100" width="200" height="12" rx="4" />
          <rect x="400" y="142" width="170" height="10" rx="4" />
          <rect x="830" y="162" width="160" height="10" rx="4" />
        </g>
        {/* foreground tower windows */}
        <g fill="#dff7f4" opacity="0.85">
          {windowGrid(418, 175, 8, 5)}
          {windowGrid(620, 135, 9, 6)}
          {windowGrid(848, 195, 7, 5)}
        </g>

        {/* ocean */}
        <rect x="0" y="378" width="1440" height="120" fill="url(#ocean)" />
        <g stroke="#eafdff" strokeWidth="3" strokeLinecap="round" opacity="0.55" fill="none">
          <path d="M120 410 q40 -10 80 0 t80 0" />
          <path d="M760 432 q40 -10 80 0 t80 0" />
          <path d="M380 452 q40 -10 80 0 t80 0" />
          <path d="M1080 414 q40 -10 80 0 t80 0" />
        </g>

        {/* sand */}
        <path d="M0 470 q360 -28 720 -6 t720 4 V600 H0 Z" fill="url(#sand)" />
        <path d="M0 470 q360 -28 720 -6 t720 4" fill="none" stroke="#fff6e2" strokeWidth="6" opacity="0.6" />

        {/* palm tree */}
        <g>
          <path d="M150 600 C 156 540 150 500 138 470" fill="none" stroke="#7a5a32" strokeWidth="12" strokeLinecap="round" />
          <g fill="#2f9c78">
            <path d="M138 470 C 110 452 80 452 58 470 C 92 462 118 470 138 478 Z" />
            <path d="M138 470 C 166 452 196 452 218 470 C 184 462 158 470 138 478 Z" />
            <path d="M138 470 C 120 442 110 414 116 388 C 126 416 134 444 142 470 Z" />
            <path d="M138 470 C 156 444 178 426 206 420 C 176 436 154 452 142 472 Z" />
            <path d="M138 470 C 120 444 98 426 70 420 C 100 436 122 452 134 472 Z" />
          </g>
        </g>
      </svg>
    </div>
  );
}

// Window grids for the foreground (brighter) towers.
function windowGrid(x: number, y: number, rows: number, cols: number) {
  const cells = [];
  const w = 14;
  const h = 16;
  const gx = 26;
  const gy = 30;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(
        <rect key={`${x}-${y}-${r}-${c}`} x={x + c * gx} y={y + r * gy} width={w} height={h} rx={2} />
      );
    }
  }
  return cells;
}

// Smaller, softer windows for the mid-distance towers.
function midWindows(x: number, y: number, rows: number, cols: number) {
  const cells = [];
  const w = 12;
  const h = 12;
  const gx = 22;
  const gy = 26;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(
        <rect key={`m-${x}-${y}-${r}-${c}`} x={x + c * gx} y={y + r * gy} width={w} height={h} rx={2} />
      );
    }
  }
  return cells;
}
