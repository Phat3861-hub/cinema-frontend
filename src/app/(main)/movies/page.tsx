import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { MoviesScreen } from "@/features/movie/components/movies-screen";

export const metadata: Metadata = { title: "Phim" };

export default function MoviesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MoviesScreen />
    </Suspense>
  );
}
