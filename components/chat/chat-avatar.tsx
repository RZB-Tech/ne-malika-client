"use client";

import { StoreAvatar } from "@/components/shared/store-avatar";
import type { ChatDto } from "@/lib/api/generated/schemas";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";

export function ChatAvatar({
  chat,
  side,
  className = "size-10",
}: {
  chat: ChatDto;
  side: "buyer" | "seller";
  className?: string;
}) {
  const sellerView = side === "seller";
  return (
    <StoreAvatar
      name={sellerView ? chat.buyerName : chat.shopName}
      hue={hueFromId(sellerView ? chat.buyerId : chat.shopId)}
      src={photoUrl(sellerView ? chat.buyerPhoto : chat.shopPhoto)}
      className={`${className} ${sellerView ? "rounded-full" : "rounded-lg"} shrink-0 text-xs`}
    />
  );
}
