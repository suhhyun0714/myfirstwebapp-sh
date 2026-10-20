"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import Notice from "@/components/Notice";
import { addReply } from "@/app/buyers/[id]/actions";

// 확인 기록에 댓글(팔로업) 달기. 화면 움직임만 — 검사 · 저장은 서버 액션(addReply)이 한다.
// 시각 글자는 서버가 만든 것을 replies로 받아 그대로 보여 준다.
export type ReplyView = { id: number; memo: string; reviewer: string; when: string };

export default function ReplyForm({ reviewId, replies }: { reviewId: number; replies: ReplyView[] }) {
  const [state, formAction, pending] = useActionState(addReply, { ok: false, message: "" });
  const [open, setOpen] = useState(false);
  const [memo, setMemo] = useState("");
  const [reviewer, setReviewer] = useState("");

  // 저장되면 댓글 칸만 비운다(별명은 남긴다)
  useEffect(() => {
    if (state.ok) setMemo("");
  }, [state]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <div className="space-y-2">
      {replies.length > 0 ? (
        <ul className="space-y-1 border-l-2 border-line pl-3">
          {replies.map((r) => (
            <li key={r.id} className="text-sm">
              <p className="whitespace-pre-line break-words text-ink">{r.memo}</p>
              <p className="text-xs text-muted">
                {r.reviewer} · <span className="num">{r.when}</span>
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <form onSubmit={onSubmit} className="space-y-2">
          <input type="hidden" name="reviewId" value={reviewId} />
          <label className="block">
            <span className="sr-only">댓글</span>
            <textarea
              name="memo"
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 수요일에 다시 전화함 — 입금 확인"
              className="block w-full rounded-md border border-line bg-bg p-2 text-sm text-ink"
            />
          </label>
          <p className={`num text-right text-xs ${memo.trim().length > 200 ? "font-semibold text-warn" : "text-muted"}`}>
            {memo.trim().length}/200
          </p>
          <label className="block">
            <span className="sr-only">확인한 사람(별명)</span>
            <input
              name="reviewer"
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              placeholder="실명 대신 별명"
              className="block min-h-11 w-full rounded-md border border-line bg-bg px-2 text-sm text-ink"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-11 items-center rounded-md bg-accent px-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "저장 중…" : "댓글 남기기"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-11 items-center rounded-md border border-line px-3 text-sm text-ink"
            >
              닫기
            </button>
          </div>
          {state.message ? <Notice tone={state.ok ? "ok" : "warn"} title={state.message} /> : null}
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline"
        >
          댓글 달기
        </button>
      )}
    </div>
  );
}
