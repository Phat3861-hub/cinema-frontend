import type { Metadata } from "next";
import { ROUTES } from "@/constants/routes";
import { AuthFooterLink } from "@/features/auth/components/auth-footer-link";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <>
      <AuthHeading title="auth.register.title" description="auth.register.subtitle" />
      <RegisterForm />
      <AuthFooterLink text="auth.register.hasAccount" href={ROUTES.login} label="auth.login.submit" />
    </>
  );
}
