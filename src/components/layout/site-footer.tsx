"use client";

import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { ROUTES, withQuery } from "@/constants/routes";
import { useT } from "@/i18n";

/** Ticketor footer without the "Get the App" block: brand + movie / cinema / support columns. */
export function SiteFooter() {
  const t = useT();
  const columns = [
    {
      title: t.footer.movies,
      links: [
        { href: withQuery(ROUTES.movies, { status: "NOW_SHOWING" }), label: t.movie.status.NOW_SHOWING },
        { href: withQuery(ROUTES.movies, { status: "COMING_SOON" }), label: t.movie.status.COMING_SOON },
      ],
    },
    {
      title: t.footer.cinemas,
      links: [
        { href: ROUTES.cinemas, label: t.footer.allCinemas },
        { href: ROUTES.offers, label: t.nav.offers },
        { href: ROUTES.myTickets, label: t.nav.myTickets },
      ],
    },
    {
      title: t.footer.support,
      links: [
        { href: `${ROUTES.home}#faq`, label: t.footer.faq },
        { href: "mailto:support@pntcinema.vn", label: t.footer.contact },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-[1232px] gap-10 px-4 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-sm text-sm font-medium text-fg-muted">{t.footer.about}</p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-h8 mb-4">{column.title}</h2>
            <ul className="flex flex-col gap-3 text-sm font-medium">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto w-full max-w-[1232px] px-4 py-5 text-xs font-semibold text-fg-subtle">
          © PNT Cinema. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
