"use client";

import { CircleCheck, CircleX } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ROUTES } from "@/constants/routes";
import { authApi } from "@/features/auth/api";
import { getErrorMessage } from "@/lib/error-messages";

type State = { kind: "verifying" } | { kind: "success" } | { kind: "error"; message: string };

/** Opens from the email link `/verify-email?token=` and verifies once. */
export function VerifyEmail({ token }: { token?: string }) {
  const [state, setState] = useState<State>(
    token ? { kind: "verifying" } : { kind: "error", message: "Link xác thực không hợp lệ." },
  );
  // The token is single-use: StrictMode runs effects twice in dev, so guard against a second call.
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    authApi
      .verifyEmail(token)
      .then(() => setState({ kind: "success" }))
      .catch((error: unknown) => setState({ kind: "error", message: getErrorMessage(error) }));
  }, [token]);

  if (state.kind === "verifying") {
    return (
      <div role="status" className="flex flex-col items-center gap-4 py-6 text-neutral-200">
        <Spinner className="size-10 text-primary" />
        <p className="text-sm font-medium">Đang xác thực email…</p>
      </div>
    );
  }

  if (state.kind === "success") {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <CircleCheck aria-hidden className="size-16 text-success" strokeWidth={1.5} />
        <p role="status" className="text-sm font-medium text-neutral-200">
          Email đã được xác thực. Bạn có thể đăng nhập ngay bây giờ.
        </p>
        <Link href={ROUTES.login} className={buttonClasses({ fullWidth: true })}>
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <CircleX aria-hidden className="size-16 text-danger" strokeWidth={1.5} />
      <p role="alert" className="text-sm font-medium text-neutral-200">
        {state.message} Bạn có thể yêu cầu gửi lại link xác thực mới.
      </p>
      <Link href={ROUTES.registerCheckEmail} className={buttonClasses({ fullWidth: true })}>
        Gửi lại link xác thực
      </Link>
      <Link href={ROUTES.login} className={buttonClasses({ variant: "outline", fullWidth: true })}>
        Về trang đăng nhập
      </Link>
    </div>
  );
}
