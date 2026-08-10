import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 px-3.5 py-2 text-base md:text-sm file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground rounded-xl border-0 bg-muted/60 outline-none transition-[background-color,box-shadow] placeholder:text-muted-foreground hover:bg-muted/80 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:ring-2 aria-invalid:ring-destructive/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/40 dark:hover:bg-input/60 dark:focus-visible:bg-input/60",
        className
      )}
      {...props}
    />
  )
}

export { Input }
