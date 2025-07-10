/* --- developer section (EN) --- */
# ===== developer (shared conventions) ======================================
## 1. Service layer
- Source folder:               src/services/*
- Import alias:                @/services/…
- Each service exports:  
  • fetchX()   – read via useOfflineQuery (IndexedDB ↔ Supabase)  
  • mutateX()  – optimistic cache → Supabase → sendPush()
- Errors must expose error.code:  'RLS_DENIED' | 'NETWORK' | 'VALIDATION' | 'UNKNOWN'

## 2. Offline sync
- Singleton  @/services/sync.service.ts
- Synced tables: projects, phases, tasks, phaseChecks, subcontractors
- Conflict rule: **last-writer-wins** by `updated_at`
- Started once in main.tsx

## 3. Routing
- React Router v6 in src/router.tsx  
- Public → no wrapper  
- Auth  → <RequireAuth />  
- Admin → <RequireAuth roles={['admin']} />  
- Extra ACL → <RequireAccess … />
- Page files lazy-load; chunk prefix "page-"

## 4. Code-splitting pattern
const Dashboard = React.lazy(() =>
  import(/* webpackChunkName:"page-dashboard" */ '@/pages/Dashboard')
);
<Suspense fallback={<PageSkeleton/>}/>

# ===== developer (access control) ==========================================
## Roles
admin | manager | worker | guest (demo read-only)

## Schema
user_project_role(user_id, project_id, role) UNIQUE  
user_phase_role(upr_id → user_project_role.id, phase_id, role)

## RLS summary
project.select → row in user_project_role  
phase.select   → upr.role ∈ {manager, worker}  
task.select    → manager(any) | worker(assignee = uid)

## Front-end helpers
- useAccess({projectId?, phaseId?, taskId?}) → {canView, canEdit, role}
- <RequireAccess …/>
- useUserRole()

# ===== developer (mobile & tablet UX) ======================================
## Breakpoints & layout
- Phone < 480 px → bottom-nav + sheet dialogs  
- Tablet ≥ 768 px → side-rail + modal dialogs  
- Wrappers: <MobileLayout/> / <TabletLayout/>  
- Safe-area util: `pb-safe` = `pb-[env(safe-area-inset-bottom)]`

## Touch & gestures
- Min touch target 44×44 px
- Long-press ⇒ BottomSheet · iOS swipe-back via useSwipeBack()

## Visual tokens
- sm 480 | md 768 | lg 1024  
- Typography: text-base (phone) · text-lg (tablet)  
- Card: shadow-sm + rounded-2xl

## Performance
- Lists ≥ 20 items → virtualise (`react-window`)  
- Skeleton loaders if wait > 300 ms  
- Avoid inline SVG > 40 KB on low-RAM phones

# ===== developer (AI helpers) =============================================
- AI utilities live in @/services/ai/*.service.ts
- Provide manual fallback; never block UI > 2 s (use skeleton + cancel).

# ===== developer (output contract) ========================================
When you return code, output **one file only**, ≤ 120 chars/line, no commentary,
and follow all mobile, access, and path rules above.
/* --- end developer section --- */