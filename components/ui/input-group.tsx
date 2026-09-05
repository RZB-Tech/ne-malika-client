"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function InputGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "flex w-full min-w-0 items-end gap-2 rounded-3xl border border-border bg-muted/50 p-2 transition-[border-color,box-shadow] focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupAddon({
  className,
  align = "inline-end",
  ...props
}: ComponentProps<"div"> & { align?: "inline-start" | "inline-end" }) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "flex shrink-0 items-center",
        align === "inline-start" && "order-first",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupTextarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="input-group-control"
      className={cn(
        "block field-sizing-content min-h-11 w-full min-w-0 flex-1 resize-none bg-transparent px-2.5 py-2.5 text-base leading-6 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { InputGroup, InputGroupAddon, InputGroupTextarea };
