import {
  Armchair,
  BarChart3,
  Building2,
  CalendarClock,
  Clapperboard,
  FileClock,
  Film,
  Image,
  LayoutDashboard,
  MessageSquareText,
  Popcorn,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Store,
  Tags,
  TicketPercent,
  Undo2,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import type { Messages } from "@/i18n/messages/vi";

export type MenuKey = keyof Messages["admin"]["menu"];
export type MenuGroupKey = keyof Messages["admin"]["groups"];

export interface AdminMenuItem {
  key: MenuKey;
  href: string;
  icon: LucideIcon;
  /** Shown when the user has at least one of these (docs/ui-design.md §5.2); empty = every staff member. */
  permissions: string[];
  /** Backend API not ready yet: the page is a "coming soon" shell. */
  soon?: boolean;
  /** Extra path prefixes that highlight this item (detail pages). */
  match?: RegExp;
}

export interface AdminMenuGroup {
  key: MenuGroupKey;
  items: AdminMenuItem[];
}

const SHOWTIME_READ = ["SHOWTIME_MANAGE", "PRICE_MANAGE", "SEAT_BLOCK"];
const ROOM_READ = ["ROOM_MANAGE", "SEAT_LAYOUT_MANAGE", "SEAT_BLOCK"];

export const ADMIN_MENU: AdminMenuGroup[] = [
  {
    key: "overview",
    items: [{ key: "dashboard", href: ROUTES.admin.dashboard, icon: LayoutDashboard, permissions: [] }],
  },
  {
    key: "counter",
    items: [
      { key: "pos", href: ROUTES.admin.pos, icon: Store, permissions: ["BOOKING_COUNTER_SELL"] },
      { key: "checkIn", href: ROUTES.admin.checkIn, icon: QrCode, permissions: ["TICKET_CHECKIN"], soon: true },
      {
        key: "bookings",
        href: ROUTES.admin.bookings,
        icon: ReceiptText,
        permissions: ["BOOKING_VIEW_CINEMA", "BOOKING_VIEW_ALL"],
      },
      { key: "refunds", href: ROUTES.admin.refunds, icon: Undo2, permissions: ["REFUND_APPROVE"], soon: true },
    ],
  },
  {
    key: "content",
    items: [
      { key: "movies", href: ROUTES.admin.movies, icon: Film, permissions: ["MOVIE_MANAGE"] },
      { key: "genres", href: ROUTES.admin.genres, icon: Tags, permissions: ["GENRE_MANAGE"] },
      { key: "banners", href: ROUTES.admin.banners, icon: Image, permissions: ["BANNER_MANAGE"] },
      { key: "reviews", href: ROUTES.admin.reviews, icon: MessageSquareText, permissions: ["REVIEW_MODERATE"], soon: true },
    ],
  },
  {
    key: "cinemas",
    items: [
      {
        key: "cinemas",
        href: ROUTES.admin.cinemas,
        icon: Building2,
        permissions: ["CINEMA_MANAGE"],
        match: /^\/admin\/cinemas\/(new|\d+)$/,
      },
      {
        key: "rooms",
        href: ROUTES.admin.rooms,
        icon: Clapperboard,
        permissions: ROOM_READ,
        match: /^\/admin\/(cinemas\/\d+\/rooms|rooms\/)/,
      },
      { key: "seatTypes", href: ROUTES.admin.seatTypes, icon: Armchair, permissions: ["CINEMA_MANAGE"] },
      {
        key: "showtimes",
        href: ROUTES.admin.showtimes,
        icon: CalendarClock,
        permissions: SHOWTIME_READ,
        match: /^\/admin\/cinemas\/\d+\/showtimes/,
      },
      {
        key: "staff",
        href: ROUTES.admin.staff,
        icon: UsersRound,
        permissions: ["STAFF_ASSIGN"],
        match: /^\/admin\/cinemas\/\d+\/staff/,
      },
    ],
  },
  {
    key: "business",
    items: [
      {
        key: "vouchers",
        href: ROUTES.admin.vouchers,
        icon: TicketPercent,
        permissions: ["VOUCHER_MANAGE_GLOBAL", "VOUCHER_MANAGE_CINEMA"],
      },
      { key: "products", href: ROUTES.admin.products, icon: Popcorn, permissions: ["PRODUCT_MANAGE"] },
      {
        key: "reports",
        href: ROUTES.admin.reports,
        icon: BarChart3,
        permissions: ["REPORT_VIEW_ALL", "REPORT_VIEW_CINEMA"],
        soon: true,
      },
    ],
  },
  {
    key: "system",
    items: [
      { key: "users", href: ROUTES.admin.users, icon: Users, permissions: ["USER_MANAGE"], match: /^\/admin\/users\// },
      { key: "roles", href: ROUTES.admin.roles, icon: ShieldCheck, permissions: ["ROLE_MANAGE"] },
      { key: "auditLogs", href: ROUTES.admin.auditLogs, icon: FileClock, permissions: ["AUDIT_LOG_VIEW"], soon: true },
    ],
  },
];

/** Menu groups the user may see (permission-based, so roles created later match automatically). */
export function visibleMenu(permissions: string[]): AdminMenuGroup[] {
  return ADMIN_MENU.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => item.permissions.length === 0 || item.permissions.some((p) => permissions.includes(p)),
    ),
  })).filter((group) => group.items.length > 0);
}

export function isItemActive(item: AdminMenuItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  // Items with `match` own exactly those sub-paths (/admin/cinemas/1/rooms belongs to rooms, not cinemas).
  if (item.match) return item.match.test(pathname);
  return item.href !== ROUTES.admin.dashboard && pathname.startsWith(`${item.href}/`);
}

/** Menu item for the current page (topbar title). */
export function activeItem(pathname: string): AdminMenuItem | undefined {
  return ADMIN_MENU.flatMap((group) => group.items).find((item) => isItemActive(item, pathname));
}
