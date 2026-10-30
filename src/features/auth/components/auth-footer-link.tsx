import Link from "next/link";

/** "Don't have an account? Sign Up" line under the form. */
export function AuthFooterLink({ text, href, label }: { text: string; href: string; label: string }) {
  return (
    <p className="mt-6 text-center text-sm font-medium text-neutral-200">
      {text}{" "}
      <Link
        href={href}
        className="rounded font-bold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {label}
      </Link>
    </p>
  );
}
