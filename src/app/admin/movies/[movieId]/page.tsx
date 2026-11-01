import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { AdminMovieEditor } from "@/features/movie/components/admin-movie-form";

export const metadata: Metadata = { title: "Sửa phim" };

// Cache Components: params resolve inside Suspense so the admin shell still prerenders.
export default function AdminMovieEditPage({ params }: PageProps<"/admin/movies/[movieId]">) {
  return (
    <Suspense fallback={<LoadingState />}>
      {params.then(({ movieId }) => (
        <AdminMovieEditor movieId={movieId} />
      ))}
    </Suspense>
  );
}
