@AGENTS.md

# CLAUDE.md – cinema-frontend

Web UI for a cinema ticket booking platform (Next.js 16, React 19, TypeScript, Tailwind CSS 4).
Backend lives in a separate repo (`cinema-backend`, Spring Boot). Business rules and the ERD are in
`cinema-backend/docs/` – read the relevant section before building a feature.

## Commands

```bash
npm run dev        # http://localhost:3000 (backend expected at http://localhost:8080)
npm run lint
npm run typecheck  # next typegen + tsc --noEmit
npm run build
```

Always run `npm run lint && npm run typecheck && npm run build` before declaring a task done.

## Rules

### 1. Language
- **All code comments are in English.** Identifiers and file names are in English.
- User-facing text (UI labels, messages, metadata titles) stays in **Vietnamese**.
- Commit messages: English, Conventional Commits (`feat(booking): seat map with live status`).

### 2. Next.js 16 – this is not the Next.js from older tutorials
- Check `node_modules/next/dist/docs/` before using an API you are not sure about.
- **Cache Components is enabled** (`cacheComponents: true`):
  - Don't `await params` / `searchParams` at the top of a page or layout. Pass the promise down and resolve it inside `<Suspense>` (see `src/app/(main)/movies/[slug]/page.tsx`).
  - Wrap runtime data (cookies, headers, uncached fetches) in `<Suspense>` with a fallback.
- Use the global `PageProps<"/route">` / `LayoutProps<"/route">` helpers for typing.
- Request interception lives in `src/proxy.ts` (the old `middleware.ts` is renamed to `proxy`).

### 3. Project structure
```
src/
├── app/                 routing only: page, layout, loading, error, not-found
│   ├── (main)/          customer pages (header + footer)
│   ├── (auth)/          login / register
│   └── admin/           back office (sidebar)
├── features/<module>/   business code per module: api.ts, types.ts, components/, hooks/
├── components/ui/       reusable, business-agnostic UI (button, input, modal...)
├── components/layout/   header, footer, sidebar
├── hooks/               shared hooks
├── lib/                 api-client, env, format helpers
├── constants/routes.ts  every app URL
└── types/api.ts         ApiResponse / PageResponse – must mirror the backend
```
- Keep `app/` thin: pages compose components from `features/` and `components/`.
- Code used by one feature stays in that feature; move it to `components/` or `hooks/` once a second feature needs it.
- Never hard-code URLs – use `ROUTES` from `@/constants/routes`.
- Always import via the `@/` alias, no long relative paths (`../../..`).

### 4. Server vs Client Components
- Server Components by default.
- Add `"use client"` only when needed (state, effects, event handlers, browser APIs, WebSocket) and push it down to the smallest leaf component.
- Never import server-only code (secrets, server fetch helpers) into a client component.

### 5. Data fetching & API
- Call the backend only through `apiFetch` from `@/lib/api-client`. No raw `fetch` to the backend elsewhere.
- Put each module's API calls in `features/<module>/api.ts` and its response types in `features/<module>/types.ts`.
- Handle errors by `ApiError.code` (matches the backend `ErrorCode`, e.g. `SEAT_NOT_AVAILABLE`), never by parsing the message.
- Seat status is real-time: use the STOMP WebSocket (`env.wsUrl`, topic `/topic/showtimes/{id}/seats`), don't poll.

### 6. Auth & permissions
- The UI may hide menus/buttons based on the user's permissions, but **the backend is the source of truth** – never assume hiding a button secures anything.
- Never store tokens in `localStorage`; prefer httpOnly cookies.

### 7. TypeScript
- `strict` mode; **no `any`** (use `unknown` + narrowing).
- Type every API payload explicitly.
- Components: named exports (`export function SeatMap`), except `page` / `layout` / `not-found` which must be default exports.
- File names: kebab-case (`seat-map.tsx`); components: PascalCase.

### 8. Styling
- Tailwind utility classes only; no inline `style` except for truly dynamic values (e.g. seat grid positions).
- Mobile-first responsive design; support dark mode (`dark:` variants).
- Brand colour: `red-600` (hover `red-700`); neutral palette: `zinc`.
- Interactive elements must be accessible: real `<button>` / `<Link>`, visible focus, `aria-label` for icon-only buttons.

### 9. Environment variables
- Read them only through `@/lib/env`.
- `NEXT_PUBLIC_*` values are shipped to the browser – never put secrets there.
- Add every new variable to `.env.example`.
