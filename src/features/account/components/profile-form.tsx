"use client";

import { Camera, Trash2 } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Avatar } from "@/components/layout/user-menu";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { authApi } from "@/features/auth/api";
import { useSession } from "@/features/auth/components/session-provider";
import { roleLabel } from "@/features/auth/permissions";
import type { CurrentUser, Gender } from "@/features/auth/types";
import {
  fieldMessage,
  hasErrors,
  validateFullName,
  validatePhone,
  type FieldErrors,
  type ValidationKey,
} from "@/features/auth/validation";
import { IMAGE_ACCEPT, MAX_AVATAR_SOURCE_MB, avatarBlob, imageFileError } from "@/features/media/image-file";
import { useT } from "@/i18n";
import { errorCodeOf, getErrorMessage, getFieldErrors } from "@/lib/error-messages";
import { todayInVietnam } from "@/lib/format";

type ProfileField = "fullName" | "phone" | "dateOfBirth" | "gender";
type Values = Record<ProfileField, string>;

const GENDERS: Gender[] = ["MALE", "FEMALE", "OTHER"];
const EARLIEST_BIRTH_DATE = "1900-01-01";

function valuesOf(user: CurrentUser): Values {
  return {
    fullName: user.fullName,
    phone: user.phone ?? "",
    dateOfBirth: user.dateOfBirth ?? "",
    gender: user.gender ?? "",
  };
}

function validateBirthDate(value: string): ValidationKey | undefined {
  if (value && (value < EARLIEST_BIRTH_DATE || value >= todayInVietnam())) return "birthDateInvalid";
}

/** `/account` (AUTH-07): avatar, editable profile fields, read-only email / status / roles. */
export function ProfileForm({ user }: { user: CurrentUser }) {
  const t = useT();
  const toast = useToast();
  const { setUser } = useSession();
  const [values, setValues] = useState<Values>(() => valuesOf(user));
  const [errors, setErrors] = useState<FieldErrors<ProfileField>>({});
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const saved = valuesOf(user);
  const dirty = (Object.keys(values) as ProfileField[]).some((key) => values[key].trim() !== saved[key]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const fieldErrors: FieldErrors<ProfileField> = {
      fullName: validateFullName(values.fullName),
      phone: validatePhone(values.phone),
      dateOfBirth: validateBirthDate(values.dateOfBirth),
    };
    setErrors(fieldErrors);
    setFormError(null);
    if (hasErrors(fieldErrors)) return;
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        fullName: values.fullName.trim(),
        phone: values.phone.trim() || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        gender: (values.gender || undefined) as Gender | undefined,
      });
      setUser(updated);
      setValues(valuesOf(updated));
      toast.success(t.account.profile.saved);
    } catch (error) {
      const code = errorCodeOf(error);
      if (code === "PHONE_ALREADY_EXISTS") setErrors({ phone: "phoneTaken" });
      else if (code === "VALIDATION_FAILED") {
        const fields = getFieldErrors(error);
        setErrors(Object.fromEntries(Object.keys(fields).map((field) => [field, "invalid"])) as FieldErrors<ProfileField>);
      } else setFormError(error);
    } finally {
      setSaving(false);
    }
  }

  const update = (field: ProfileField) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6" aria-labelledby="info-title">
      <h1 id="info-title" className="text-h6">
        {t.account.info}
      </h1>
      <AvatarEditor user={user} />
      <form noValidate onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
        {formError !== null && (
          <div className="sm:col-span-2">
            <Alert tone="error">{getErrorMessage(formError, t)}</Alert>
          </div>
        )}
        <TextField
          label={t.auth.fullName}
          required
          size="md"
          autoComplete="name"
          maxLength={100}
          value={values.fullName}
          onChange={update("fullName")}
          error={fieldMessage(t, errors.fullName)}
        />
        <TextField
          label={t.auth.email}
          size="md"
          type="email"
          value={user.email}
          readOnly
          disabled
          hint={t.account.profile.emailLocked}
        />
        <TextField
          label={t.auth.phone}
          optional
          size="md"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0912345678"
          value={values.phone}
          onChange={update("phone")}
          error={fieldMessage(t, errors.phone)}
        />
        <TextField
          label={t.account.profile.dateOfBirth}
          optional
          size="md"
          type="date"
          autoComplete="bday"
          min={EARLIEST_BIRTH_DATE}
          max={todayInVietnam()}
          value={values.dateOfBirth}
          onChange={update("dateOfBirth")}
          error={fieldMessage(t, errors.dateOfBirth)}
        />
        <SelectField
          label={t.account.profile.gender}
          optional
          size="md"
          value={values.gender}
          onChange={update("gender")}
          error={fieldMessage(t, errors.gender)}
        >
          <option value="">{t.account.profile.genderNone}</option>
          {GENDERS.map((gender) => (
            <option key={gender} value={gender}>
              {t.account.profile.genders[gender]}
            </option>
          ))}
        </SelectField>
        <dl className="flex flex-col gap-2">
          <dt className="text-sm font-medium text-fg">{t.account.status}</dt>
          <dd>
            <Badge tone={user.status === "ACTIVE" ? "success" : "warning"}>{t.userStatus[user.status]}</Badge>
          </dd>
        </dl>
        <dl className="flex flex-col gap-2 sm:col-span-2">
          <dt className="text-sm font-medium text-fg">{t.account.roles}</dt>
          <dd className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <Badge key={role.id} tone="accent">
                {roleLabel(role, t)}
              </Badge>
            ))}
          </dd>
        </dl>
        <div className="sm:col-span-2">
          <Button type="submit" size="md" loading={saving} disabled={!dirty}>
            {t.account.profile.save}
          </Button>
        </div>
      </form>
    </section>
  );
}

