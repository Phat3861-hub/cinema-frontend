import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "error" | "success" | "info";

const TONES: Record<Tone, { box: string; icon: typeof Info }> = {
  error: { box: "border-danger/40 bg-danger/10 text-danger", icon: CircleAlert },
  success: { box: "border-success/40 bg-success/10 text-success", icon: CircleCheck },
  info: { box: "border-secondary-600/40 bg-secondary-600/10 text-secondary-600", icon: Info },
};

/** Inline message box; errors are announced immediately (role="alert"), others politely. */
export function Alert({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  const { box, icon: Icon } = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded border px-4 py-3 text-sm font-medium ${box}`}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1 text-white/90">{children}</div>
    </div>
  );
}
