import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Единая ширина и горизонтальные поля всех страниц витрины. */
export function PageContainer({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-site px-5 sm:px-8",
        className,
      )}
      {...props}
    />
  );
}
