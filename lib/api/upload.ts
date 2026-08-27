import { sellerFilesControllerCreateUploadUrl } from "./generated/endpoints/files/files";
import type { CreateUploadUrlDtoContentType, UploadUrlResponseDto } from "./generated/schemas";

function toContentType(type: string): CreateUploadUrlDtoContentType {
  if (type === "image/png") return "image/png";
  if (type === "image/webp") return "image/webp";
  return "image/jpeg";
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(meta)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function uploadPhoto(blob: Blob): Promise<string> {
  const contentType = toContentType(blob.type);
  const presigned = (await sellerFilesControllerCreateUploadUrl({
    contentType,
  })) as unknown as UploadUrlResponseDto;

  const form = new FormData();
  Object.entries(presigned.fields).forEach(([k, v]) => form.append(k, v));
  form.append("file", blob);

  const res = await fetch(presigned.uploadUrl, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(`S3 upload failed: ${res.status}`);
  }
  return presigned.key;
}

export function resolvePhotoKeys(photos: { url: string; key?: string }[]): Promise<string[]> {
  return Promise.all(photos.map((p) => p.key ?? uploadPhoto(dataUrlToBlob(p.url))));
}
