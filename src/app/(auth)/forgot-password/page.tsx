import type { Metadata } from "next";
import { ROUTES } from "@/constants/routes";
import { AuthFooterLink } from "@/features/auth/components/auth-footer-link";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading title="auth.forgot.title" description="auth.forgot.subtitle" />
      <ForgotPasswordForm />
      <AuthFooterLink text="auth.forgot.remembered" href={ROUTES.login} label="auth.login.submit" />
    </>
  );
}
