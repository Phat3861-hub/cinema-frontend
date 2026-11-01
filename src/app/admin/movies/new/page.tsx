import type { Metadata } from "next";
import { AdminMovieEditor } from "@/features/movie/components/admin-movie-form";

export const metadata: Metadata = { title: "Thêm phim" };

export default function AdminMovieNewPage() {
  return <AdminMovieEditor />;
}
