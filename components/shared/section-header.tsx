"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
  className,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="group hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
