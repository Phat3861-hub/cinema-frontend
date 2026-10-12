import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export default function HomePage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start justify-center gap-6 px-4 py-20">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Đặt vé xem phim <span className="text-red-600">nhanh</span>, chọn ghế{" "}
        <span className="text-red-600">realtime</span>
      </h1>
      <p className="max-w-2xl text-lg text-zinc-500">
        Xem lịch chiếu, giữ ghế trong 10 phút, thanh toán online và nhận vé QR qua email.
      </p>
      <Link
        href={ROUTES.movies}
        className="rounded-md bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700"
      >
        Xem phim đang chiếu
      </Link>
    </section>
  );
}
