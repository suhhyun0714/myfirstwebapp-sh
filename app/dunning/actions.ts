"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { DecideState } from "@/components/DecideForm";
import { db } from "@/lib/db";

// 대기 초안 승인 · 반려. 승인 코드는 서버에서만 견주고, 값은 화면 · 로그 · 응답에 쓰지 않는다.
// 승인해도 메일은 나가지 않는다 — 상태가 '발송 대기'로 바뀌고 감사 기록이 한 줄 쌓일 뿐이다.

/** 길이가 달라도 같은 시간에 견주도록 해시끼리 비교한다 */
function sameCode(a: string, b: string) {
  const h = (s: string) => createHash("sha256").update(s, "utf8").digest();
  return timingSafeEqual(h(a), h(b));
}

export async function decide(_prev: DecideState, formData: FormData): Promise<DecideState> {
  // 1. 승인 코드가 설정돼 있는지
  const pin = process.env.APPROVER_PIN?.trim();
  if (!pin) return { ok: false, message: "승인 코드가 설정되지 않았습니다" };

  // 2. 입력 검사(앞뒤 공백 제거)
  const id = Number(String(formData.get("draftId") ?? "").trim());
  const decision = String(formData.get("decision") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!Number.isInteger(id) || id < 1) return { ok: false, message: "초안 번호가 이상합니다 — 새로 고친 뒤 다시 눌러 주세요" };
  if (decision !== "approve" && decision !== "reject") return { ok: false, message: "'승인' 또는 '반려' 단추를 눌러 주세요" };
  if (!nickname) return { ok: false, message: "승인자 별명을 적어 주세요" };
  if (nickname.length > 20) return { ok: false, message: "별명은 20자 이내로 적어 주세요" };
  const approve = decision === "approve";
  if (!approve && reason.length < 5) return { ok: false, message: "반려 사유를 5자 이상 적어 주세요" };
  if (!approve && reason.length > 200) return { ok: false, message: "반려 사유는 200자 이내로 적어 주세요" };

  // 3. 승인 코드 — 다르면 DB는 아무것도 바꾸지 않는다(감사 기록도 쓰지 않는다)
  if (!sameCode(code, pin)) return { ok: false, message: "승인 코드가 다릅니다" };

  // 4. 대기(pending)일 때만 바꾸고, 바뀌었으면 감사 기록 한 줄
  let result: "ok" | "missing" | "done";
  try {
    result = await db().$transaction(async (tx) => {
      const draft = await tx.dunningDraft.findUnique({ where: { id }, select: { buyerId: true } });
      if (!draft) return "missing";
      const { count } = await tx.dunningDraft.updateMany({
        where: { id, status: "pending" },
        data: {
          status: approve ? "approved" : "rejected",
          decidedBy: nickname,
          decidedAt: new Date(),
          reason: approve ? null : reason,
        },
      });
      if (count === 0) return "done";
      await tx.auditLog.create({
        data: {
          actor: nickname,
          action: approve ? "승인" : "반려",
          target: `${draft.buyerId} · 초안 #${id}`,
          detail: approve ? "발송 대기 — 실제 발송 없음" : `사유: ${reason}`,
        },
      });
      return "ok";
    });
  } catch {
    return { ok: false, message: "저장하지 못했습니다 — 잠시 뒤 다시 눌러 주세요" };
  }
  if (result === "missing") return { ok: false, message: "초안을 찾을 수 없습니다" };
  if (result === "done") return { ok: false, message: "이미 처리된 초안입니다" };

  // 5. 화면 새로 고침
  revalidatePath("/dunning");
  revalidatePath("/audit");
  return { ok: true, message: approve ? "승인했습니다 — 발송 대기(실제 발송 없음)" : "반려했습니다" };
}
