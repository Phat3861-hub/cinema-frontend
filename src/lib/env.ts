/** Public env variables (NEXT_PUBLIC_ prefix, so they are inlined into the client bundle). */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:8080/ws",
} as const;
