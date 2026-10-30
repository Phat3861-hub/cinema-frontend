import { Check, Circle } from "lucide-react";
import { PASSWORD_RULES } from "@/features/auth/validation";

/** Live checklist of the password policy (text + icon, not color alone). */
export function PasswordRules({ password, id }: { password: string; id?: string }) {
  return (
    <ul id={id} className="grid grid-cols-1 gap-1 sm:grid-cols-2" aria-label="Yêu cầu mật khẩu">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        const Icon = met ? Check : Circle;
        return (
          <li
            key={rule.label}
            className={`flex items-center gap-1.5 text-xs font-medium ${met ? "text-success" : "text-neutral-300"}`}
          >
            <Icon aria-hidden className="size-3.5 shrink-0" />
            {rule.label}
            <span className="sr-only">{met ? "(đã đạt)" : "(chưa đạt)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
