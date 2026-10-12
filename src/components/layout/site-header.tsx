import Link from "next/link";
import { ROUTES } from "@/constants/routes";

const NAV = [
  { href: ROUTES.movies, label: "Phim" },
  { href: ROUTES.cinemas, label: "Rạp" },
  { href: ROUTES.myTickets, label: "Vé của tôi" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href={ROUTES.home} className="text-xl font-bold text-red-600">
          PNT Cinema
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-red-600">
              {item.label}
            </Link>
          ))}
          <Link
            href={ROUTES.login}
            className="rounded-md bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700"
          >
            Đăng nhập
          </Link>
        </nav>
      </div>
    </header>
  );
}
