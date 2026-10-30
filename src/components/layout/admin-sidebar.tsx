import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { ROUTES } from "@/constants/routes";

// TODO: filter by the user's permissions (e.g. show the users menu only with USER_MANAGE).
const MENU = [
  { href: ROUTES.admin.dashboard, label: "Dashboard" },
  { href: ROUTES.admin.movies, label: "Phim" },
  { href: ROUTES.admin.showtimes, label: "Suất chiếu" },
  { href: ROUTES.admin.bookings, label: "Đặt vé" },
  { href: ROUTES.admin.users, label: "Người dùng" },
];

export function AdminSidebar() {
  return (
    <aside className="hidden w-[250px] shrink-0 border-r border-neutral-800 bg-black p-6 md:block">
      <div className="mb-8">
        <Logo label="PNT Admin" href={ROUTES.admin.dashboard} />
      </div>
      <nav aria-label="Quản trị" className="flex flex-col gap-1 text-sm font-medium">
        {MENU.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded px-3 py-2.5 text-neutral-300 transition-colors hover:bg-neutral-850 hover:text-white focus-visible:outline-2 focus-visible:outline-primary"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
