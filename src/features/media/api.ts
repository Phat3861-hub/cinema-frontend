import type { ImagePurpose, UploadedImage } from "@/features/media/types";
import { apiFetch } from "@/lib/api-client";

/** `POST /api/v1/uploads/images`: stores the file as is; the form then saves the returned URL. */
export const mediaApi = {
  uploadImage: (purpose: ImagePurpose, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return apiFetch<UploadedImage>("/uploads/images", { method: "POST", body, query: { purpose } });
  },
};
