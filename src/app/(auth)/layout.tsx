import Image from "next/image";
import { Logo } from "@/components/layout/logo";

/** Ticketor "Sign In" layout: form column on the left, cinema photo on the right (desktop only). */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 lg:w-[43%] lg:flex-none">
        <div className="flex w-full max-w-[362px] flex-col">
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>
          {children}
        </div>
      </main>
      <div aria-hidden className="relative hidden flex-1 lg:block">
        <Image
          src="/images/auth-cover.webp"
          alt=""
          fill
          priority
          sizes="57vw"
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-transparent to-transparent" />
      </div>
    </div>
  );
}
