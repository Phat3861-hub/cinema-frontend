/** Mirrors com.pnt.cinema.modules.media.dto.ImagePurpose: the form an uploaded image is for. */
export type ImagePurpose = "BANNER" | "MOVIE_POSTER" | "PRODUCT" | "CINEMA";

/** Mirrors UploadedImageResponse. */
export interface UploadedImage {
  url: string;
  width: number;
  height: number;
}
