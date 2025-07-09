# ===== developer (add below previous content) =====
## Shared service-layer conventions
- All data access lives in `src/services/*`.
- Each service exports:
  • `fetchXXX()` – online/offline via `useOfflineQuery`
  • `mutateXXX()` – optimistic update, then `sendPush()`
- Throw errors with `.code` property so UI can map to toast variants.

## Offline sync strategy
- A singleton `sync.service.ts` manages IndexedDB ↔ Supabase.
- Sync tables: projects, phases, tasks, phaseChecks, subcontractors.
- Conflict rule: "last writer wins" (timestamp column `updated_at`).

## Router conventions
- Public routes => no wrapper.
- Auth routes => `<RequireAuth />`.
- Admin routes => `<RequireAuth roles={['admin']} />`.

## Code splitting
Lazy-load every page file in `src/pages` using `React.lazy()` + `Suspense`.