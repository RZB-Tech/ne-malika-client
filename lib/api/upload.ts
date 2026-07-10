// Direct-to-S3 photo upload via presigned POST.
// 1) ask the backend for a presigned POST (returns key + url + fields)
// 2) POST the file as multipart/form-data straight to S3
// The returned `key` (uuid) is what we store in product_cards.photos / shops.photo.

import { sellerFilesControllerCreateUploadUrl } from "./generated/endpoints/files/files";
import type {
  CreateUploadUrlDtoContentType,
  UploadUrlResponseDto,
} from "./generated/schemas";

function toContentType(type: string): CreateUploadUrlDtoContentType {
  if (type === "image/png") return "image/png";
  if (type === "image/webp") return "image/webp";
  return "image/jpeg";
}

/** Convert a data: URL produced by the dropzone back into a Blob. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(meta)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Uploads one blob and resolves to its stored S3 key. Throws on failure so the
 * caller can decide how to degrade (e.g. keep going with the other photos).
 */
export async function uploadPhoto(blob: Blob): Promise<string> {
  const contentType = toContentType(blob.type);
  const presigned = (await sellerFilesControllerCreateUploadUrl({
    contentType,
  })) as unknown as UploadUrlResponseDto;

  const form = new FormData();
  // Presigned POST requires the policy fields BEFORE the file field.
  Object.entries(presigned.fields).forEach(([k, v]) => form.append(k, v));
  form.append("file", blob);

  const res = await fetch(presigned.uploadUrl, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(`S3 upload failed: ${res.status}`);
  }
  return presigned.key;
}
