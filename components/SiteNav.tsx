import Link from "next/link";

// 위쪽 메뉴. 쪽을 더하면 여기에 한 줄을 더한다(예: { href: "/buyers", label: "바이어" }).
// 홈(/)은 메뉴에서 뺐지만 주소로는 그대로 열린다(배포 배지 확인용).
export const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/regions", label: "숨어 있는 돈을 찾아서" },
  { href: "/overdue", label: "연체 바이어" },
  { href: "/dunning", label: "독촉 승인" },
  { href: "/audit", label: "감사 기록" },
];

export default function SiteNav() {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-sepia bg-parchment">
      <nav aria-label="주 메뉴" className="mx-auto w-full max-w-5xl px-4 py-2 sm:px-6">
        <ul className="flex flex-wrap items-center gap-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex min-h-11 items-center rounded-md px-3 font-semibold text-sepia hover:bg-parchment-deep hover:text-ink"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
