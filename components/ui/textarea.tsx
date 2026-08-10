import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full px-3.5 py-2.5 text-base md:text-sm rounded-xl border-0 bg-muted/60 outline-none transition-[background-color,box-shadow] placeholder:text-muted-foreground hover:bg-muted/80 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:ring-2 aria-invalid:ring-destructive/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/40 dark:hover:bg-input/60 dark:focus-visible:bg-input/60",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
