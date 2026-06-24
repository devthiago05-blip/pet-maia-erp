import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/pet-maia-logo-web.png"
      alt="Clínica Veterinária Pet Maia"
      width={960}
      height={640}
      priority={priority}
      className={cn("h-auto w-full object-contain", className)}
    />
  );
}
