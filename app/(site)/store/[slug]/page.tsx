import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StoreDetail } from "@/components/store/store-detail";
import { getStoreBySlug, stores } from "@/lib/data";

export function generateStaticParams() {
  return stores.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = getStoreBySlug(slug);
  return { title: store?.name ?? "Магазин" };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = getStoreBySlug(slug);
  if (!store) notFound();
  return <StoreDetail store={store} />;
}
