import { notFound } from "next/navigation";
import { StoreDetailConnected } from "@/components/store/store-detail-connected";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = Number(slug);
  if (!Number.isFinite(id)) notFound();
  return <StoreDetailConnected id={id} />;
}
