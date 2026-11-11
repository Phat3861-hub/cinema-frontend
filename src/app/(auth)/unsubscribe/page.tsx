import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { firstParam } from "@/features/auth/redirect";
import { Unsubscribe } from "@/features/notification/components/unsubscribe";

export const metadata: Metadata = { title: "Hủy đăng ký email" };

export default function UnsubscribePage({ searchParams }: PageProps<"/unsubscribe">) {
  return (
    <>
      <AuthHeading title="notifications.unsubscribe.title" />
      <Suspense fallback={<Spinner className="mx-auto size-10 text-primary" />}>
        {searchParams.then((query) => (
          <Unsubscribe token={firstParam(query.token)} />
        ))}
      </Suspense>
    </>
  );
}
