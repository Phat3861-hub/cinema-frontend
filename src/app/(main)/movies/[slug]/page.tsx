import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { MovieDetailScreen } from "@/features/movie/components/movie-detail-screen";

// Cache Components: don't await params at page level, so the page shell can still be prerendered.
export default function MovieDetailPage({ params }: PageProps<"/movies/[slug]">) {
  return (
    <Suspense fallback={<LoadingState />}>
      {params.then(({ slug }) => (
        <MovieDetailScreen slug={decodeURIComponent(slug)} />
      ))}
    </Suspense>
  );
}
