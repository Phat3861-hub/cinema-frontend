import Link from "next/link";
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
    <aside className="w-56 shrink-0 border-r border-zinc-200 p-4 dark:border-zinc-800">
      <Link href={ROUTES.admin.dashboard} className="mb-6 block text-lg font-bold text-red-600">
        PNT Admin
      </Link>
      <nav className="flex flex-col gap-1 text-sm">
        {MENU.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
