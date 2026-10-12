/** Mirrors com.pnt.cinema.common.response.ApiResponse on the backend. */
export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data?: T;
  timestamp: string;
}

/** Mirrors com.pnt.cinema.common.response.PageResponse on the backend. */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
