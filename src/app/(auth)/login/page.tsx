import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-xl font-semibold">Đăng nhập</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Form email / mật khẩu và đăng nhập Google (AUTH-02, AUTH-03).
      </p>
      <p className="mt-6 text-sm">
        Chưa có tài khoản?{" "}
        <Link href={ROUTES.register} className="text-red-600 hover:underline">
          Đăng ký
        </Link>
      </p>
    </>
  );
}
