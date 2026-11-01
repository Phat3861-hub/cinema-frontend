import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { Msg } from "@/i18n/msg";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-7xl font-bold text-accent">404</p>
      <h1 className="text-h6">
        <Msg id="common.notFound" />
      </h1>
      <Link href={ROUTES.home} className={buttonClasses({ size: "md" })}>
        <Msg id="common.backHome" />
      </Link>
    </main>
  );
}
