"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/features/auth/hooks/use-countdown";
import { useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";

const COOLDOWN_SECONDS = 60;

/** "Resend email" with a 60 s cooldown; the email was just sent, so it starts locked. */
export function ResendButton({ onResend, label }: { onResend: () => Promise<void>; label: string }) {
  const t = useT();
  const { secondsLeft, restart } = useCountdown(COOLDOWN_SECONDS);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleClick() {
    setSending(true);
    setResult(null);
    try {
      await onResend();
      setResult({ ok: true, message: t.auth.resent });
      restart(COOLDOWN_SECONDS);
    } catch (error) {
      setResult({ ok: false, message: getErrorMessage(error, t) });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {result && <Alert tone={result.ok ? "success" : "error"}>{result.message}</Alert>}
      <Button variant="outline" fullWidth loading={sending} disabled={secondsLeft > 0} onClick={handleClick}>
        {secondsLeft > 0 ? t.auth.resendIn(label, secondsLeft) : label}
      </Button>
    </div>
  );
}
