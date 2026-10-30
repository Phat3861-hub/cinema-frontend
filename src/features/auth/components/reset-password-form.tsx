"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { ROUTES } from "@/constants/routes";
import { authApi } from "@/features/auth/api";
import { PasswordRules } from "@/features/auth/components/password-rules";
import { useSession } from "@/features/auth/components/session-provider";
import {
  hasErrors,
  validateConfirmPassword,
  validateNewPassword,
  type FieldErrors,
} from "@/features/auth/validation";
import { errorCodeOf, getErrorMessage, getFieldErrors } from "@/lib/error-messages";

type Field = "newPassword" | "confirmPassword";

function validate(v: Record<Field, string>): FieldErrors<Field> {
  return {
    newPassword: validateNewPassword(v.newPassword),
    confirmPassword: validateConfirmPassword(v.confirmPassword, v.newPassword),
  };
}

const LINK_ERRORS = new Set(["TOKEN_INVALID", "TOKEN_EXPIRED"]);

/** Step 3–4 of Ticketor "Forgot password", opened from the email link `/reset-password?token=`. */
export function ResetPasswordForm({ token }: { token?: string }) {
  const session = useSession();
  const [values, setValues] = useState<Record<Field, string>>({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<{ code?: string; message: string } | null>(
    token ? null : { code: "TOKEN_INVALID", message: "Link đặt lại mật khẩu không hợp lệ." },
  );
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function update(field: Field, value: string) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    const nextErrors = validate(nextValues);
    setErrors((e) => ({
      newPassword: e.newPassword && nextErrors.newPassword,
      confirmPassword: e.confirmPassword && nextErrors.confirmPassword,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const fieldErrors = validate(values);
    setErrors(fieldErrors);
    setFormError(null);
    if (hasErrors(fieldErrors)) return;

    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, ...values });
      // The backend revokes every session and clears the cookies.
      session.setUser(null);
      setDone(true);
    } catch (error) {
      setErrors(getFieldErrors(error));
      setFormError({ code: errorCodeOf(error), message: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <CircleCheck aria-hidden className="size-16 text-success" strokeWidth={1.5} />
        <p role="status" className="text-sm font-medium text-neutral-200">
          Đặt lại mật khẩu thành công. Mọi thiết bị đã được đăng xuất, vui lòng đăng nhập lại bằng mật khẩu mới.
        </p>
        <Link href={ROUTES.login} className={buttonClasses({ fullWidth: true })}>
          Đăng nhập
        </Link>
      </div>
    );
  }

  const linkBroken = formError?.code !== undefined && LINK_ERRORS.has(formError.code);

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      {formError && (
        <Alert tone="error">
          {formError.message}
          {linkBroken && (
            <>
              {" "}
              <Link
                href={ROUTES.forgotPassword}
                className="font-bold text-primary underline-offset-2 hover:underline"
              >
                Yêu cầu link mới
              </Link>
            </>
          )}
        </Alert>
      )}
      <PasswordField
        label="Mật khẩu mới"
        name="newPassword"
        autoComplete="new-password"
        placeholder="Tạo mật khẩu mới"
        value={values.newPassword}
        onChange={(e) => update("newPassword", e.target.value)}
        error={errors.newPassword}
        hint={<PasswordRules password={values.newPassword} />}
        disabled={!token}
      />
      <PasswordField
        label="Nhập lại mật khẩu mới"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="Nhập lại mật khẩu mới"
        value={values.confirmPassword}
        onChange={(e) => update("confirmPassword", e.target.value)}
        error={errors.confirmPassword}
        disabled={!token}
      />
      <Button type="submit" fullWidth loading={submitting} disabled={!token}>
        Đặt lại mật khẩu
      </Button>
    </form>
  );
}
