import type { ReactNode } from "react";
import { Chest, HanbitFlag, PirateShip, Skull } from "@/components/TreasureIcons";

// 옛 보물지도 모양의 세계 지도(5대양 6대주) — 손으로 쓴 SVG, 그림 파일 · 지도 라이브러리 없음.
// 대륙 모양은 경도 · 위도 몇 점을 이은 대강의 윤곽이다(정확한 국경이 아니다).
// 바이어가 있는 지역 6곳만 누를 수 있고, 누르면 그 지역의 연체 바이어 쪽으로 간다.
// 그림 수 · 해적 · 깃발은 lib/treasure.ts가 계산한 값을 props로 받아 그리기만 한다.

type Pt = [number, number]; // [경도, 위도]

const K = 1000 / 350; // 경도 -170°–180°를 너비 1000에
const px = (lon: number) => (lon + 170) * K;
const py = (lat: number) => (80 - lat) * K;
const path = (pts: Pt[]) => `M${pts.map(([lo, la]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join("L")}Z`;

// 바이어가 없는 땅(누르지 않음)
const OTHER_LAND: Pt[][] = [
  // 그린란드
  [[-73, 78], [-60, 82], [-30, 83], [-20, 80], [-20, 72], [-42, 60], [-50, 64], [-55, 72]],
  // 아이슬란드
  [[-24, 65], [-14, 66], [-14, 64.5], [-22, 63.5]],
  // 스칸디나비아 · 러시아 · 중앙아시아
  [
    [5, 58], [5, 62], [15, 69], [25, 71], [40, 67], [60, 70], [80, 73], [100, 77], [120, 73], [140, 72],
    [160, 70], [180, 66], [178, 62], [160, 52], [156, 57], [142, 59], [138, 54], [132, 43], [122, 53],
    [118, 47], [110, 42], [95, 42], [80, 42], [75, 38], [70, 37], [62, 36], [54, 37.5], [48, 41], [42, 41],
    [40, 44], [38, 47], [34, 46], [32, 50], [30, 56], [23, 58], [28, 60], [18, 59], [13, 56], [10, 59],
  ],
  // 필리핀
  [[120, 18.5], [122, 18], [124, 13], [126, 7], [122, 7], [120, 14]],
  // 뉴기니
  [[131, -1], [141, -3], [150, -10], [143, -9], [137, -5], [133, -4]],
  // 오스트레일리아
  [
    [114, -22], [114, -34], [118, -35], [124, -34], [131, -31.5], [138, -35], [141, -38], [147, -38.5],
    [150, -37], [153, -28], [153, -25], [146, -19], [145, -14], [142, -11], [141, -17], [136, -12],
    [131, -12], [126, -14], [122, -18],
  ],
  // 뉴질랜드
  [[172, -35], [178, -38], [174, -42], [167, -46], [170, -43]],
];

// 바이어가 있는 지역 6곳 — 땅 모양과 그림 놓을 자리(경도 · 위도)
type Shape = {
  land: Pt[][];
  pile: Pt; // 보물상자 더미의 밑 가운데
  label: Pt;
  anchor?: "start" | "middle" | "end";
  skull?: Pt;
  ships?: Pt[];
  flag?: Pt;
};

