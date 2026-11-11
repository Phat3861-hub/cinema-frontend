/** Mirrors com.pnt.cinema.modules.media.dto.ImagePurpose: the form an uploaded image is for. */
/** MOVIE_IMAGE = gallery stills and cast photos. */
export type ImagePurpose = "BANNER" | "MOVIE_POSTER" | "MOVIE_IMAGE" | "PRODUCT" | "CINEMA";

/** Mirrors UploadedImageResponse. */
export interface UploadedImage {
  url: string;
  width: number;
  height: number;
}
