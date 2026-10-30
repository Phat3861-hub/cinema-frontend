import type { Metadata } from "next";
import { ROUTES } from "@/constants/routes";
import { AuthFooterLink } from "@/features/auth/components/auth-footer-link";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <>
      <AuthHeading title="Tạo tài khoản" description="Đặt vé nhanh, chọn ghế realtime, nhận vé QR qua email." />
      <RegisterForm />
      <AuthFooterLink text="Đã có tài khoản?" href={ROUTES.login} label="Đăng nhập" />
    </>
  );
}
