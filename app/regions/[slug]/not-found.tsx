import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-ink">섬을 찾을 수 없습니다</h1>
      <p className="text-muted">주소의 바다 이름(예: americas)을 확인해 주세요.</p>
      <Link href="/regions" className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-accent">
        보물 지도로
      </Link>
    </div>
  );
}
