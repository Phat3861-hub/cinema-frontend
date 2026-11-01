"use client";

import { CircleCheck, CircleX } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ROUTES } from "@/constants/routes";
import { authApi } from "@/features/auth/api";
import { useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";

type State = { kind: "verifying" } | { kind: "success" } | { kind: "error"; error?: unknown };

/** Opens from the email link `/verify-email?token=` and verifies once. */
export function VerifyEmail({ token }: { token?: string }) {
  const t = useT();
  const [state, setState] = useState<State>(
    token ? { kind: "verifying" } : { kind: "error" },
  );
  // The token is single-use: StrictMode runs effects twice in dev, so guard against a second call.
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    authApi
      .verifyEmail(token)
      .then(() => setState({ kind: "success" }))
      .catch((error: unknown) => setState({ kind: "error", error }));
  }, [token]);

  if (state.kind === "verifying") {
    return (
      <div role="status" className="flex flex-col items-center gap-4 py-6 text-fg-2">
        <Spinner className="size-10 text-accent" />
        <p className="text-sm font-medium">{t.auth.verify.verifying}</p>
      </div>
    );
  }

  if (state.kind === "success") {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <CircleCheck aria-hidden className="size-16 text-success" strokeWidth={1.5} />
        <p role="status" className="text-sm font-medium text-fg-2">
          {t.auth.verify.success}
        </p>
        <Link href={ROUTES.login} className={buttonClasses({ fullWidth: true })}>
          {t.auth.login.submit}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <CircleX aria-hidden className="size-16 text-danger" strokeWidth={1.5} />
      <p role="alert" className="text-sm font-medium text-fg-2">
        {state.error === undefined ? t.auth.verify.invalidLink : getErrorMessage(state.error, t)}{" "}
        {t.auth.verify.askNew}
      </p>
      <Link href={ROUTES.registerCheckEmail} className={buttonClasses({ fullWidth: true })}>
        {t.auth.verify.resend}
      </Link>
      <Link href={ROUTES.login} className={buttonClasses({ variant: "outline", fullWidth: true })}>
        {t.auth.backToLogin}
      </Link>
    </div>
  );
}
