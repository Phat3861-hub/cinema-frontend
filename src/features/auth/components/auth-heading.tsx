import type { ReactNode } from "react";

/** Title block of an auth screen (Ticketor "Sign In": centered heading under the logo). */
export function AuthHeading({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-h4 text-balance">{title}</h1>
      {description && <p className="mt-2 text-sm font-medium text-neutral-300">{description}</p>}
    </div>
  );
}
