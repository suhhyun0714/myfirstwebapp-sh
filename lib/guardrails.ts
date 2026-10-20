// 독촉 초안 가드레일 G1–G7 — 코드가 채점한다(순수 함수). 하나라도 걸리면 초안은 blocked.
// 글자는 NFC로 맞추고 대소문자를 무시해 견준다(G3의 IBAN · SWIFT · BIC만 대문자 그대로).

export const PAID_SENTENCE = "If you have already paid, please disregard this message.";
export const SIGN_EMAIL = "credit@hanbitprecision.example";
export const MAX_WORDS = 180;

export const GUARDRAILS = [
  { id: "G1", label: "금액 정확" },
  { id: "G2", label: "바이어 이름" },
  { id: "G3", label: "계좌 없음" },
  { id: "G4", label: "법적 표현 없음" },
  { id: "G5", label: "이미 냈다면 무시" },
  { id: "G6", label: "180단어 이하" },
  { id: "G7", label: "링크 · 다른 메일 주소 없음" },
] as const;

export type GuardrailId = (typeof GUARDRAILS)[number]["id"];
export type Check = { id: GuardrailId; label: string; ok: boolean; note: string };

const nfc = (s: string) => s.normalize("NFC");
const lower = (s: string) => nfc(s).toLowerCase();
const uniq = (list: string[]) => [...new Set(list)];

// 금액 표기: USD 1,234.00 · US$1,234 · $1,234 (US$를 $보다 먼저 찾는다)
const MONEY_RE = /\b(?:USD|US\$)\s?\d[\d,]*(?:\.\d+)?|\$\s?\d[\d,]*(?:\.\d+)?/gi;
const ACCOUNT_RE = /\b(?:account number|account no\.|bank account|bank details|new account|routing number|swift code)(?![a-z])/gi;
const ACCOUNT_UPPER_RE = /\b(?:IBAN|SWIFT|BIC)\b/g; // 대문자 그대로만 — 'swift payment'는 통과
const LEGAL_RE = /\b(?:lawsuit|legal action|court|police|attorney|criminal)\b/gi;
const LINK_RE = /https?:\/\/|www\./gi;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi;

const found = (re: RegExp, text: string) => uniq(text.match(re) ?? []);

/** 초안 하나를 G1–G7로 채점한다. 걸린 검사의 note에는 걸린 글자를 적는다. */
export function runGuardrails(input: { subject: string; body: string; buyerName: string; amount: string }): Check[] {
  const subject = nfc(input.subject);
  const body = nfc(input.body);
  const both = `${subject}\n${body}`;
  const amount = lower(input.amount);

  // G1 — 그 바이어의 금액 글자가 있고, 다른 금액 표기가 없다
  const others = found(MONEY_RE, body).filter((m) => lower(m).replace(/\s+/g, " ") !== amount);
  const hasAmount = lower(body).includes(amount);
  const g1 = !hasAmount ? `금액 글자 없음(${input.amount})` : others.length ? others.join(" · ") : "";

  // G2 — 바이어 이름 그대로
  const g2 = lower(body).includes(lower(input.buyerName)) ? "" : `이름 없음(${input.buyerName})`;

  // G3 — 계좌 관련 글자
  const g3 = [...found(ACCOUNT_RE, both), ...found(ACCOUNT_UPPER_RE, both), ...(both.includes("계좌") ? ["계좌"] : [])];

  // G4 — 법적 표현(낱말 경계 — courtesy는 통과)
  const g4 = found(LEGAL_RE, both);

  // G5 — 이미 냈다면 무시 문장 그대로
  const g5 = lower(body).includes(lower(PAID_SENTENCE)) ? "" : "문장 없음";

  // G6 — 낱말 수
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const g6 = words <= MAX_WORDS ? "" : `${words}단어`;

  // G7 — 링크 · 서명 말고 다른 메일 주소
  const links = found(LINK_RE, both);
  const emails = found(EMAIL_RE, both).filter((e) => lower(e) !== SIGN_EMAIL);
  const g7 = [...links, ...emails];

  const notes: Record<GuardrailId, string> = {
    G1: g1,
    G2: g2,
    G3: g3.join(" · "),
    G4: g4.join(" · "),
    G5: g5,
    G6: g6,
    G7: g7.join(" · "),
  };
  return GUARDRAILS.map(({ id, label }) => ({ id, label, ok: notes[id] === "", note: notes[id] }));
}

/** DB의 checks(Json) → 검사 7칸. 모양이 어긋난 칸은 '걸림 · 확인 필요'로 본다(통과로 꾸미지 않는다). */
export function readChecks(json: unknown): Check[] {
  const list = Array.isArray(json) ? json : [];
  return GUARDRAILS.map(({ id, label }) => {
    const c = list.find((x) => x && typeof x === "object" && (x as { id?: unknown }).id === id) as
      | { ok?: unknown; note?: unknown }
      | undefined;
    if (!c || typeof c.ok !== "boolean") return { id, label, ok: false, note: "확인 필요" };
    return { id, label, ok: c.ok, note: typeof c.note === "string" ? c.note : "" };
  });
}

/** 걸린 검사 번호들: ["G1", "G5"] */
export function failedIds(checks: Check[]): GuardrailId[] {
  return checks.filter((c) => !c.ok).map((c) => c.id);
}
