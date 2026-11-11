/** Public env variables (NEXT_PUBLIC_ prefix, so they are inlined into the client bundle). */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:8080/ws",
  /** Base URL of images uploaded through the API (backend STORAGE_PUBLIC_URL); may be plain http in dev. */
  mediaUrl: process.env.NEXT_PUBLIC_MEDIA_URL ?? "http://localhost:9000/cinema-media",
} as const;
