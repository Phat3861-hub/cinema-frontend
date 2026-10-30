import type { Metadata } from "next";
import { Suspense } from "react";
import { ROUTES } from "@/constants/routes";
import { AuthFooterLink } from "@/features/auth/components/auth-footer-link";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { LoginForm } from "@/features/auth/components/login-form";
import { firstParam, safeNextPath } from "@/features/auth/redirect";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <AuthHeading title="Đăng nhập" />
      <Suspense fallback={<LoginForm />}>
        {searchParams.then((query) => (
          <LoginForm next={safeNextPath(firstParam(query.next))} />
        ))}
      </Suspense>
      <AuthFooterLink text="Chưa có tài khoản?" href={ROUTES.register} label="Đăng ký" />
    </>
  );
}
