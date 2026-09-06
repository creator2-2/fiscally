"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./BrandMark";
import { PrepareDuButton } from "./PrepareDuButton";

const NAV = [
  { href: "/acasa", label: "Acasă", short: "Acasă", icon: HomeIcon },
  { href: "/pregateste-du", label: "Pregătește DU", short: "DU", icon: ChartIcon, primary: true },
  { href: "/documente", label: "Documente", short: "Docs", icon: DocsIcon },
  { href: "/termene", label: "Termene", short: "Termene", icon: CalendarIcon },
  { href: "/cont", label: "Cont", short: "Cont", icon: UserIcon },
];

export function AppShell({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-paper">
      <header className="no-print sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <BrandMark size="sm" href="/acasa" />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium focus-visible:ring-4 focus-visible:ring-mint ${
                    item.primary && !active
                      ? "bg-sage text-white hover:bg-sage-deep"
                      : active
                        ? "bg-mint text-sage-deep"
                        : "text-ink-soft hover:bg-white hover:text-ink"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {pathname.startsWith("/pregateste-du") ? null : (
            <div className="hidden md:block lg:hidden">
              <PrepareDuButton size="sm" />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:pb-12 md:pt-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 md:mb-7">
          <h1 className="font-display text-[1.85rem] leading-tight tracking-tight text-ink md:text-4xl">
            {title}
          </h1>
          {action}
        </div>
        {children}
      </main>

      <nav
        className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur md:hidden"
        aria-label="Navigare principală"
      >
        <ul className="grid grid-cols-5">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] font-medium ${
                    active ? "bg-mint-soft text-sage-deep" : "text-ink-soft"
                  }`}
                >
                  <Icon active={active} />
                  {item.short}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M4.5 11.2 12 5l7.5 6.2V19a1.5 1.5 0 0 1-1.5 1.5h-4v-5h-4v5H6A1.5 1.5 0 0 1 4.5 19v-7.8Z"
        stroke={active ? "#3e6552" : "#5b6c62"}
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M5 19V9M12 19V5M19 19v-7"
        stroke={active ? "#3e6552" : "#5b6c62"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DocsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M8 4.5h6.2L19 9.3V19a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V6A1.5 1.5 0 0 1 8 4.5Z"
        stroke={active ? "#3e6552" : "#5b6c62"}
        strokeWidth="1.6"
      />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <rect
        x="4.5"
        y="5.5"
        width="15"
        height="14"
        rx="2"
        stroke={active ? "#3e6552" : "#5b6c62"}
        strokeWidth="1.6"
      />
      <path d="M4.5 10h15M8 4v3M16 4v3" stroke={active ? "#3e6552" : "#5b6c62"} strokeWidth="1.6" />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <circle cx="12" cy="9" r="3" stroke={active ? "#3e6552" : "#5b6c62"} strokeWidth="1.6" />
      <path
        d="M6 18.5c1.2-2.4 3.2-3.5 6-3.5s4.8 1.1 6 3.5"
        stroke={active ? "#3e6552" : "#5b6c62"}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
