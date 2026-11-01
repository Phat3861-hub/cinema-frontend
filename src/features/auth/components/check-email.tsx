"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { ROUTES } from "@/constants/routes";
import { authApi } from "@/features/auth/api";
import { EmailSentNotice } from "@/features/auth/components/email-sent-notice";
import { ResendButton } from "@/features/auth/components/resend-button";
import { fieldMessage, validateEmail, type ValidationKey } from "@/features/auth/validation";
import { useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";

/**
 * After sign-up: the backend verifies by link (no OTP). With `email` (from the register form) it offers a
 * resend; without it (e.g. coming from an expired link) the user types the email to get a new link.
 */
export function CheckEmail({ email }: { email?: string }) {
  const t = useT();
  if (!email) return <RequestVerificationLink />;

  return (
    <div className="flex flex-col gap-8">
      <EmailSentNotice email={email}>
        {t.auth.checkEmail.sent}
      </EmailSentNotice>
      <ResendButton label={t.auth.checkEmail.resend} onResend={() => authApi.resendVerification(email)} />
      <Link href={ROUTES.login} className={buttonClasses({ fullWidth: true })}>
        {t.auth.checkEmail.toLogin}
      </Link>
    </div>
  );
}

function RequestVerificationLink() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<ValidationKey>();
  const [formError, setFormError] = useState<unknown>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (sentTo) return <CheckEmail email={sentTo} />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailError = validateEmail(email);
    setError(emailError);
    setFormError(null);
    if (emailError) return;

    setSubmitting(true);
    try {
      await authApi.resendVerification(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setFormError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      {formError !== null && <Alert tone="error">{getErrorMessage(formError, t)}</Alert>}
      <TextField
        label={t.auth.checkEmail.registeredEmail}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="ten@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError(validateEmail(e.target.value));
        }}
        error={fieldMessage(t, error)}
      />
      <Button type="submit" fullWidth loading={submitting}>
        {t.auth.checkEmail.submit}
      </Button>
    </form>
  );
}
