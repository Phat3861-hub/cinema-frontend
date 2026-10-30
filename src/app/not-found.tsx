import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-neutral-300">Trang bạn tìm không tồn tại.</p>
      <Link href={ROUTES.home} className="text-primary hover:underline">
        Về trang chủ
      </Link>
    </main>
  );
}
