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
import { validateEmail } from "@/features/auth/validation";
import { getErrorMessage } from "@/lib/error-messages";

/**
 * After sign-up: the backend verifies by link (no OTP). With `email` (from the register form) it offers a
 * resend; without it (e.g. coming from an expired link) the user types the email to get a new link.
 */
export function CheckEmail({ email }: { email?: string }) {
  if (!email) return <RequestVerificationLink />;

  return (
    <div className="flex flex-col gap-8">
      <EmailSentNotice email={email}>
        Chúng tôi đã gửi link xác thực tới email trên. Mở email và bấm vào link để kích hoạt tài khoản, sau đó
        đăng nhập.
      </EmailSentNotice>
      <ResendButton label="Gửi lại email" onResend={() => authApi.resendVerification(email)} />
      <Link href={ROUTES.login} className={buttonClasses({ fullWidth: true })}>
        Đến trang đăng nhập
      </Link>
    </div>
  );
}

function RequestVerificationLink() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
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
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      {formError && <Alert tone="error">{formError}</Alert>}
      <TextField
        label="Email đã đăng ký"
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
        error={error}
      />
      <Button type="submit" fullWidth loading={submitting}>
        Gửi link xác thực
      </Button>
    </form>
  );
}
