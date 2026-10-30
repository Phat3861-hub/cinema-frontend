import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { ROUTES } from "@/constants/routes";
import { HeaderAuth } from "@/features/auth/components/header-auth";

const NAV = [
  { href: ROUTES.movies, label: "Phim" },
  { href: ROUTES.cinemas, label: "Rạp" },
  { href: ROUTES.myTickets, label: "Vé của tôi" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-black/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1232px] items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Chính" className="hidden items-center gap-6 text-sm font-medium md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded text-neutral-200 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <HeaderAuth />
      </div>
    </header>
  );
}
