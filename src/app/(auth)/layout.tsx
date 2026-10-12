import Link from "next/link";
import { ROUTES } from "@/constants/routes";

/** Minimal layout for login / register: centered form, no full header. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <Link href={ROUTES.home} className="text-2xl font-bold text-red-600">
        PNT Cinema
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        {children}
      </div>
    </main>
  );
}
