import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Phim" };

export default function AdminMoviesPage() {
  return <PagePlaceholder title="Quản lý phim">CRUD phim, thể loại, poster, trailer (MOV-04).</PagePlaceholder>;
}
