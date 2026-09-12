"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { canOptimizeImage } from "@/lib/image-config";

type Props = Omit<ImageProps, "src" | "loader" | "unoptimized"> & { src: string };

export function ResponsiveImage(props: Props) {
  return <ImageSource key={props.src} {...props} />;
}

function ImageSource({ onError, alt, ...props }: Props) {
  const [original, setOriginal] = useState(false);
  const optimized = canOptimizeImage(props.src) && !original;
  return (
    <Image
      {...props}
      alt={alt}
      unoptimized={!optimized}
      onError={(event) => {
        // Keep photos visible if the optimizer/upstream temporarily fails.
        if (optimized) setOriginal(true);
        else onError?.(event);
      }}
    />
  );
}
