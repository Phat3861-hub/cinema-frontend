import { env } from "@/lib/env";

/** What the backend accepts (it checks the content, not the name; this only saves a pointless upload). */
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const MAX_IMAGE_MB = 5;
/** Avatars are shrunk in the browser before upload, so a large phone photo is fine. */
export const MAX_AVATAR_SOURCE_MB = 20;
const AVATAR_UPLOAD_SIZE = 512;

export type ImageFileError = "type" | "size";

export function imageFileError(file: File, maxMb: number): ImageFileError | null {
  if (!IMAGE_ACCEPT.split(",").includes(file.type)) return "type";
  if (file.size > maxMb * 1024 * 1024) return "size";
  return null;
}

/** True for an image uploaded through the API (its URL may be plain http in dev). */
export function isUploadedImage(url: string): boolean {
  return url.startsWith(`${env.mediaUrl}/`);
}

/**
 * Center square of the photo as a 512 px JPEG. Drawing through createImageBitmap applies the EXIF rotation of phone
 * photos, which the backend would otherwise ignore, and keeps the upload far below its 2 MB limit.
 */
export async function avatarBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const size = Math.min(side, AVATAR_UPLOAD_SIZE);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, size, size);
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed"))), "image/jpeg", 0.9),
    );
  } finally {
    bitmap.close();
  }
}
