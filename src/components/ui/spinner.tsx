import { LoaderCircle } from "lucide-react";

export function Spinner({ className = "size-5" }: { className?: string }) {
  return <LoaderCircle aria-hidden className={`animate-spin motion-reduce:animate-none ${className}`} />;
}
