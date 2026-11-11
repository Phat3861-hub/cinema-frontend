"use client";

import { ChevronLeft, ChevronRight, UserRound, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CoverImage } from "@/components/ui/cover-image";
import type { CastMember, MovieImage } from "@/features/movie/types";
import { useT } from "@/i18n";

/** Movie detail: actors with photo and character, one scrollable row. */
export function MovieCast({ cast }: { cast: CastMember[] }) {
  const t = useT();
  if (cast.length === 0) return null;
  return (
    <section aria-labelledby="movie-cast" className="mx-auto flex w-full max-w-[1232px] flex-col gap-4 px-4">
      <h2 id="movie-cast" className="text-h6">
        {t.movie.cast}
      </h2>
      <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
        {cast.map((member, index) => (
          <li key={`${index}-${member.name}`} className="flex w-28 shrink-0 snap-start flex-col items-center gap-2 text-center">
            <div className="relative size-24 overflow-hidden rounded-full border border-line bg-surface-3">
              {member.photoUrl ? (
                <CoverImage src={member.photoUrl} alt={member.name} sizes="96px" />
              ) : (
                <UserRound aria-hidden className="absolute inset-0 m-auto size-10 text-fg-subtle" strokeWidth={1.5} />
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-fg">{member.name}</span>
              {member.character && (
                <span className="text-xs font-medium text-fg-muted">{t.movie.asCharacter(member.character)}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Movie detail: still images as a grid of thumbnails; a click opens them full size. */
export function MovieGallery({ images, title }: { images: MovieImage[]; title: string }) {
  const t = useT();
  const [open, setOpen] = useState<number | null>(null);
  if (images.length === 0) return null;

  return (
    <section aria-labelledby="movie-gallery" className="mx-auto flex w-full max-w-[1232px] flex-col gap-4 px-4">
      <h2 id="movie-gallery" className="text-h6">
        {t.movie.gallery}
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <li key={`${index}-${image.url}`}>
            <button
              type="button"
              onClick={() => setOpen(index)}
              aria-label={t.movie.galleryOpen(index + 1)}
              className="group relative block aspect-video w-full cursor-zoom-in overflow-hidden rounded-lg border border-line bg-surface-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <CoverImage
                src={image.url}
                alt={image.caption ?? `${title} – ${index + 1}`}
                sizes="(min-width: 1024px) 300px, (min-width: 640px) 33vw, 50vw"
                className="transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>
      {open !== null && <Lightbox images={images} title={title} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </section>
  );
}

/** Full-size image on a native modal <dialog> (focus trap + Esc from the browser); ←/→ change the image. */
function Lightbox({
  images,
  title,
  index,
  onIndex,
  onClose,
}: {
  images: MovieImage[];
  title: string;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  const image = images[index];
  const many = images.length > 1;
  const go = (step: number) => onIndex((index + step + images.length) % images.length);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function onKeyDown(event: KeyboardEvent) {
    if (!many) return;
    if (event.key === "ArrowLeft") go(-1);
    if (event.key === "ArrowRight") go(1);
  }

  const control =
    "flex size-11 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <dialog
      ref={ref}
      aria-label={t.movie.galleryPosition(index + 1, images.length)}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      onKeyDown={onKeyDown}
      className="m-auto h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/90"
    >
      <div
        className="flex h-full flex-col items-center justify-center gap-3 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="relative aspect-video w-full max-w-6xl overflow-hidden rounded-lg bg-black">
          <Image src={image.url} alt={image.caption ?? `${title} – ${index + 1}`} fill sizes="100vw" className="object-contain" />
        </div>
        <p className="text-center text-sm font-semibold text-white">
          {image.caption && <span>{image.caption} · </span>}
          <span className="text-white/70">{t.movie.galleryPosition(index + 1, images.length)}</span>
        </p>
      </div>
      <button type="button" onClick={onClose} aria-label={t.movie.galleryClose} className={`${control} absolute top-4 right-4`}>
        <X aria-hidden className="size-5" />
      </button>
      {many && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t.movie.galleryPrevious}
            className={`${control} absolute top-1/2 left-4 -translate-y-1/2`}
          >
            <ChevronLeft aria-hidden className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t.movie.galleryNext}
            className={`${control} absolute top-1/2 right-4 -translate-y-1/2`}
          >
            <ChevronRight aria-hidden className="size-6" />
          </button>
        </>
      )}
    </dialog>
  );
}