const SHAPES: Record<string, Shape> = {
  americas: {
    land: [
      [
        [-168, 66], [-160, 71], [-140, 70], [-120, 70], [-95, 72], [-80, 73], [-62, 66], [-64, 60], [-56, 52],
        [-53, 47], [-66, 44], [-70, 42], [-76, 35], [-80, 32], [-80, 26], [-84, 30], [-90, 30], [-97, 27],
        [-97, 21], [-87, 21], [-88, 16], [-83, 10], [-78, 8], [-80, 7], [-86, 11], [-92, 14], [-95, 16],
        [-105, 20], [-110, 24], [-115, 30], [-117, 33], [-124, 40], [-124, 48], [-130, 55], [-140, 60],
        [-152, 58], [-165, 60],
      ],
      [
        [-77, 8], [-72, 12], [-62, 10], [-50, 0], [-35, -5], [-38, -13], [-41, -22], [-48, -26], [-58, -35],
        [-65, -42], [-68, -52], [-72, -54], [-75, -48], [-73, -38], [-71, -25], [-70, -18], [-77, -12],
        [-81, -5], [-80, 0], [-78, 7],
      ],
      // 쿠바
      [[-85, 22], [-80, 23], [-74, 20], [-77, 20], [-84, 21.5]],
    ],
    pile: [-100, 40],
    label: [-100, 31],
    skull: [-123, 43],
    ships: [[-140, 24], [-25, -15]],
  },
  "western-europe": {
    land: [
      [
        [-9, 43], [-9, 37], [-6, 36], [0, 38], [3, 42], [8, 44], [10, 44], [16, 38], [18, 40], [14, 45], [15, 47],
        [15, 54], [10, 54], [8, 57], [5, 53], [2, 51], [-2, 48], [-5, 48], [-1, 46], [-2, 43.5],
      ],
      [[-5, 50], [1, 51], [0, 53], [-2, 56], [-5, 58], [-6, 56], [-3, 54], [-5, 52]],
      [[-10, 52], [-6, 52], [-6, 55], [-8, 55]],
    ],
    pile: [7, 47],
    label: [-12, 44],
    anchor: "end",
    flag: [-15, 56],
  },
  "central-europe": {
    land: [
      [
        [15, 54], [22, 55], [30, 56], [32, 50], [30, 46], [28, 44], [28, 42], [36, 42], [42, 41], [44, 39],
        [42, 37], [36, 36], [30, 36.5], [26, 38], [26, 40], [24, 38], [22, 37], [20, 40], [18, 42], [14, 45],
        [15, 47],
      ],
    ],
    pile: [25, 47],
    label: [34, 53],
    anchor: "start",
  },
  "middle-east-africa": {
    land: [
      [
        [36, 36], [42, 37], [44, 39], [48, 41], [54, 37.5], [62, 36], [61, 30], [61, 25], [57, 26], [50, 30],
        [48, 29], [51, 24], [56, 25], [59, 22], [56, 18], [52, 16], [45, 13], [43, 13], [39, 21], [35, 28],
        [34, 31], [35, 33],
      ],
      [
        [-6, 35.5], [10, 37], [11, 33], [20, 31], [30, 31], [32, 31], [33, 28], [37, 20], [43, 12], [51, 11],
        [48, 4], [40, -3], [40, -11], [35, -20], [33, -26], [27, -34], [20, -35], [18, -30], [12, -18],
        [13, -12], [9, -1], [9, 4], [6, 4.5], [-5, 5], [-12, 8], [-17, 15], [-17, 21], [-10, 29],
      ],
      [[44, -13], [50, -15], [47, -25], [44, -24]],
    ],
    pile: [20, 10],
    label: [22, -2],
    skull: [46, 24],
    ships: [[60, 4], [29, 34]],
  },
  "east-asia": {
    land: [
      [
        [132, 43], [130, 42.5], [129.5, 35], [126.5, 34.5], [126, 38], [122, 40], [118, 39], [122, 37],
        [120, 33], [122, 30], [119, 25], [114, 22], [108, 21.5], [104, 22.5], [98, 24], [97, 28], [88, 28],
        [80, 31], [78, 35], [75, 38], [80, 42], [95, 42], [110, 42], [118, 47], [122, 53],
      ],
      [
        [130, 31], [131.5, 33], [135, 33.7], [140, 35], [141, 38], [141.5, 41], [145.5, 43.5], [142, 45.5],
        [140, 42.5], [139.5, 39], [136.5, 37], [132, 35.5], [130, 33.5],
      ],
      [[121, 25.3], [122, 24.5], [120.8, 22], [120.1, 23.2]],
    ],
    pile: [106, 33],
    label: [126, 27],
    anchor: "start",
  },
  "south-asia": {
    land: [
      [
        [70, 37], [75, 38], [78, 35], [80, 31], [88, 28], [97, 28], [98, 24], [104, 22.5], [108, 21.5],
        [106, 19], [109, 13], [107, 10.5], [105, 9], [101, 13], [99, 9], [101, 6], [103.5, 1.5], [101, 2.5],
        [98, 8], [98, 16], [94, 16], [92, 21], [88, 22], [86, 20], [80, 15], [80, 10], [77, 8], [73, 16],
        [72, 21], [67, 24], [61, 25], [61, 30], [62, 36],
      ],
      [[80, 9.8], [81.9, 7.5], [81, 6], [79.8, 7]],
      [[95, 5.5], [100, 2], [106, -5], [104, -5.5], [98, 0], [95, 4]],
      [[105.5, -6], [114, -7.5], [114, -8.5], [106, -7.5]],
      [[109, 1.5], [113, 3], [117, 7], [119, 5], [117, 1], [116, -4], [110, -3], [109, 0]],
      [[119, -5.5], [120, 0], [124, 1], [121, -1], [123, -4], [121, -5]],
    ],
    pile: [79, 21],
    label: [88, 3],
    anchor: "start",
    flag: [101, 17],
  },
};

