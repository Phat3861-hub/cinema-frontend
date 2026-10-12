import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-xl font-semibold">Đăng ký</h1>
      <p className="mt-2 text-sm text-zinc-500">Form đăng ký + xác thực email (AUTH-01).</p>
      <p className="mt-6 text-sm">
        Đã có tài khoản?{" "}
        <Link href={ROUTES.login} className="text-red-600 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </>
  );
}
