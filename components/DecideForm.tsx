"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import Notice from "@/components/Notice";
import { decide } from "@/app/dunning/actions";

// 대기 초안의 승인 · 반려 칸. 화면 움직임만 — 승인 코드 검사 · 저장은 서버 액션(decide)이 한다.
export type DecideState = { ok: boolean; message: string };

export default function DecideForm({ draftId }: { draftId: number }) {
  const [state, formAction, pending] = useActionState(decide, { ok: false, message: "" });
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [reason, setReason] = useState("");

  // 한 번 보내면 승인 코드는 늘 비운다(화면에 남기지 않는다)
  useEffect(() => {
    setCode("");
    if (state.ok) setReason("");
  }, [state]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // 누른 단추(승인 · 반려)의 decision 값도 함께 보낸다
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(e.currentTarget, submitter);
    startTransition(() => formAction(data));
  }

  const id = `decide-${draftId}`;
  const reasonLen = reason.trim().length;

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-line p-3">
      {/* Enter 키로 승인되지 않게 — 맨 앞의 막힌 기본 단추가 '입력하다 Enter'를 막는다 */}
      <button type="submit" disabled hidden aria-hidden="true" tabIndex={-1} />
      <input type="hidden" name="draftId" value={draftId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-nickname`} className="text-sm font-semibold text-ink">
            승인자 별명
          </label>
          <input
            id={`${id}-nickname`}
            name="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder="실명 대신 별명(20자 이내)"
            className="mt-1 block min-h-11 w-full rounded-md border border-line bg-bg px-3 text-ink"
          />
        </div>
        <div>
          <label htmlFor={`${id}-code`} className="text-sm font-semibold text-ink">
            승인 코드
          </label>
          <input
            id={`${id}-code`}
            name="code"
            type="password"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 block min-h-11 w-full rounded-md border border-line bg-bg px-3 text-ink"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-reason`} className="text-sm font-semibold text-ink">
          반려 사유 <span className="font-normal text-muted">(반려할 때만 · 5–200자)</span>
        </label>
        <textarea
          id={`${id}-reason`}
          name="reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="예: 지난주 입금 약속을 받았음 — 다음 주에 다시 보기"
          className="mt-1 block w-full rounded-md border border-line bg-bg p-3 text-ink"
        />
        <p className={`num mt-1 text-right text-sm ${reasonLen > 200 ? "font-semibold text-warn" : "text-muted"}`}>
          {reasonLen}/200
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 font-semibold text-white disabled:opacity-60"
        >
          승인
        </button>
        <button
          type="submit"
          name="decision"
          value="reject"
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-md border border-warn bg-bg px-4 font-semibold text-warn disabled:opacity-60"
        >
          반려
        </button>
        {pending ? <span className="self-center text-sm text-muted">처리 중…</span> : null}
      </div>

      {state.message ? <Notice tone={state.ok ? "ok" : "warn"} title={state.message} /> : null}
    </form>
  );
}
