import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { CinemaDetailScreen } from "@/features/cinema/components/cinema-detail-screen";

export default function CinemaDetailPage({ params }: PageProps<"/cinemas/[slug]">) {
  return (
    <Suspense fallback={<LoadingState />}>
      {params.then(({ slug }) => (
        <CinemaDetailScreen slug={decodeURIComponent(slug)} />
      ))}
    </Suspense>
  );
}
