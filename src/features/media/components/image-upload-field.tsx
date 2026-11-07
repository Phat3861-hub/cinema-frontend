"use client";

import { Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Field, controlClasses } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/features/auth/components/session-provider";
import { hasAny } from "@/features/auth/permissions";
import { mediaApi } from "@/features/media/api";
import { IMAGE_ACCEPT, MAX_IMAGE_MB, imageFileError } from "@/features/media/image-file";
import type { ImagePurpose } from "@/features/media/types";
import { useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";

/** Same permission the backend asks for each purpose (ImagePurpose.java). */
const PERMISSION: Record<ImagePurpose, string> = {
  BANNER: "BANNER_MANAGE",
  MOVIE_POSTER: "MOVIE_MANAGE",
  PRODUCT: "PRODUCT_MANAGE",
  CINEMA: "CINEMA_MANAGE",
};

/**
 * Image URL input with an "Upload" button next to it: the chosen file is uploaded right away and its URL put into
 * the input, so the form saves it like a typed URL. Typing a URL still works. The button is hidden from users
 * without the upload permission of `purpose`.
 */
export function ImageUploadField({
  purpose,
  label,
  value,
  onChange,
  error,
  hint,
  required,
  optional,
  placeholder = "https://…",
}: {
  purpose: ImagePurpose;
  label: ReactNode;
  value: string;
  onChange: (url: string) => void;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
}) {
  const t = useT();
  const toast = useToast();
  const { user } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>();
  const canUpload = hasAny(user, [PERMISSION[purpose]]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Allows picking the same file again after an error
    event.target.value = "";
    if (!file) return;
    const problem = imageFileError(file, MAX_IMAGE_MB);
    if (problem) {
      setUploadError(problem === "type" ? t.media.wrongType : t.media.tooLarge(MAX_IMAGE_MB));
      return;
    }
    setUploadError(undefined);
    setUploading(true);
    try {
      const image = await mediaApi.uploadImage(purpose, file);
      onChange(image.url);
      toast.success(t.media.uploaded);
    } catch (err) {
      setUploadError(getErrorMessage(err, t));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field
      label={label}
      error={uploadError ?? error}
      hint={hint ?? (canUpload ? t.media.hint(MAX_IMAGE_MB) : undefined)}
      required={required}
      optional={optional}
    >
      {(ids) => (
        <div className="flex flex-wrap gap-2">
          <input
            id={ids.id}
            type="url"
            inputMode="url"
            maxLength={500}
            aria-invalid={ids.invalid}
            aria-describedby={ids.describedBy}
            aria-required={required || undefined}
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              setUploadError(undefined);
              onChange(e.target.value);
            }}
            className={`${controlClasses({ invalid: Boolean(uploadError ?? error), size: "md" })} min-w-40 flex-1`}
          />
          {canUpload && (
            <>
              <Button
                type="button"
                variant="outline"
                size="md"
                loading={uploading}
                onClick={() => fileRef.current?.click()}
                className="shrink-0"
              >
                {!uploading && <Upload aria-hidden className="size-4" />}
                {uploading ? t.media.uploading : t.media.upload}
              </Button>
              <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} hidden onChange={upload} tabIndex={-1} />
            </>
          )}
        </div>
      )}
    </Field>
  );
}
