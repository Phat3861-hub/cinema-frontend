"use client";

import { KeyRound, LogOut, MonitorSmartphone, Ticket, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Avatar } from "@/components/layout/user-menu";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { PasswordField } from "@/components/ui/password-field";
import { LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { ROUTES, withQuery } from "@/constants/routes";
import { authApi } from "@/features/auth/api";
import { PasswordRules } from "@/features/auth/components/password-rules";
import { useSession } from "@/features/auth/components/session-provider";
import { roleLabel } from "@/features/auth/permissions";
import type { CurrentUser } from "@/features/auth/types";
import {
  fieldMessage,
  hasErrors,
  validateConfirmPassword,
  validateLoginPassword,
  validateNewPassword,
  type FieldErrors,
} from "@/features/auth/validation";
import { MyBookings } from "@/features/booking/components/my-bookings";
import { useT } from "@/i18n";
import { errorCodeOf, getErrorMessage } from "@/lib/error-messages";

/** Profile sidebar (Ticketor Profile) + account info, change password, sign out of every device. */
export function AccountScreen({ section }: { section: "account" | "tickets" }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useSession();

  useEffect(() => {
    if (status === "anonymous") router.replace(withQuery(ROUTES.login, { next: pathname }));
  }, [status, router, pathname]);

  if (!user) return <LoadingState />;

  return (
    <div className="mx-auto grid w-full max-w-[1232px] items-start gap-6 px-4 py-8 lg:grid-cols-[260px_1fr]">
      <AccountNav user={user} section={section} />
      {section === "account" ? <AccountDetails user={user} /> : <MyBookings />}
    </div>
  );
}

function AccountNav({ user, section }: { user: CurrentUser; section: "account" | "tickets" }) {
  const t = useT();
  const router = useRouter();
  const { logout } = useSession();
  const items = [
    { key: "account", href: ROUTES.account, label: t.nav.account, icon: UserRound },
    { key: "tickets", href: ROUTES.myTickets, label: t.nav.myTickets, icon: Ticket },
  ] as const;

  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-3 border-b border-line pb-4">
        <Avatar user={user} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-bold">{user.fullName}</p>
          <p className="truncate text-xs font-medium text-fg-muted">{user.email}</p>
        </div>
      </div>
      <nav aria-label={t.account.menu}>
        <ul className="flex flex-col gap-1 text-sm font-semibold">
          {items.map(({ key, href, label, icon: Icon }) => (
            <li key={key}>
              <Link
                href={href}
                aria-current={section === key ? "page" : undefined}
                className={`flex items-center gap-3 rounded px-3 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                  section === key ? "bg-primary text-black" : "text-fg-2 hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={async () => {
                await logout().catch(() => undefined);
                router.replace(ROUTES.login);
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded px-3 py-2.5 text-danger hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-accent"
            >
              <LogOut aria-hidden className="size-4" />
              {t.nav.logout}
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

function AccountDetails({ user }: { user: CurrentUser }) {
  const t = useT();
  const rows = [
    { label: t.auth.fullName, value: user.fullName },
    { label: t.auth.email, value: user.email },
    { label: t.auth.phone, value: user.phone ?? "—" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-line bg-surface p-6" aria-labelledby="info-title">
        <h1 id="info-title" className="text-h6 mb-5">
          {t.account.info}
        </h1>
        <dl className="grid gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1">
              <dt className="text-xs font-semibold text-fg-muted">{row.label}</dt>
              <dd className="font-semibold break-all">{row.value}</dd>
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold text-fg-muted">{t.account.status}</dt>
            <dd>
              <Badge tone={user.status === "ACTIVE" ? "success" : "warning"}>{t.userStatus[user.status]}</Badge>
            </dd>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <dt className="text-xs font-semibold text-fg-muted">{t.account.roles}</dt>
            <dd className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <Badge key={role.id} tone="accent">
                  {roleLabel(role, t)}
                </Badge>
              ))}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-xs font-medium text-fg-subtle">{t.account.profileSoon}</p>
      </section>
      <ChangePassword />
      <LogoutEverywhere />
    </div>
  );
}

type PwField = "currentPassword" | "newPassword" | "confirmPassword";
const EMPTY: Record<PwField, string> = { currentPassword: "", newPassword: "", confirmPassword: "" };

function ChangePassword() {
  const t = useT();
  const toast = useToast();
  const { setUser } = useSession();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<PwField>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  function validate(v: Record<PwField, string>): FieldErrors<PwField> {
    return {
      currentPassword: validateLoginPassword(v.currentPassword),
      newPassword: validateNewPassword(v.newPassword),
      confirmPassword: validateConfirmPassword(v.confirmPassword, v.newPassword),
    };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const fieldErrors = validate(values);
    setErrors(fieldErrors);
    setFormError(null);
    if (hasErrors(fieldErrors)) return;
    setSaving(true);
    try {
      const session = await authApi.changePassword(values);
      setUser(session.user);
      setValues(EMPTY);
      toast.success(t.account.passwordChanged);
    } catch (error) {
      const code = errorCodeOf(error);
      if (code === "CURRENT_PASSWORD_INCORRECT") setErrors({ currentPassword: "currentWrong" });
      else if (code === "NEW_PASSWORD_SAME_AS_CURRENT") setErrors({ newPassword: "sameAsCurrent" });
      else setFormError(error);
    } finally {
      setSaving(false);
    }
  }

  const update = (field: PwField) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  return (
    <section className="rounded-2xl border border-line bg-surface p-6" aria-labelledby="pw-title">
      <h2 id="pw-title" className="text-h8 mb-1 flex items-center gap-2">
        <KeyRound aria-hidden className="size-5" />
        {t.account.changePassword}
      </h2>
      <p className="mb-5 text-sm font-medium text-fg-muted">{t.account.changePasswordHint}</p>
      <form noValidate onSubmit={submit} className="grid max-w-xl gap-5">
        {formError !== null && <Alert tone="error">{getErrorMessage(formError, t)}</Alert>}
        <PasswordField
          label={t.account.currentPassword}
          autoComplete="current-password"
          value={values.currentPassword}
          onChange={update("currentPassword")}
          error={fieldMessage(t, errors.currentPassword)}
        />
        <PasswordField
          label={t.auth.newPassword}
          autoComplete="new-password"
          value={values.newPassword}
          onChange={update("newPassword")}
          error={fieldMessage(t, errors.newPassword)}
          hint={<PasswordRules password={values.newPassword} />}
        />
        <PasswordField
          label={t.auth.confirmNewPassword}
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={update("confirmPassword")}
          error={fieldMessage(t, errors.confirmPassword)}
        />
        <div>
          <Button type="submit" loading={saving}>
            {t.account.savePassword}
          </Button>
        </div>
      </form>
    </section>
  );
}

function LogoutEverywhere() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const { setUser } = useSession();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await authApi.logoutAll();
      await authApi.logout().catch(() => undefined);
      setUser(null);
      router.replace(ROUTES.login);
    } catch (error) {
      toast.error(getErrorMessage(error, t));
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center" aria-labelledby="sessions-title">
      <MonitorSmartphone aria-hidden className="size-8 shrink-0 text-fg-muted" />
      <div className="flex-1">
        <h2 id="sessions-title" className="text-h8">
          {t.account.logoutAll}
        </h2>
        <p className="text-sm font-medium text-fg-muted">{t.account.logoutAllHint}</p>
      </div>
      <Button variant="outline" size="md" onClick={() => setOpen(true)}>
        {t.account.logoutAllButton}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        loading={busy}
        title={t.account.logoutAllConfirm}
        description={t.account.logoutAllHint}
        confirmLabel={t.account.logoutAllButton}
      />
    </section>
  );
}
