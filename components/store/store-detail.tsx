"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  Phone,
  Search,
  Star,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product/product-card";
import { TelegramButton } from "@/components/product/telegram-button";
import { ReportDialog } from "@/components/shared/report-dialog";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/format";
import { type Product, type Store } from "@/lib/data";

export function StoreDetail({
  store,
  products = [],
}: {
  store: Store;
  products?: Product[];
}) {
  const { t, locale } = useT();
  const all = products;
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    if (!q.trim()) return all;
    const s = q.toLowerCase();
    return all.filter((p) =>
      `${p.name} ${p.brand} ${p.model}`.toLowerCase().includes(s),
    );
  }, [all, q]);

  const contacts = [
    { Icon: MapPin, label: t("product.address"), value: store.address },
    { Icon: Phone, label: t("product.phone"), value: store.phone },
    { Icon: Clock, label: t("store.workingHours"), value: store.workingHours },
    { Icon: Package, label: t("store.products"), value: String(all.length) },
    {
      Icon: CalendarDays,
      label: t("store.onPlatformSince"),
      value: formatDate(store.joined, locale),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6 sm:px-8 lg:px-10">
      <nav className="mb-5 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{t("brand.name")}</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground/70">{store.name}</span>
      </nav>

      {/* banner */}
      <Card className="overflow-hidden p-0">
        <div
          className="h-28 sm:h-36"
          style={{
            backgroundImage: `linear-gradient(120deg, oklch(0.62 0.16 ${store.logoHue}) 0%, oklch(0.42 0.14 ${store.logoHue}) 100%)`,
          }}
        />
        <div className="px-5 pb-5 sm:px-7 sm:pb-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <span
              className="-mt-12 grid size-24 shrink-0 place-items-center rounded-2xl border-4 border-card text-3xl font-bold text-white shadow-sm"
              style={{ background: `oklch(0.5 0.17 ${store.logoHue})` }}
            >
              {store.name.slice(0, 1)}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl font-bold tracking-tight">{store.name}</h1>
                {store.rating > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="size-3 fill-warning text-warning" />
                    <span className="tabular">{store.rating.toFixed(1)}</span>
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {store.description}
              </p>
            </div>
            <div className="flex gap-2">
              {store.telegram && (
                <TelegramButton
                  username={store.telegram}
                  label={t("store.write")}
                  size="default"
                />
              )}
              {store.phone && (
                <Button asChild variant="outline" size="default" className="gap-2">
                  <a href={`tel:${store.phone.replace(/\s/g, "")}`}>
                    <Phone className="size-4" />
                  </a>
                </Button>
              )}
              <ReportDialog shopId={Number(store.id)} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-5">
            {contacts.map((c) => (
              <div key={c.label} className="flex items-start gap-2.5">
                <c.Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                  <div className="truncate text-sm font-medium text-foreground">{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* products */}
      <div className="mt-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-bold tracking-tight">
            {t("store.products")}{" "}
            <span className="text-muted-foreground tabular">{all.length}</span>
          </h2>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("seller.products.search")}
              className="pl-9"
            />
          </div>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            {t("catalog.emptyTitle")}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
