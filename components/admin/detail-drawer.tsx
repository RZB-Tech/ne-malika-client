"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function DetailDrawer({
  open,
  onOpenChange,
  badges,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badges?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-md">
        <div className="flex h-full min-h-0 flex-col">
          <DrawerHeader className="gap-2 px-5 pt-5 pb-4">
            {badges && <div className="flex flex-wrap items-center gap-1.5">{badges}</div>}
            <DrawerTitle className="text-left text-lg leading-snug">{title}</DrawerTitle>
            {description && (
              <DrawerDescription className="text-left">{description}</DrawerDescription>
            )}
          </DrawerHeader>

          <Separator />

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
            {children}
          </div>

          {footer && (
            <>
              <Separator />
              <DrawerFooter className="grid grid-cols-2 gap-2 px-5 py-4">{footer}</DrawerFooter>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", className)}>
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="truncate text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export function DetailNote({
  tone = "muted",
  title,
  children,
}: {
  tone?: "muted" | "danger" | "warning";
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 text-sm",
        tone === "danger" && "bg-destructive/8 text-destructive",
        tone === "warning" && "bg-warning/10 text-warning",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
      {title && <div className="font-medium">{title}</div>}
      <div className={cn("text-muted-foreground", title && "mt-1")}>{children}</div>
    </div>
  );
}

export function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

export const drawerAction = {
  neutral: "bg-muted/70 text-foreground hover:bg-muted",
  primary: "bg-primary/10 text-primary hover:bg-muted hover:text-foreground",
  warning: "bg-warning/12 text-warning hover:bg-muted hover:text-foreground",
  danger: "bg-destructive/10 text-destructive hover:bg-muted hover:text-foreground",
  success: "bg-success/12 text-success hover:bg-muted hover:text-foreground",
} as const;
