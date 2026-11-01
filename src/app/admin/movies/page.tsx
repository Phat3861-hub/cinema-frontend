import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/states";
import { AdminMoviesScreen } from "@/features/movie/components/admin-movies-screen";

export const metadata: Metadata = { title: "Phim" };

export default function AdminMoviesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AdminMoviesScreen />
    </Suspense>
  );
}
