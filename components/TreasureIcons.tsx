// 보물 지도 그림(손으로 쓴 SVG · 이모지 아님). 그림은 뜻을 나르지 않는다 — 언제나 옆에 글자를 함께 둔다(aria-hidden).

import type { SVGProps } from "react";

// x · y · width · height를 주면 지도(SVG) 안에 그대로 놓인다.
type P = SVGProps<SVGSVGElement>;

/** 보물상자 — 금액 크기만큼 여러 개 */
export function Chest(props: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M4 11V9a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2z"
        className="fill-gold stroke-sepia"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="4" y="11" width="16" height="9" rx="1" className="fill-gold stroke-sepia" strokeWidth="1.5" />
      <path d="M4 14h16M8 5v15M16 5v15" className="fill-none stroke-sepia" strokeWidth="1" />
      <rect x="10.5" y="10" width="3" height="4" rx="0.5" className="fill-sepia" />
    </svg>
  );
}

/** 해골 — 위험(C등급 · 해적 바다) */
export function Skull(props: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 3c-4.4 0-8 3.1-8 7.2 0 2.4 1.2 4.3 3 5.5V19a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3.3c1.8-1.2 3-3.1 3-5.5C20 6.1 16.4 3 12 3z"
        className="fill-parchment stroke-ink"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="11" r="1.8" className="fill-ink" />
      <circle cx="15" cy="11" r="1.8" className="fill-ink" />
      <path d="M12 13.5l-1 2h2z" className="fill-ink" />
      <path d="M10 17v3M12 17v3M14 17v3" className="stroke-ink" strokeWidth="1" />
    </svg>
  );
}

/** 해적선 — 해적 바다 둘레 */
export function PirateShip(props: P) {
  return (
    <svg viewBox="0 0 36 32" aria-hidden="true" {...props}>
      <path d="M18 2h6l-2 1.5 2 1.5h-6z" className="fill-grade-c" />
      <path d="M18 2v18" className="stroke-sepia" strokeWidth="1.5" />
      <path d="M19 6h10l-2 11h-8z" className="fill-ink" />
      <path d="M17 8H9l2 9h6z" className="fill-ink" />
      <circle cx="23.5" cy="11" r="2" className="fill-parchment" />
      <path d="M4 20h28l-4 7H8z" className="fill-sepia" />
      <path d="M2 30q3-2.5 6 0t6 0t6 0t6 0t6 0" className="fill-none stroke-sepia" strokeWidth="1" />
    </svg>
  );
}

/** 한빛 깃발 — 연체가 적은 섬(해 = 한빛) */
export function HanbitFlag(props: P) {
  return (
    <svg viewBox="0 0 24 32" aria-hidden="true" {...props}>
      <path d="M5 30V3" className="stroke-sepia" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 4h15l-3 5 3 5H6z" className="fill-accent stroke-sepia" strokeWidth="1" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" className="fill-bg" />
      <path d="M1 31q4-3 8 0" className="fill-none stroke-sepia" strokeWidth="1.5" />
    </svg>
  );
}

/** 섬 모양 + 물결 — 바다(parchment-deep) 위에 놓는다 */
export function IslandShape(props: P) {
  return (
    <svg viewBox="0 0 160 80" preserveAspectRatio="none" aria-hidden="true" {...props}>
      <path
        d="M24 46C14 30 34 14 62 18C84 8 128 12 138 32C150 52 132 68 104 66C78 74 36 68 24 46Z"
        className="fill-parchment stroke-sepia"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M6 72q4-3 8 0t8 0M140 10q4-3 8 0t8 0"
        className="fill-none stroke-sepia"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
