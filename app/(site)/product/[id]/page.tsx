import { notFound } from "next/navigation";
import { ProductDetailConnected } from "@/components/product/product-detail-connected";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();
  return <ProductDetailConnected id={numId} />;
}
