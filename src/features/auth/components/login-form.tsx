"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import { ROUTES, withQuery } from "@/constants/routes";
import { authApi } from "@/features/auth/api";
import { useSession } from "@/features/auth/components/session-provider";
import { afterLoginPath } from "@/features/auth/redirect";
import { hasErrors, validateEmail, validateLoginPassword, type FieldErrors } from "@/features/auth/validation";
import { errorCodeOf, getErrorMessage, getFieldErrors } from "@/lib/error-messages";

type Field = "email" | "password";

function validate(values: Record<Field, string>): FieldErrors<Field> {
  return { email: validateEmail(values.email), password: validateLoginPassword(values.password) };
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const session = useSession();
  const [values, setValues] = useState<Record<Field, string>>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<{ code?: string; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (e.g. session restored by the refresh cookie): leave the login page.
  useEffect(() => {
    if (session.status === "authenticated" && session.user) {
      router.replace(afterLoginPath(session.user, next));
    }
  }, [session.status, session.user, next, router]);

  function update(field: Field, value: string) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    // Re-validate only fields that already show an error, so typing is not interrupted.
    if (errors[field]) setErrors((e) => ({ ...e, [field]: validate(nextValues)[field] }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fieldErrors = validate(values);
    setErrors(fieldErrors);
    setFormError(null);
    if (hasErrors(fieldErrors)) return;

    setSubmitting(true);
    try {
      const { user } = await authApi.login({ email: values.email.trim(), password: values.password });
      session.setUser(user);
      router.replace(afterLoginPath(user, next));
    } catch (error) {
      setErrors(getFieldErrors(error));
      setFormError({ code: errorCodeOf(error), message: getErrorMessage(error) });
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      {formError && (
        <Alert tone="error">
          {formError.message}
          {formError.code === "EMAIL_NOT_VERIFIED" && (
            <>
              {" "}
              <Link
                href={withQuery(ROUTES.registerCheckEmail, { email: values.email.trim() })}
                className="font-bold text-primary underline-offset-2 hover:underline"
              >
                Gửi lại email xác thực
              </Link>
            </>
          )}
        </Alert>
      )}

      <TextField
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="ten@example.com"
        value={values.email}
        onChange={(e) => update("email", e.target.value)}
        error={errors.email}
      />

      <div className="flex flex-col gap-2">
        <PasswordField
          label="Mật khẩu"
          name="password"
          autoComplete="current-password"
          placeholder="Nhập mật khẩu"
          value={values.password}
          onChange={(e) => update("password", e.target.value)}
          error={errors.password}
        />
        <Link
          href={ROUTES.forgotPassword}
          className="self-end rounded text-xs font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
        >
          Quên mật khẩu?
        </Link>
      </div>

      <Button type="submit" fullWidth loading={submitting}>
        Đăng nhập
      </Button>
    </form>
  );
}
