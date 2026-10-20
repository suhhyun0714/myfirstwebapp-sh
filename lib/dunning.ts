// 독촉 단계 · 말투 · 금액 글자 — 계산만 한다(순수 함수). 초안 로봇(scripts/draft-dunning.ts)과 화면이 함께 쓴다.
// 단계 · 말투는 코드가 정한다 — AI 엔진에게 맡기지 않는다.

export const STAGES = ["D+7", "D+15", "D+30"] as const;
export const TONES = ["T1", "T2", "T3"] as const;

export type Stage = (typeof STAGES)[number];
export type Tone = (typeof TONES)[number];
/** 단계 × 등급(S · A · B · C 칸 이름 그대로) → 말투 */
export type ToneMatrix = Record<Stage, Record<string, Tone>>;

/** 가장 오래 밀린 날 수 → 단계. 30 이상 D+30 · 15–29 D+15 · 7–14 D+7 · 1–6 대기 · 0 이하 확인 필요 */
export function stageOf(oldestOpenDays: number): Stage | "대기" | "확인 필요" {
  if (!Number.isFinite(oldestOpenDays) || oldestOpenDays <= 0) return "확인 필요";
  if (oldestOpenDays >= 30) return "D+30";
  if (oldestOpenDays >= 15) return "D+15";
  if (oldestOpenDays >= 7) return "D+7";
  return "대기";
}

export function isStage(v: string): v is Stage {
  return (STAGES as readonly string[]).includes(v);
}

/** data/tone_matrix.csv 글자 → 표. 열은 stage,S,A,B,C — 다르면 멈춘다(잘못 읽은 표로 말투를 정하지 않게). */
export function parseToneMatrix(csv: string): ToneMatrix {
  const lines = csv.replace(/^﻿/, "").trim().split(/\r?\n/);
  const header = lines[0].split(",").map((s) => s.trim());
  if (header.join(",") !== "stage,S,A,B,C") throw new Error(`tone_matrix.csv 열 이름이 다릅니다: ${header.join(",")}`);
  const matrix = {} as ToneMatrix;
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((s) => s.trim());
    const stage = cells[0];
    if (!isStage(stage)) throw new Error(`tone_matrix.csv에 모르는 단계: ${stage}`);
    const row: Record<string, Tone> = {};
    header.slice(1).forEach((grade, i) => {
      const tone = cells[i + 1];
      if (!(TONES as readonly string[]).includes(tone)) throw new Error(`tone_matrix.csv ${stage} × ${grade}의 말투가 이상합니다: ${tone}`);
      row[grade] = tone as Tone;
    });
    matrix[stage] = row;
  }
  for (const s of STAGES) if (!matrix[s]) throw new Error(`tone_matrix.csv에 ${s} 줄이 없습니다`);
  return matrix;
}

/** 단계 × 등급(grade 칸 그대로) → 말투. 표에 없으면 null(확인 필요). */
export function toneOf(matrix: ToneMatrix, stage: Stage, grade: string): Tone | null {
  return matrix[stage]?.[grade] ?? null;
}

const money = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 연체 금액 글자: 12345 → "USD 12,345.00" (메일 본문에 그대로 들어가는 모양) */
export function amountText(usd: number): string {
  return `USD ${money.format(usd)}`;
}
