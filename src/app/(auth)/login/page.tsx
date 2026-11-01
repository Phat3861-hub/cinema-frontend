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
      <AuthHeading title="auth.login.title" description="auth.login.subtitle" />
      <Suspense fallback={<LoginForm />}>
        {searchParams.then((query) => (
          <LoginForm next={safeNextPath(firstParam(query.next))} />
        ))}
      </Suspense>
      <AuthFooterLink text="auth.login.noAccount" href={ROUTES.register} label="auth.register.submit" />
    </>
  );
}
