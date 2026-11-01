"use client";

import { Check, Circle } from "lucide-react";
import { PASSWORD_RULES } from "@/features/auth/validation";
import { useT } from "@/i18n";

/** Live checklist of the password policy (text + icon, not color alone). */
export function PasswordRules({ password, id }: { password: string; id?: string }) {
  const t = useT();
  return (
    <ul id={id} className="grid grid-cols-1 gap-1 sm:grid-cols-2" aria-label={t.auth.passwordRules.title}>
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        const Icon = met ? Check : Circle;
        return (
          <li
            key={rule.key}
            className={`flex items-center gap-1.5 text-xs font-medium ${met ? "text-success" : "text-fg-muted"}`}
          >
            <Icon aria-hidden className="size-3.5 shrink-0" />
            {t.auth.passwordRules[rule.key]}
            <span className="sr-only">{met ? t.auth.passwordRules.met : t.auth.passwordRules.unmet}</span>
          </li>
        );
      })}
    </ul>
  );
}
