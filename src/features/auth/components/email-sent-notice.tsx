import { MailCheck } from "lucide-react";
import type { ReactNode } from "react";

/** Big mail icon + message, shared by "check your email" screens (replaces Ticketor's OTP screen). */
export function EmailSentNotice({ email, children }: { email?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-accent/10">
        <MailCheck aria-hidden className="size-8 text-accent" />
      </div>
      {email && <p className="text-h8 break-all">{email}</p>}
      <div className="text-sm font-medium text-fg-2">{children}</div>
    </div>
  );
}