const OCEANS: { name: string; at: Pt; anchor?: "start" | "middle" | "end" }[] = [
  { name: "태 평 양", at: [-145, 2] },
  { name: "태 평 양", at: [176, 12], anchor: "end" },
  { name: "대 서 양", at: [-42, 26] },
  { name: "인 도 양", at: [75, -25] },
  { name: "북 극 해", at: [10, 84] },
  { name: "남 극 해", at: [20, -56] },
];

const CHEST = 30; // 지도 안 보물상자 한 개의 크기(지도 단위)

// 보물상자 더미: 밑줄 ceil(n/2)개, 윗줄 나머지(2개 이하면 한 줄)
function ChestPile({ n, at }: { n: number; at: Pt }) {
  const rows = n <= 2 ? [n] : [Math.ceil(n / 2), Math.floor(n / 2)];
  const x0 = px(at[0]);
  const y0 = py(at[1]);
  const out: ReactNode[] = [];
  rows.forEach((count, r) => {
    for (let i = 0; i < count; i++) {
      out.push(
        <Chest
          key={`${r}-${i}`}
          x={x0 - (count * CHEST) / 2 + i * CHEST}
          y={y0 - (r + 1) * CHEST * 0.8}
          width={CHEST}
          height={CHEST}
        />,
      );
    }
  });
  return <g>{out}</g>;
}

export type MapRegion = {
  region: string;
  slug: string | null;
  chests: number;
  pirate: boolean;
  flag: boolean;
  overdueCount: number;
};

// 한 지역으로 확대할 때의 보는 칸: 땅 · 그림 자리를 모두 담고, 너비 400 이상 · 높이는 너비의 절반 이상
function focusBox(s: Shape): string {
  const pts = [s.pile, s.label, ...s.land.flat(), ...(s.ships ?? []), ...(s.skull ? [s.skull] : []), ...(s.flag ? [s.flag] : [])];
  const xs = pts.map((p) => px(p[0]));
  const ys = pts.map((p) => py(p[1]));
  const x0 = Math.min(...xs) - 80;
  const x1 = Math.max(...xs) + 80;
  const y0 = Math.min(...ys) - 60;
  const y1 = Math.max(...ys) + 40;
  const w = Math.max(x1 - x0, 400);
  const h = Math.max(y1 - y0, w * 0.5);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return [cx - w / 2, cy - h / 2, w, h].map((v) => Math.round(v)).join(" ");
}

