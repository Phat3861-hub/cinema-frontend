import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { firstParam } from "@/features/auth/redirect";

export const metadata: Metadata = { title: "Đặt lại mật khẩu" };

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <>
      <AuthHeading title="auth.reset.title" description="auth.reset.subtitle" />
      <Suspense>
        {searchParams.then((query) => (
          <ResetPasswordForm token={firstParam(query.token)} />
        ))}
      </Suspense>
    </>
  );
}
