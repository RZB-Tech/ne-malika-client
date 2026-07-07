"use client";

import { Hero } from "@/components/home/hero";
import { PromoBanners } from "@/components/home/promo-banners";
import { CategoriesSection } from "@/components/home/categories-section";
import { ProductRow } from "@/components/home/product-row";
import { HowItWorks } from "@/components/home/how-it-works";
import { SellerCta } from "@/components/home/seller-cta";
import { useT } from "@/components/providers/i18n-provider";
import { publicProducts } from "@/lib/data";

export default function HomePage() {
  const { t } = useT();

  const popular = [...publicProducts]
    .sort((a, b) => b.telegramClicks - a.telegramClicks)
    .slice(0, 10);

  const fresh = [...publicProducts]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

  const promo = publicProducts.filter((p) => p.isPromo).slice(0, 10);

  return (
    <>
      {/*<Hero />*/}
      {/*<PromoBanners />*/}
      {/*<CategoriesSection />*/}
      <ProductRow
        title={t("home.popularTitle")}
        subtitle={t("home.popularSubtitle")}
        href="/catalog"
        linkLabel={t("home.viewAll")}
        products={popular}
        tone="muted"
      />
      <ProductRow
        title={t("home.newTitle")}
        subtitle={t("home.newSubtitle")}
        href="/catalog?sort=newest"
        linkLabel={t("home.viewAll")}
        products={fresh}
      />
      <ProductRow
        title={t("home.promoTitle")}
        subtitle={t("home.promoSubtitle")}
        href="/catalog?promo=1"
        linkLabel={t("home.viewAll")}
        products={promo}
        tone="muted"
      />
      <HowItWorks />
      <SellerCta />
    </>
  );
}