export default function TreasureWorldMap({ regions, focus }: { regions: MapRegion[]; focus?: string }) {
  const halo = { paintOrder: "stroke" as const, strokeLinejoin: "round" as const };
  const focused = focus ? SHAPES[focus] : undefined;
  return (
    <svg
      viewBox={focused ? focusBox(focused) : "0 -30 1000 445"}
      className="block h-auto w-full"
      role="img"
      aria-label={
        focused
          ? "이 지역을 크게 보여 주는 옛 보물지도"
          : "바이어가 있는 지역 6곳을 표시한 옛 보물지도 모양의 세계 지도"
      }
    >
      <rect x="-300" y="-300" width="1600" height="1000" className="fill-parchment" />

      {/* 경위선(30°마다) */}
      <g className="fill-none stroke-sepia/25" strokeWidth="1" strokeDasharray="2 6">
        {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => (
          <line key={`lon${lon}`} x1={px(lon)} x2={px(lon)} y1={-30} y2={415} />
        ))}
        {[60, 30, -30].map((lat) => (
          <line key={`lat${lat}`} x1={0} x2={1000} y1={py(lat)} y2={py(lat)} />
        ))}
      </g>
      <line x1={0} x2={1000} y1={py(0)} y2={py(0)} className="stroke-sepia/40" strokeWidth="1" strokeDasharray="8 6" />

      {/* 대양 이름 */}
      {OCEANS.map((o) => (
        <text
          key={o.name + o.at.join()}
          x={px(o.at[0])}
          y={py(o.at[1])}
          textAnchor={o.anchor ?? "middle"}
          className="fill-sepia italic"
          fontSize="20"
          letterSpacing="2"
        >
          {o.name}
        </text>
      ))}

      {/* 바이어가 없는 땅 */}
      <g className="fill-parchment stroke-sepia/60" strokeWidth="1.2" strokeDasharray="3 3">
        {OTHER_LAND.map((pts, i) => (
          <path key={i} d={path(pts)} />
        ))}
      </g>

      {/* 바이어가 있는 지역 6곳 — 누르면 그 지역 쪽으로 */}
      {regions.map((r) => {
        const s = r.slug ? SHAPES[r.slug] : undefined;
        if (!s || !r.slug) return null;
        return (
          <a
            key={r.slug}
            href={`/regions/${r.slug}`}
            className="group cursor-pointer outline-none"
            aria-label={`${r.region} — 연체 바이어 ${r.overdueCount}곳 보기`}
          >
            {s.land.map((pts, i) => (
              <path
                key={i}
                d={path(pts)}
                className="fill-parchment-deep stroke-sepia transition-colors group-hover:fill-gold/40 group-focus-visible:fill-gold/40"
                strokeWidth={r.slug === focus ? 3 : 1.5}
                strokeLinejoin="round"
              />
            ))}
            <ChestPile n={r.chests} at={s.pile} />
            {r.pirate && s.skull ? (
              <Skull x={px(s.skull[0]) - 16} y={py(s.skull[1]) - 16} width={32} height={32} />
            ) : null}
            {r.pirate
              ? s.ships?.map((p) => (
                  <PirateShip key={p.join()} x={px(p[0]) - 24} y={py(p[1]) - 22} width={48} height={43} />
                ))
              : null}
            {r.flag && s.flag ? <HanbitFlag x={px(s.flag[0])} y={py(s.flag[1]) - 40} width={30} height={40} /> : null}
            <text
              x={px(s.label[0])}
              y={py(s.label[1])}
              textAnchor={s.anchor ?? "middle"}
              className="fill-ink stroke-parchment group-hover:underline"
              strokeWidth="5"
              style={halo}
              fontSize="22"
              fontWeight="700"
            >
              {r.region}
            </text>
          </a>
        );
      })}

      {/* 나침반 */}
      <g transform={`translate(${px(-150)} ${py(-38)})`} className="stroke-sepia" strokeWidth="1.5">
        <circle r="34" className="fill-none" />
        <circle r="4" className="fill-sepia" />
        <path d="M0 -44L7 0L0 44L-7 0Z" className="fill-parchment-deep" />
        <path d="M-44 0L0 -7L44 0L0 7Z" className="fill-parchment-deep" />
        <path d="M0 -44L7 0L-7 0Z" className="fill-sepia" />
        <text y="-50" textAnchor="middle" className="fill-sepia stroke-none" fontSize="18" fontWeight="700">
          북
        </text>
      </g>

      <text x="985" y="405" textAnchor="end" className="fill-sepia italic" fontSize="16">
        한빛 항해도 · 2026-09-30
      </text>
    </svg>
  );
}
