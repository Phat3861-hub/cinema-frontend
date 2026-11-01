"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import { ROUTES, withQuery } from "@/constants/routes";
import { authApi } from "@/features/auth/api";
import { PasswordRules } from "@/features/auth/components/password-rules";
import {
  hasErrors,
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validateNewPassword,
  validatePhone,
  fieldMessage,
  type FieldErrors,
} from "@/features/auth/validation";
import { useT } from "@/i18n";
import { errorCodeOf, getErrorMessage, getFieldErrors } from "@/lib/error-messages";

type Field = "fullName" | "email" | "phone" | "password" | "confirmPassword";

function validate(v: Record<Field, string>): FieldErrors<Field> {
  return {
    fullName: validateFullName(v.fullName),
    email: validateEmail(v.email),
    phone: validatePhone(v.phone),
    password: validateNewPassword(v.password),
    confirmPassword: validateConfirmPassword(v.confirmPassword, v.password),
  };
}

const EMPTY: Record<Field, string> = { fullName: "", email: "", phone: "", password: "", confirmPassword: "" };

export function RegisterForm() {
  const t = useT();
  const router = useRouter();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field: Field, value: string) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    const nextErrors = validate(nextValues);
    setErrors((e) => {
      const updated = { ...e };
      if (e[field]) updated[field] = nextErrors[field];
      // Changing the password can fix or break the confirmation.
      if (field === "password" && e.confirmPassword) updated.confirmPassword = nextErrors.confirmPassword;
      return updated;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fieldErrors = validate(values);
    setErrors(fieldErrors);
    setFormError(null);
    if (hasErrors(fieldErrors)) return;

    setSubmitting(true);
    const email = values.email.trim();
    try {
      await authApi.register({
        fullName: values.fullName.trim(),
        email,
        phone: values.phone.trim() || undefined,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      router.push(withQuery(ROUTES.registerCheckEmail, { email }));
    } catch (error) {
      const code = errorCodeOf(error);
      if (code === "EMAIL_ALREADY_EXISTS") setErrors({ email: "emailTaken" });
      else if (code === "PHONE_ALREADY_EXISTS") setErrors({ phone: "phoneTaken" });
      else {
        setErrors(getFieldErrors(error));
        setFormError(error);
      }
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {formError !== null && <Alert tone="error">{getErrorMessage(formError, t)}</Alert>}

      <TextField
        label={t.auth.fullName}
        name="fullName"
        autoComplete="name"
        placeholder={t.auth.fullNamePlaceholder}
        value={values.fullName}
        onChange={(e) => update("fullName", e.target.value)}
        error={fieldMessage(t, errors.fullName)}
      />
      <TextField
        label={t.auth.email}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="ten@example.com"
        value={values.email}
        onChange={(e) => update("email", e.target.value)}
        error={fieldMessage(t, errors.email)}
      />
      <TextField
        label={t.auth.phone}
        optional
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="0912345678"
        value={values.phone}
        onChange={(e) => update("phone", e.target.value)}
        error={fieldMessage(t, errors.phone)}
      />
      <PasswordField
        label={t.auth.password}
        name="password"
        autoComplete="new-password"
        placeholder={t.auth.newPasswordPlaceholder}
        value={values.password}
        onChange={(e) => update("password", e.target.value)}
        error={fieldMessage(t, errors.password)}
        hint={<PasswordRules password={values.password} />}
      />
      <PasswordField
        label={t.auth.confirmPassword}
        name="confirmPassword"
        autoComplete="new-password"
        placeholder={t.auth.confirmPassword}
        value={values.confirmPassword}
        onChange={(e) => update("confirmPassword", e.target.value)}
        error={fieldMessage(t, errors.confirmPassword)}
      />

      <Button type="submit" fullWidth loading={submitting} className="mt-1">
        {t.auth.register.submit}
      </Button>
    </form>
  );
}
