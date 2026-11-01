import type { Genre } from "@/features/movie/types";
import type { Messages } from "@/i18n/messages/vi";

/** Genre name translated by slug (backend seeds English names); unknown / new genres keep their own name. */
export function genreLabel(genre: Pick<Genre, "slug" | "name">, t: Messages): string {
  const labels: Record<string, string> = t.genres;
  return labels[genre.slug] ?? genre.name;
}

/** YouTube watch / short / embed URL → embed URL; anything else → null (shown as a plain link). */
export function youtubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = parsed.pathname.slice(1);
    else if (host.endsWith("youtube.com")) {
      id = parsed.searchParams.get("v") ?? parsed.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/)?.[1] ?? null;
    }
    return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
  } catch {
    return null;
  }
}

/** "Actor A, Actor B" → ["Actor A", "Actor B"]. */
export function splitCast(cast: string | null): string[] {
  return (cast ?? "")
    .split(/[,;\n]/)
    .map((name) => name.trim())
    .filter(Boolean);
}
