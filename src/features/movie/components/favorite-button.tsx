"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ROUTES, withQuery } from "@/constants/routes";
import { useSession } from "@/features/auth/components/session-provider";
import { useFavorites } from "@/features/movie/hooks/use-favorites";
import { useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";

/**
 * Heart toggle of a movie. `overlay` is the round icon on a poster (movie cards), `button` the labelled button of the
 * movie page. Signed out: goes to sign-in and comes back to the same page.
 */
export function FavoriteButton({
  movieId,
  title,
  variant,
  className = "",
}: {
  movieId: number;
  title: string;
  variant: "overlay" | "button";
  className?: string;
}) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const { status } = useSession();
  const { ids, toggle } = useFavorites();
  const [busy, setBusy] = useState(false);
  const favorite = ids.has(movieId);

  async function onClick() {
    if (status !== "authenticated") {
      if (status === "anonymous") {
        router.push(withQuery(ROUTES.login, { next: window.location.pathname + window.location.search }));
      }
      return;
    }
    setBusy(true);
    try {
      toast.success((await toggle(movieId)) ? t.movie.favoriteAdded : t.movie.favoriteRemoved);
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setBusy(false);
    }
  }

  const label = favorite ? t.movie.favoriteRemove(title) : t.movie.favoriteAdd(title);
  const heart = <Heart aria-hidden className={`size-5 ${favorite ? "fill-current text-danger" : ""}`} />;

  if (variant === "button") {
    return (
      <Button variant="outline" onClick={onClick} disabled={busy} aria-pressed={favorite} title={label} className={className}>
        {heart}
        {favorite ? t.movie.favorited : t.movie.favorite}
      </Button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={favorite}
      aria-label={label}
      title={label}
      className={`flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      {heart}
    </button>
  );
}
