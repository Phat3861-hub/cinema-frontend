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

/** Step 1–2 of Ticketor "Forgot password": enter email → "check your email". */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
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
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) {
    // The backend always answers 200 so it never reveals whether the email exists.
    return (
      <div className="flex flex-col gap-8">
        <EmailSentNotice email={sentTo}>
          Nếu email này đã đăng ký, chúng tôi đã gửi link đặt lại mật khẩu. Link chỉ dùng được một lần và hết
          hạn sau 15 phút.
        </EmailSentNotice>
        <ResendButton label="Gửi lại link" onResend={() => authApi.forgotPassword(sentTo)} />
        <Link href={ROUTES.login} className={buttonClasses({ fullWidth: true })}>
          Về trang đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      {formError && <Alert tone="error">{formError}</Alert>}
      <TextField
        label="Email"
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
        Gửi link đặt lại mật khẩu
      </Button>
    </form>
  );
}
