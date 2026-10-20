"use server";

import { revalidatePath } from "next/cache";
import type { ReviewState } from "@/components/ReviewForm";
import { db } from "@/lib/db";

const STATUSES = ["확인 필요", "확인 완료", "보류"];

// 확인 기록 쓰기. 검사는 여기(서버)가 한다 — 처음 걸린 하나만 돌려주고 저장하지 않는다.
export async function addReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const buyerId = String(formData.get("buyerId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();
  const reviewer = String(formData.get("reviewer") ?? "").trim();

  if (!STATUSES.includes(status)) return { ok: false, message: "상태를 골라 주세요" };
  if (!memo) return { ok: false, message: "메모를 적어 주세요" };
  if (memo.length > 200) return { ok: false, message: "메모는 200자 이내로 적어 주세요" };
  if (!reviewer) return { ok: false, message: "확인한 사람(별명)을 적어 주세요" };
  if (reviewer.length > 20) return { ok: false, message: "별명은 20자 이내로 적어 주세요" };

  try {
    const buyer = await db().buyer.findUnique({ where: { id: buyerId }, select: { id: true } });
    if (!buyer) return { ok: false, message: "바이어를 찾을 수 없습니다" };
    await db().review.create({ data: { buyerId, status, memo, reviewer } });
  } catch {
    return { ok: false, message: "저장하지 못했습니다 — 잠시 뒤 다시 눌러 주세요" };
  }

  revalidatePath(`/buyers/${buyerId}`);
  revalidatePath("/");
  return { ok: true, message: "저장했습니다 — 새로 고쳐도 남아 있습니다" };
}
