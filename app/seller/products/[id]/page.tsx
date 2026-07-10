import { notFound } from "next/navigation";
import { SellerProductDetail } from "@/components/seller/seller-product-detail";

export default async function SellerProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();
  return <SellerProductDetail id={numId} />;
}
