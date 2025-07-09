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

# ===== developer  (Access-control rules) =====
## Roles
- admin      → full access to all data
- manager    → can view any project to which they are linked and create/update tasks
- worker     → can view only assigned tasks and update their own task status
- guest      → read-only demo

## Data model  (all tables already created in Supabase)
┌──────────────────────────┐
│ user_project_role        │  -- row unique (user_id, project_id)
│  id  (uuid)              │
│  user_id    uuid FK      │
│  project_id uuid FK      │
│  role  enum  ('manager'|'worker') │
└──────────────────────────┘

┌──────────────────────────┐
│ user_phase_role          │  -- optional fine-grain override
│  id  (uuid)              │
│  upr_id     uuid FK → user_project_role(id)
│  phase_id   uuid FK      │
│  role enum ('manager'|'worker') │
└──────────────────────────┘

## Supabase Row-Level-Security snippets  (already deployed)
- user can `select` project if exists user_project_role.user_id = auth.uid()
- user can `select/update` phase if their upr_id matches project AND (role='manager' OR role='worker')
- user can `select/update` tasks if:
    • manager → any task in their phases
    • worker  → tasks where `assignee = auth.uid()`

## Front-end helpers  (must exist in codebase)
- `useAccess()`            // returns { canView, canEdit, role }
- `RequireAccess` component
- `useUserRole()`          // already exists

### useAccess API
useAccess({ projectId?: string, phaseId?: string, taskId?: string })
→ { canView: boolean, canEdit: boolean, role: 'admin'|'manager'|'worker'|'guest' }

## UI conventions
- Any "lock" icon = <LockKeyhole className="text-muted-foreground" />
- Routes that need access wrap with <RequireAccess projectId={id} />

## Output contract
When a prompt asks for code, return **one file only**, no commentary.