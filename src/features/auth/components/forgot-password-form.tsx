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

/** Step 1–2 of Ticketor "Forgot password": enter email → "check your email". */
export function ForgotPasswordForm() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<ValidationKey>();
  const [formError, setFormError] = useState<unknown>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailError = validateEmail(email);
    setError(emailError);
    setFormError(null);
    if (emailError) return;

    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setFormError(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) {
    // The backend always answers 200 so it never reveals whether the email exists.
    return (
      <div className="flex flex-col gap-8">
        <EmailSentNotice email={sentTo}>
          {t.auth.forgot.sent}
        </EmailSentNotice>
        <ResendButton label={t.auth.forgot.resend} onResend={() => authApi.forgotPassword(sentTo)} />
        <Link href={ROUTES.login} className={buttonClasses({ fullWidth: true })}>
          {t.auth.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      {formError !== null && <Alert tone="error">{getErrorMessage(formError, t)}</Alert>}
      <TextField
        label={t.auth.email}
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
        {t.auth.forgot.submit}
      </Button>
    </form>
  );
}
