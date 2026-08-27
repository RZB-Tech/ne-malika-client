import { MAX_PHOTOS, type UploadedPhoto } from "@/components/seller/photo-dropzone";

export interface ApplyResult {
  photos: UploadedPhoto[];
  dropped: number;
}

export function applyGenerated(
  prev: UploadedPhoto[],
  sourceId: string | undefined,
  generated: UploadedPhoto[],
): ApplyResult {
  const at = sourceId ? prev.findIndex((p) => p.id === sourceId) : -1;

  const room = MAX_PHOTOS - prev.length + (at === -1 ? 0 : 1);
  const fitting = generated.slice(0, Math.max(0, room));
  const dropped = generated.length - fitting.length;

  if (fitting.length === 0) return { photos: prev, dropped };

  if (at === -1) return { photos: [...prev, ...fitting], dropped };

  const next = [...prev];
  next.splice(at, 1, fitting[0]);
  return { photos: [...next, ...fitting.slice(1)], dropped };
}
