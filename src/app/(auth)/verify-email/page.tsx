import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { VerifyEmail } from "@/features/auth/components/verify-email";
import { firstParam } from "@/features/auth/redirect";

export const metadata: Metadata = { title: "Xác thực email" };

export default function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  return (
    <>
      <AuthHeading title="Xác thực email" />
      <Suspense fallback={<Spinner className="mx-auto size-10 text-primary" />}>
        {searchParams.then((query) => (
          <VerifyEmail token={firstParam(query.token)} />
        ))}
      </Suspense>
    </>
  );
}
