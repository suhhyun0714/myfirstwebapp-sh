"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import Notice from "@/components/Notice";
import { addReview } from "@/app/buyers/[id]/actions";

// 확인 기록 입력 칸. 화면 움직임만 — 검사 · 저장은 서버 액션(addReview)이 한다.
export type ReviewState = { ok: boolean; message: string };

const STATUSES = ["확인 필요", "확인 완료", "보류"] as const;

// 상태 배지: 색 + 글자(색만으로 구분하지 않는다). 상세 · 첫 화면이 같이 쓴다.
const BADGE: Record<string, string> = {
  "확인 필요": "border-warn text-warn",
  "확인 완료": "border-accent text-accent",
  보류: "border-line text-muted",
};

export function ReviewStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded border px-1.5 text-sm font-semibold ${BADGE[status] ?? "border-line text-muted"}`}>
      {status}
    </span>
  );
}

export default function ReviewForm({ buyerId }: { buyerId: string }) {
  const [state, formAction, pending] = useActionState(addReview, { ok: false, message: "" });
  const [status, setStatus] = useState<string>("확인 필요");
  const [memo, setMemo] = useState("");
  const [reviewer, setReviewer] = useState("");

  // 저장되면 메모만 비운다(상태 · 별명은 남긴다)
  useEffect(() => {
    if (state.ok) setMemo("");
  }, [state]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-line p-4">
      <input type="hidden" name="buyerId" value={buyerId} />

      <fieldset>
        <legend className="text-sm font-semibold text-ink">상태</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <label
              key={s}
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm ${
                status === s ? "border-accent text-accent" : "border-line text-ink"
              }`}
            >
              <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} />
              {s}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="review-memo" className="text-sm font-semibold text-ink">
          메모
        </label>
        <textarea
          id="review-memo"
          name="memo"
          rows={3}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: 다음 주 입금 약속 — 전화로 확인"
          className="mt-2 block w-full rounded-md border border-line bg-bg p-3 text-ink"
        />
        <p className={`num mt-1 text-right text-sm ${memo.trim().length > 200 ? "font-semibold text-warn" : "text-muted"}`}>
          {memo.trim().length}/200
        </p>
      </div>

      <div>
        <label htmlFor="review-reviewer" className="text-sm font-semibold text-ink">
          확인한 사람(별명)
        </label>
        <input
          id="review-reviewer"
          name="reviewer"
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          placeholder="실명 대신 별명"
          className="mt-2 block min-h-11 w-full rounded-md border border-line bg-bg px-3 text-ink"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "저장 중…" : "기록 남기기"}
      </button>

      {state.message ? <Notice tone={state.ok ? "ok" : "warn"} title={state.message} /> : null}
    </form>
  );
}