/** Photo + change / remove. The photo is cropped and shrunk in the browser, then the backend re-encodes it. */
function AvatarEditor({ user }: { user: CurrentUser }) {
  const t = useT();
  const toast = useToast();
  const { setUser } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = imageFileError(file, MAX_AVATAR_SOURCE_MB);
    if (problem) {
      setError(problem === "type" ? t.media.wrongType : t.media.tooLarge(MAX_AVATAR_SOURCE_MB));
      return;
    }
    setError(null);
    setBusy("upload");
    try {
      // A file the browser cannot decode goes as is; the backend then answers UNSUPPORTED_IMAGE_TYPE
      const blob = await avatarBlob(file).catch(() => file);
      setUser(await authApi.uploadAvatar(blob));
      toast.success(t.account.profile.avatarUpdated);
    } catch (err) {
      setError(getErrorMessage(err, t));
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("remove");
    try {
      setUser(await authApi.removeAvatar());
      toast.success(t.account.profile.avatarRemoved);
      setConfirmOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, t));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar user={user} size="xl" />
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-fg">{t.account.profile.avatar}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="md"
            loading={busy === "upload"}
            disabled={busy !== null}
            onClick={() => fileRef.current?.click()}
          >
            {busy !== "upload" && <Camera aria-hidden className="size-4" />}
            {user.avatarUrl ? t.account.profile.changeAvatar : t.account.profile.uploadAvatar}
          </Button>
          {user.avatarUrl && (
            <Button
              variant="ghost"
              size="md"
              disabled={busy !== null}
              onClick={() => setConfirmOpen(true)}
              className="text-danger"
            >
              <Trash2 aria-hidden className="size-4" />
              {t.account.profile.removeAvatar}
            </Button>
          )}
          <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} hidden tabIndex={-1} onChange={upload} />
        </div>
        {error ? (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        ) : (
          <p className="text-xs font-medium text-fg-muted">{t.account.profile.avatarHint}</p>
        )}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={remove}
        loading={busy === "remove"}
        title={t.account.profile.removeAvatarConfirm}
        description={t.account.profile.removeAvatarHint}
        confirmLabel={t.account.profile.removeAvatar}
      />
    </div>
  );
}
