import type { Metadata } from "next";
import { ROUTES } from "@/constants/routes";
import { AuthFooterLink } from "@/features/auth/components/auth-footer-link";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading
        title="Quên mật khẩu"
        description="Nhập email đã đăng ký, chúng tôi sẽ gửi link để bạn đặt lại mật khẩu."
      />
      <ForgotPasswordForm />
      <AuthFooterLink text="Đã nhớ mật khẩu?" href={ROUTES.login} label="Đăng nhập" />
    </>
  );
}
