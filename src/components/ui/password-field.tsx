"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { TextField } from "@/components/ui/text-field";
import { useT } from "@/i18n";

type PasswordFieldProps = Omit<ComponentProps<typeof TextField>, "type" | "trailing">;

export function PasswordField(props: PasswordFieldProps) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t.auth.hidePassword : t.auth.showPassword}
          aria-pressed={visible}
          className="flex size-10 cursor-pointer items-center justify-center rounded text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Icon aria-hidden className="size-5" />
        </button>
      }
    />
  );
}
