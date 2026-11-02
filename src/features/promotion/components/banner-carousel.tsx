"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Ticket } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { buttonClasses } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { ROUTES } from "@/constants/routes";
import type { PublicBanner } from "@/features/promotion/types";
import { useT } from "@/i18n";

const ROTATE_MS = 6000;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True when the user asked the OS for less motion (false while rendering on the server). */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/**
 * Home page hero built from the banners showing now (PRO-03). Rotates every 6 s, but not while hovered or focused,
 * when paused with the button, or when the user prefers reduced motion.
 */
export function BannerCarousel({ banners }: { banners: PublicBanner[] }) {
  const t = useT();
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [paused, setPaused] = useState(false);
  const count = banners.length;
  const current = index < count ? index : 0;
  const rotating = count > 1 && !paused && !reducedMotion;

  useEffect(() => {
    if (!rotating || hovered || focused) return;
    const timer = window.setTimeout(() => setIndex((current + 1) % count), ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [rotating, hovered, focused, current, count]);

  const go = (next: number) => setIndex((next + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t.home.banners}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-black sm:aspect-[16/7] lg:aspect-[8/3]"
    >
      <h1 className="sr-only">{t.home.welcomeTitle}</h1>
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          role="group"
          aria-roledescription="slide"
          aria-label={t.home.bannerSlide(i + 1, count)}
          aria-hidden={i !== current}
          inert={i !== current}
          className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <CoverImage src={banner.imageUrl} alt="" sizes="(min-width: 1232px) 1200px, 100vw" priority={i === 0} />
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent sm:bg-linear-to-r sm:from-black/85 sm:via-black/40" />
          <div className="absolute inset-x-0 bottom-0 flex max-w-2xl flex-col gap-3 p-5 pb-12 text-white sm:top-0 sm:justify-center sm:px-16 sm:py-10 sm:pb-14">
            <h2 className="line-clamp-2 text-2xl leading-tight font-bold sm:text-4xl lg:text-5xl">{banner.title}</h2>
            {banner.subtitle && (
              <p className="line-clamp-2 text-sm font-medium text-neutral-200 sm:text-base">{banner.subtitle}</p>
            )}
            <BannerAction banner={banner} />
          </div>
        </div>
      ))}

      {count > 1 && (
        <>
          <button type="button" onClick={() => go(current - 1)} aria-label={t.home.previousBanner} className={`${ARROW} left-3`}>
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <button type="button" onClick={() => go(current + 1)} aria-label={t.home.nextBanner} className={`${ARROW} right-3`}>
            <ChevronRight aria-hidden className="size-5" />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1">
            {!reducedMotion && (
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? t.home.playBanners : t.home.pauseBanners}
                className="flex size-7 cursor-pointer items-center justify-center rounded-full text-white/80 hover:text-white focus-visible:outline-2 focus-visible:outline-primary"
              >
                {paused ? <Play aria-hidden className="size-3.5" /> : <Pause aria-hidden className="size-3.5" />}
              </button>
            )}
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t.home.goToBanner(i + 1, banner.title)}
                aria-current={i === current ? "true" : undefined}
                className="flex size-7 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span
                  aria-hidden
                  className={`block h-2 rounded-full transition-all motion-reduce:transition-none ${
                    i === current ? "w-6 bg-primary" : "w-2 bg-white/60"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

const ARROW =
  "absolute top-1/2 hidden size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 " +
  "text-white backdrop-blur transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-primary sm:flex";

/** Movie → buy tickets; internal path → client navigation; external URL → new tab. */
function BannerAction({ banner }: { banner: PublicBanner }) {
  const t = useT();
  const className = `${buttonClasses({ size: "md" })} w-fit`;
  if (banner.linkType === "MOVIE" && banner.movie) {
    return (
      <Link href={`${ROUTES.movieDetail(banner.movie.slug)}#showtimes`} className={className}>
        <Ticket aria-hidden className="size-4" />
        {t.movie.buyTicket}
      </Link>
    );
  }
  if (banner.linkType === "URL" && banner.linkUrl) {
    const content = (
      <>
        {t.home.bannerCta}
        <ArrowRight aria-hidden className="size-4" />
      </>
    );
    return banner.linkUrl.startsWith("/") ? (
      <Link href={banner.linkUrl} className={className}>
        {content}
      </Link>
    ) : (
      <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return null;
}
