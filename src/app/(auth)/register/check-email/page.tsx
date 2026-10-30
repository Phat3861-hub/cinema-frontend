import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { CheckEmail } from "@/features/auth/components/check-email";
import { firstParam } from "@/features/auth/redirect";

export const metadata: Metadata = { title: "Xác thực email" };

export default function CheckEmailPage({ searchParams }: PageProps<"/register/check-email">) {
  return (
    <>
      <AuthHeading title="Kiểm tra email của bạn" />
      <Suspense>
        {searchParams.then((query) => (
          <CheckEmail email={firstParam(query.email)} />
        ))}
      </Suspense>
    </>
  );
}
