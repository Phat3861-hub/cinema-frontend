"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

/** next/image filling its parent; missing or broken URL → neutral placeholder with an icon. */
export function CoverImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div role="img" aria-label={alt} className="absolute inset-0 flex items-center justify-center bg-surface-3">
        <ImageOff aria-hidden className="size-8 text-fg-subtle" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailedSrc(src)}
      className={`object-cover ${className}`}
    />
  );
}
