# GDRFA — Roles & Capabilities Documentation

> Complete reference for the Role-Based Access Control (RBAC) system across Admin Panel, Employee Portal, and Node.js Backend.

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Role Definitions](#2-role-definitions)
3. [Permission System](#3-permission-system)
4. [Role Capabilities Matrix](#4-role-capabilities-matrix)
5. [Admin Panel — Route & Feature Access](#5-admin-panel--route--feature-access)
6. [Employee Portal — Access](#6-employee-portal--access)
7. [Backend API — Route Protection](#7-backend-api--route-protection)
8. [Approval Workflow](#8-approval-workflow)
9. [Authentication Flow by Role](#9-authentication-flow-by-role)
10. [Middleware & Guards](#10-middleware--guards)
11. [Data Scoping by Role](#11-data-scoping-by-role)
12. [Resource Authorization](#12-resource-authorization)
13. [File Reference Index](#13-file-reference-index)

---

## 1. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        CIAM (External)                       │
│   Identity Provider — Stores Roles, Users, Permissions       │
│   Encrypted role payloads decrypted via RSA + AES-CBC        │
└──────────────────────┬───────────────────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │    Node.js Backend (API)    │
         │  Express 5 + Sequelize      │
         │  JWT + Session Auth         │
         └──────┬──────────────┬───────┘
                │              │
    ┌───────────┴──┐    ┌─────┴──────────┐
    │  Admin Panel  │    │ Employee Portal │
    │  React 19     │    │ React 19        │
    │  TypeScript    │    │ TypeScript      │
    │  Vite + TW4   │    │ Vite + TW4      │
    └──────────────┘    └────────────────┘
```

**Key principles:**
- Roles are managed externally in **CIAM** (Central Identity & Access Management)
- Role payloads are encrypted; decrypted server-side using RSA + AES-CBC
- Permissions are **slug-based strings** (e.g., `create-event`, `view-dashboard`)
- Authorization is enforced at **3 layers**: Backend middleware, Frontend route guards, UI conditional rendering
- SuperAdmin has a **wildcard (`*`)** permission that bypasses all checks

---

## 2. Role Definitions

### 2.1 Role IDs (CIAM UUIDs)

Defined in `Node/.env`:

| # | Role Name | Environment Variable | GUID |
|---|---|---|---|
| 1 | **Super Admin** | `SUPERADMINROLEID` | `8B1FABC7-73AF-47F5-944C-3BA7FF049AAF` |
| 2 | **Admin** | `ADMINROLEID` | `3C440A49-C079-479E-9747-53296DEC4D29` |
| 3 | **Event Coordinator** | `EVENTCOORDINATORROLEID` | `93F59035-41A2-4A4A-A7D8-189EE28197E3` |
| 4 | **Manager** | `MANAGERROLEID` | `2A778BDA-3C94-48DC-A756-2F422BDD04D2` |
| 5 | **Staff** | `STAFFROLEID` | `B2A05A1C-C96C-4E68-914C-222C0E18C30C` |
| 6 | **Employee / User** | `USERROLEID` | `E4C276C5-9DFE-456B-B37D-9C7DF24CF3A7` |

### 2.2 Implicit Hierarchy

```
Super Admin  (Level 0)  — Full system access, bypasses all checks
     │
Admin        (Level 1)  — Full admin panel access (with permissions)
     │
Event Coord. (Level 2)  — Event approval + scoped event visibility
     │
Manager      (Level 3)  — Team-scoped dashboard + pending approvals
     │
Staff        (Level 4)  — Operational access (no specific code differentiation from Employee)
     │
Employee     (Level 5)  — Self-service: register for events, view profile/certificates
```

> **Note:** There is no formal role inheritance in code. The hierarchy is implemented through bypass patterns (wildcard `*` for SuperAdmin, `verifyAdminOrSuperAdmin` middleware for Admin+).

---

## 3. Permission System

### 3.1 How Permissions Work

1. On login, the backend fetches the user's **role** from CIAM (decrypted from encrypted payload)
2. Permissions for that role are fetched from CIAM/DB
3. Permissions are returned to the frontend in the login response and stored in `AuthContext`
4. On every API request, `verifyToken` middleware re-fetches permissions from CIAM
5. Middleware and controllers check permissions using slug-based matching

### 3.2 Complete Permission List

All permission slugs defined in `Node/utils/permissionChecker.js`:

#### Master / Global
| Slug | Description |
|---|---|
| `master` | Broad fallback permission for resources without specific slugs |
| `*` | SuperAdmin wildcard — grants ALL permissions |
| `can-login` | Required to access the admin panel |
| `admin-access` | Admin panel access flag |

#### Dashboard
| Slug | Description |
|---|---|
| `view-dashboard` | View main dashboard |
| `view-latest-events` | View latest events widget |
| `view-latest-participants` | View latest participants widget |
| `view-total-employees` | View total employees count |
| `view-total-events` | View total events count |
| `view-total-managers` | View total managers count |
| `view-total-participants` | View total participants count |

#### Events
| Slug | Description |
|---|---|
| `create-event` | Create new events |
| `edit-event` | Edit existing events |
| `delete-event` | Delete events |
| `view-event` | View event list and details |
| `can-event-end-or-complete` | End or complete an event |
| `can-manage-activities` | Manage event activities |
| `change-event-active-inactive` | Toggle event active/inactive status |
| `change-event-status` | Change event status |
| `approve-event` | Approve or reject events |

#### Participants
| Slug | Description |
|---|---|
| `view-list-participants` | View participant list |
| `view-details-of-participant` | View participant details |
| `change-status-of-participant` | Change participant status |

#### Approvals
| Slug | Description |
|---|---|
| `can-approve-or-reject-request` | Approve or reject facility requests |
| `can-change-status` | Change status of requests |

#### Users (Employees)
| Slug | Description |
|---|---|
| `create-users` | Create employee accounts |
| `edit-users` | Edit employee accounts |
| `delete-users` | Delete employee accounts |
| `list-view-users` | View employee list |
| `user-view-details-page` | View employee detail page |
| `view-user-management` | Access user management module |
| `change-user-status` | Enable/disable employee accounts |

#### Admin Users
| Slug | Description |
|---|---|
| `create-admin` | Create admin accounts |
| `edit-admin` | Edit admin accounts |
| `delete-admin` | Delete admin accounts |
| `list-view-admin` | View admin list |
| `change-admin-status` | Enable/disable admin accounts |

#### Managers
| Slug | Description |
|---|---|
| `create-manager` | Create manager accounts |
| `edit-manager` | Edit manager accounts |
| `delete-manager` | Delete manager accounts |
| `list-view-manager` | View manager list |
| `change-manager-status` | Enable/disable manager accounts |

#### Event Coordinators
| Slug | Description |
|---|---|
| `create-event-coordinator` | Create coordinator accounts |
| `edit-event-coordinator` | Edit coordinator accounts |
| `delete-event-coordinator` | Delete coordinator accounts |
| `list-view-event-coordinator` | View coordinator list |
| `change-event-coordinator-status` | Enable/disable coordinator accounts |

#### Staff Members
| Slug | Description |
|---|---|
| `create-staff-member` | Create staff accounts |
| `edit-staff-member` | Edit staff accounts |
| `delete-staff-member` | Delete staff accounts |
| `view-staff-member` | View staff list |
| `staff-detail-view` | View staff detail page |
| `change-staff-member-status` | Enable/disable staff accounts |

#### Masters / Organizational Structure
| Slug | Description |
|---|---|
| `create-departments` / `edit-departments` / `delete-departments` / `view-departments` / `change-status-department` | Department management |
| `create-sections` / `edit-sections` / `delete-sections` / `view-sections` / `change-sections-status` | Section management |
| `create-sectors` / `edit-sectors` / `delete-sectors` / `view-sectors` / `change-sector-status` | Sector management |
| `create-branches` / `edit-branches` / `delete-branches` / `view-branches` / `change-status-branch` | Branch management |
| `create-ranks` / `edit-ranks` / `delete-ranks` / `view-ranks` / `change-rank-status` | Rank management |
| `create-job-titles` / `edit-job-titles` / `delete-job-titles` / `view-job-titles` / `change-job-title-status` | Job title management |

#### KPIs
| Slug | Description |
|---|---|
| `create-kpis` / `edit-kpis` / `delete-kpis` / `view-kpis` / `change-status-kpis` | KPI management |

#### Plans
| Slug | Description |
|---|---|
| `create-plan` / `edit-plan` / `delete-plan` / `view-plans` / `change-plan-status` | Plan management |

#### Teams
| Slug | Description |
|---|---|
| `create-team` / `edit-team` / `delete-team` / `view-team` | Team CRUD |
| `add-team-member` | Add members to teams |
| `change-team-status` | Enable/disable teams |

#### Evaluation
| Slug | Description |
|---|---|
| `add-evaluation` / `edit-evaluation` / `delete-evaluation` / `view-evaluation` / `view-evaluation-list` | Evaluation management |
| `add-evaluation-rule` / `edit-evaluation-rule` / `delete-evaluation-rule` / `view-evaluation-rule-list` / `change-evaluation-rule-status` | Evaluation rules |
| `add-fitness-category` / `edit-fitness-category` / `delete-fitness-category` / `view-fitness-category-list` / `change-fitness-category-status` | Fitness categories |

#### Activity Types & Sport Activities
| Slug | Description |
|---|---|
| `create-activity-type` / `edit-activity-type` / `delete-activity-type` / `view-activity-type` / `change-activity-type-status` | Activity type management |
| `create-sport-activity` / `edit-sport-activity` / `delete-sport-activity` / `view-sport-activity` / `change-sport-activity-status` / `detail-view` | Sport activity management |

#### Facilities
| Slug | Description |
|---|---|
| `create-facility` / `edit-facility` / `delete-facility` / `view-list-facilities` | Facility management |

#### CMS & Content
| Slug | Description |
|---|---|
| `create-blog` / `edit-blog` / `delete-blog` / `view-blog-list` / `change-status-blog` | Blog management |
| `view-audit-history` | View audit trail |

#### Roles & Permissions Management
| Slug | Description |
|---|---|
| `create-roles` / `edit-roles` / `delete-roles` / `view-roles` | Role management |
| `create-permissions` / `edit-permissions` / `delete-permissions` / `view-permissions` / `change-permission-status` | Permission management |

#### Profile & Settings
| Slug | Description |
|---|---|
| `view-profile` / `edit-profile` / `change-password` | Profile management |
| `edit-settings` / `view-settings` | System settings |

#### Database Management
| Slug | Description |
|---|---|
| `backup-database` / `delete-database-backup` / `restore-database` / `view-database-settings` | Database operations |

---

## 4. Role Capabilities Matrix

### 4.1 High-Level Capabilities by Role

| Capability | Super Admin | Admin | Event Coordinator | Manager | Staff | Employee |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Access Admin Panel** | Yes (auto) | Yes (needs `can-login`) | Yes (needs `can-login`) | Yes (needs `can-login`) | Yes (needs `can-login`) | No |
| **Access Employee Portal** | Yes | Yes | Yes | Yes | Yes | Yes |
| **View Dashboard** | All data | All data | Scoped events | Direct reports only | - | - |
| **Approve/Reject Events** | Yes | Yes | Yes | No | No | No |
| **Manage Admin Users** | Yes | Yes | No | No | No | No |
| **Manage Employees** | Yes | Yes | No | No | No | No |
| **Manage Managers** | Yes | Yes | No | No | No | No |
| **Manage Event Coordinators** | Yes | Yes | No | No | No | No |
| **Manage Staff** | Yes | Yes | No | No | No | No |
| **Create/Edit/Delete Events** | Yes (any) | Yes (owned/assigned) | Yes (assigned only) | No | No | No |
| **View All Events** | Yes | Yes | Only assigned | Only owned | No | No |
| **Manage Participants** | Yes (all) | Yes (all) | Pending approvals | Pending approvals | No | No |
| **View Audit History** | Yes | Yes (role-gated) | No | No | No | No |
| **Evaluation Config** | Yes | Yes (role-gated) | No | No | No | No |
| **Manage KPIs** | Yes | Per permission | Per permission | No | No | No |
| **Manage Plans** | Yes | Per permission | Per permission | No | No | No |
| **Manage Teams** | Yes | Per permission | Per permission | No | No | No |
| **Manage Facilities** | Yes | Per permission | Per permission | No | No | No |
| **Manage CMS/Blog** | Yes | Per permission | Per permission | No | No | No |
| **Manage Roles/Permissions** | Yes | Per permission | No | No | No | No |
| **Database Backup/Restore** | Yes | Per permission | No | No | No | No |
| **Self-Register for Events** | - | - | - | - | - | Yes |
| **View Own Profile** | Yes | Yes | Yes | Yes | Yes | Yes |
| **View Certificates** | - | - | - | - | - | Yes |
| **View Own Evaluations** | - | - | - | - | - | Yes |

### 4.2 Approval Authority by Role

| Approval Level | Who Can Approve |
|---|---|
| **Section Manager** | Manager (if assigned as section manager) |
| **Department Manager** | Manager (if assigned as department manager) |
| **Admin** | Any Admin or Super Admin (no specific approver required) |

---

## 5. Admin Panel — Route & Feature Access

### 5.1 Route-to-Permission Mapping

Defined in `Admin/src/utils/routePermissions.ts`:

| Route | Required Permission(s) |
|---|---|
| `/dashboard` | `view-dashboard` |
| `/masters` | `view-activity-type`, `view-kpis` |
| `/masters/manage-kpis` | `view-kpis` |
| `/masters/event-types` | `view-activity-type` |
| `/masters/event-activities` | `view-sport-activity` |
| `/plans` | `view-plans` |
| `/users` | `list-view-users`, `list-view-admin` |
| `/users/admin` | `list-view-admin` |
| `/users/employees` | `list-view-users` |
| `/teams` | `view-team` |
| `/events` | `view-event` |
| `/events/create` | `create-event` |
| `/events/edit` | `edit-event` |
| `/participant-requests` | `view-list-participants` |
| `/fitness-evaluation` | `view-evaluation-list` |
| `/facility` | `view-list-facilities` |
| `/facility/request` | `can-approve-or-reject-request` |
| `/cms/*` | `view-blog-list` |
| `/cms/blog/create` | `create-blog` |
| `/cms/blog/edit` | `edit-blog` |
| `/audit-history` | `view-audit-history` |
| `/eval` | `view-evaluation-list` |
| `/eval/fitness-categories` | `view-fitness-category-list` |
| `/profile` | `view-profile` |
| `/account-settings` | `view-settings` |

### 5.2 Sidebar Navigation Filtering

The sidebar (`Admin/src/component/Sidebar/sidebar.tsx`) filters menu items based on:

1. **Permission-based filtering**: Each nav item has required permissions; items are hidden if the user lacks them
2. **Role-based gating**: `Audit History` and `Evaluation Config` modules are restricted to **Admin and SuperAdmin roles only** (hardcoded role check, not just permission)

### 5.3 Route Protection Flow

```
User navigates to /admin/some-route
    │
    ├─ Is it an auth page (/login, /forgot-password, /)?
    │   └─ YES → Render without permission check
    │
    ├─ Is user logged in? (AuthContext populated)
    │   └─ NO → Redirect to /login
    │
    ├─ matchRoutePermission(path) → Get required permissions
    │   └─ No permissions defined → Allow access
    │
    ├─ hasAnyPermission(required, userPermissions)
    │   ├─ User has * (wildcard) → Allow
    │   ├─ User has at least one matching slug → Allow
    │   └─ User lacks all → Render AccessDenied page
    │
    └─ AccessDenied page offers:
        ├─ "Go to Dashboard" (if user has view-dashboard)
        └─ "Sign Out"
```

---

## 6. Employee Portal — Access

### 6.1 Route Overview

The Employee Portal has **no client-side route guards or role-based restrictions**. All authenticated users see the same interface.

| Route | Auth Required | Description |
|---|---|---|
| `/` | No | Homepage |
| `/login` | No | Login page |
| `/forgot-password` | No | Password reset |
| `/profile` | Yes (API) | User profile |
| `/certificates` | Yes (API) | View/download certificates |
| `/sport-activity-list` | No | Browse events |
| `/sport-activity-list/:eventId` | Yes (API for registration) | Event detail + register |
| `/achievement` | Yes (API) | My achievements + approval status |
| `/sponsors` | No | Sponsors list |
| `/facilities` | No | Facilities list |
| `/media-knowledge` | No | Media/knowledge articles |
| `/contact-us` | No | Contact form |
| `/faq` | No | FAQ page |
| `/system-user-guide` | No | CMS page |
| `/privacy-policy` | No | CMS page |
| `/terms-condition` | No | CMS page |

### 6.2 Employee Portal Key Behaviors

- **No permission-based UI filtering** — all authenticated employees see the same pages
- Auth store (Zustand) intentionally does **NOT** persist user data to localStorage (prevents privilege escalation)
- Only `currentLanguage` and `fcmToken` are persisted
- On page refresh, JWT is refreshed from httpOnly cookie, then profile is fetched from server
- Access control for employee-specific data is enforced **server-side only** via `verifyToken` middleware

---

## 7. Backend API — Route Protection

### 7.1 Protection Tiers

| Tier | Middleware | Used For |
|---|---|---|
| **Tier 1: Public** | None | Login, register, public content |
| **Tier 2: Authenticated** | `verifyToken` | Employee self-service, profile |
| **Tier 3: Admin-Only** | `verifyToken` + `verifyAdminOrSuperAdmin` | Dashboard, user mgmt, evaluation, fitness |
| **Tier 4: Granular RBAC** | `verifyToken` + `authorizeResource()` | CRUD for events, teams, plans, facilities, etc. |

### 7.2 Public Routes (No Auth)

```
POST   /api/register                    (rate-limited)
POST   /api/login                       (rate-limited)
POST   /api/admin/login                 (rate-limited)
POST   /api/forgot-password             (rate-limited)
POST   /api/reset-password              (rate-limited)
POST   /api/contact-us                  (rate-limited)
POST   /api/facility-request            (rate-limited)
GET    /api/sponsors
GET    /api/faq
GET    /api/home-slider
GET    /api/sport-events
GET    /api/facilities
GET    /api/blog-list, /api/blog/:id
GET    /api/cms/:slug
GET    /api/media-list, /api/media/:id
```

### 7.3 Admin-Only Routes (`verifyAdminOrSuperAdmin`)

These routes return **403** if `roleId` is not Admin or SuperAdmin:

```
GET    /api/admin/dashboard/stats
GET    /api/admin/dashboard/profile
GET    /api/admin/dashboard/latest-events
GET    /api/admin/dashboard/latest-participants
GET    /api/admin/manage-admins
GET    /api/admin/roles
GET    /api/admin/employees
GET    /api/admin/employees/with-filters
GET    /api/admin/change-status
GET    /api/admin/participants/approval-history
GET    /api/admin/evaluation/*
POST   /api/admin/evaluation/*
POST   /api/admin/evaluation/calculate-scores
GET    /api/admin/fitness-categories/*
POST   /api/admin/fitness-categories/*
PUT    /api/admin/fitness-categories/*
DELETE /api/admin/fitness-categories/*
GET    /api/admin/fitness-age-groups/*
POST   /api/admin/fitness-age-groups/*
GET    /api/admin/fitness-score-matrix
POST   /api/admin/fitness-score-matrix/*
POST   /api/admin/fitness-test
GET    /api/admin/fitness-evaluations/*
POST   /api/admin/fitness-evaluations/*
GET    /api/admin/facility-request/change-status
```

### 7.4 Granular RBAC Routes (`authorizeResource`)

| Resource | Read Permission | Create Permission | Write Permission | Ownership Check |
|---|---|---|---|---|
| `kpi` | `view-kpis` | `create-kpis` | `edit-kpis` | No |
| `event` | `view-event` | `create-event` | `edit-event` | **Yes** (creator/admin/coordinator) |
| `eventType` | `view-activity-type` | `create-activity-type` | `edit-activity-type` | No |
| `sportActivity` | `view-sport-activity` | `create-sport-activity` | `edit-sport-activity` | No |
| `faq` | `master` | `master` | `master` | No |
| `facility` | `view-list-facilities` | `create-facility` | `edit-facility` | No |
| `sponsor` | `master` | `master` | `master` | No |
| `blog` | `view-blog-list` | `create-blog` | `edit-blog` | No |
| `media` | `master` | `master` | `master` | No |
| `plan` | `view-plans` | `create-plan` | `edit-plan` | No |
| `cmsPage` | `master` | `master` | `master` | No |
| `team` | `view-team` | `create-team` | `edit-team` | No |
| `homeSlider` | `master` | `master` | `master` | No |
| `glimpseOfSports` | `master` | `master` | `master` | No |
| `participant` | `view-list-participants` | `master` | `master` | No |
| `contactUs` | `master` | `master` | `master` | No |

---

## 8. Approval Workflow

Multi-level approval chain for participant event registrations:

```
Employee registers for event
         │
         ▼
┌─────────────────────────┐
│  Level 1: Section Mgr   │  ← Manager approves (if assigned)
│  Status: "section"      │
└──────────┬──────────────┘
           │ Approved
           ▼
┌─────────────────────────┐
│  Level 2: Dept Mgr      │  ← Manager approves (if assigned)
│  Status: "department"   │
└──────────┬──────────────┘
           │ Approved
           ▼
┌─────────────────────────┐
│  Level 3: Admin         │  ← Any Admin or SuperAdmin
│  Status: "admin"        │     (no specific approver ID required)
└──────────┬──────────────┘
           │ Approved
           ▼
┌─────────────────────────┐
│  APPROVED               │  → Notifications sent to all Admins + SuperAdmins
└─────────────────────────┘
```

**Key behaviors:**
- Rejection at **any** level ends the workflow immediately
- Admin-level approval has `approver_id IS NULL` — any admin can approve
- Notifications are sent to all Admin and SuperAdmin users upon final approval
- Managers see pending approvals on their dashboard scoped to their direct reports

---

## 9. Authentication Flow by Role

### 9.1 Admin Login Flow

```
1. User submits email + password at /login (Admin React app)
2. Frontend calls POST /api/admin/login
3. Backend:
   a. Authenticates via CIAM (ciamService.auth())
   b. Decrypts encrypted roles → extracts roleId
   c. GATE #1: If no roleId → "Your role does not have access to admin panel"
   d. Fetches permissions for the role from CIAM
   e. GATE #2: If roleId ≠ SuperAdmin AND no "can-login" permission → rejected
   f. Sets accessToken + refreshToken as httpOnly cookies
   g. Returns { accessToken, admin: { id, name, email, roleId, image, permissions } }
4. Frontend:
   a. Stores accessToken in memory (not localStorage)
   b. Stores display fields in localStorage for UI rendering
   c. Stores permissions + roleId in sessionStorage (tab-scoped)
   d. Populates AuthContext (single source of truth)
   e. Navigates to /dashboard
```

### 9.2 Employee Login Flow

```
1. User submits username + password at /login (Employee React app)
2. Frontend calls POST /api/login
3. Backend:
   a. Authenticates via CIAM
   b. Fetches user details from CIAM
   c. Sets accessToken + refreshToken as httpOnly cookies
   d. Returns { accessToken, user: { id, name, email, image } }
4. Frontend:
   a. Stores accessToken in memory
   b. Populates Zustand store (NOT persisted to localStorage)
   c. Navigates to / (homepage)
```

### 9.3 Session Refresh (Page Reload)

```
On page load:
1. attemptTokenRefreshOnLoad() → refresh JWT from httpOnly cookie
2. restoreSession() → GET /api/admin/me (or /api/profile for Employee)
3. Server returns fresh user data + permissions
4. AuthContext / Zustand store repopulated
5. If refresh fails → user stays on current page (Employee) or redirected to /login (Admin)
```

---

## 10. Middleware & Guards

### 10.1 Backend Middleware Stack

| Middleware | File | Purpose |
|---|---|---|
| `verifyToken` | `middlewares/authMiddleware.js` | JWT verification, CIAM role decryption, permission fetching |
| `verifyAdminOrSuperAdmin` | `middlewares/verifyAdminOrSuperAdmin.js` | Hard role check: Admin OR SuperAdmin UUID |
| `authorizeResource()` | `middlewares/resourceAuthorization.js` | Granular: SuperAdmin bypass → permission check → ownership check |
| `ensureAdminApiPermission(slug)` | `middlewares/authMiddleware.js` | Factory: SuperAdmin bypass → wildcard → specific slug |
| `ensureAdminApiAuthenticated` | `middlewares/authMiddleware.js` | Session-based check for legacy EJS routes |
| `permissionMiddleware` | `middlewares/permissionMiddleware.js` | Session-based permission check (legacy EJS) |

### 10.2 Frontend Guards

| Guard | File | App | Purpose |
|---|---|---|---|
| `ProtectedRoute` | `component/ProtectedRoute/ProtectedRoute.tsx` | Admin | Route-level permission check, renders AccessDenied on failure |
| `AuthContext` | `context/AuthContext.tsx` | Admin | Provides `hasPermission()`, `hasAnyPermission()`, `isAdminOrSuperAdmin()` |
| `useAuthStore` | `store/store.ts` | Employee | Zustand store — no permission checks, server-side only |
| `HeaderFooterWrapper` | `utils/HeaderFooterWrapper.tsx` | Employee | Hides header/footer on auth pages |

### 10.3 Permission Check Functions

```typescript
// Admin frontend (Admin/src/utils/permissions.ts)
hasPermission(slug, permissions[])     // * wildcard or exact match
hasAnyPermission(slugs[], permissions[]) // any match
hasAllPermissions(slugs[], permissions[]) // all must match

// Backend (Node/utils/permissionChecker.js)
hasPermission(req, slug)              // SuperAdmin bypass + slug check
hasAnyPermission(req, slugs[])       // SuperAdmin bypass + any-of
hasAllPermissions(req, slugs[])      // SuperAdmin bypass + all-of
getUserRoleId(req)                    // Returns req.user.roleId
```

---

## 11. Data Scoping by Role

### 11.1 Event Visibility

| Role | Events Visible |
|---|---|
| **SuperAdmin** | ALL events in the system |
| **Admin** | Events where user is creator, assigned admin, or coordinator |
| **Event Coordinator** | Only events where user is in `eventCoordinators` field |
| **Manager** | Only events where user is creator or in `eventAdmins` field |
| **Staff / Employee** | N/A (Employee portal, not admin panel) |

**Implementation:** `Node/controllers/adminApi/eventAdminController.js` lines 20-39

### 11.2 Dashboard Stats

| Role | Dashboard Data |
|---|---|
| **SuperAdmin** | All events, all participants, all employees, all managers |
| **Admin** | All events (ownership-filtered), all counts |
| **Manager** | Only direct reports (`currentManagerUserDomain === currentUserId`) |
| **Event Coordinator** | Ownership-filtered events only |

### 11.3 Participant Visibility

| Role | Participants Visible |
|---|---|
| **SuperAdmin / Admin** | ALL participants |
| **Manager / Coordinator / Other** | Only participants where they are the pending approver in approval history |

---

## 12. Resource Authorization

The `authorizeResource()` middleware in `Node/middlewares/resourceAuthorization.js` implements a 3-layer check:

```
Request arrives at /api/admin/events/:id (PUT)
         │
         ▼
┌─────────────────────────────────┐
│  Layer 1: SuperAdmin Bypass     │
│  If user is SuperAdmin → PASS   │
│  (config.superAdminBypass=true) │
└──────────┬──────────────────────┘
           │ Not SuperAdmin
           ▼
┌─────────────────────────────────┐
│  Layer 2: Permission Check      │
│  Does user have "edit-event"?   │
│  → If NO → 403 Forbidden        │
└──────────┬──────────────────────┘
           │ Has permission
           ▼
┌─────────────────────────────────┐
│  Layer 3: Ownership Check       │
│  (Only for "event" resource)    │
│  Is user creator, admin, or     │
│  coordinator of this event?     │
│  → If NO → 403 Forbidden        │
│  → If YES → PASS                │
└──────────┬──────────────────────┘
           │
           ▼
    Controller executes
```

**Only the `event` resource has an ownership/scope check.** All other resources rely on permission slugs only.

---

## 13. File Reference Index

### Backend (Node/)

| Purpose | File |
|---|---|
| Role ID configuration | `Node/.env` |
| Role decryption (RSA + AES) | `Node/config/role-decryption.js` |
| Permission checker utility | `Node/utils/permissionChecker.js` |
| Auth middleware (JWT) | `Node/middlewares/authMiddleware.js` |
| Admin/SuperAdmin role guard | `Node/middlewares/verifyAdminOrSuperAdmin.js` |
| Resource authorization | `Node/middlewares/resourceAuthorization.js` |
| Session permission middleware | `Node/middlewares/permissionMiddleware.js` |
| Admin auth controller (login) | `Node/controllers/adminApi/adminAuthController.js` |
| Admin user controller | `Node/controllers/adminApi/adminUserController.js` |
| Employee controller | `Node/controllers/adminApi/employeeController.js` |
| Dashboard controller | `Node/controllers/adminApi/dashboardAdminController.js` |
| Event admin controller | `Node/controllers/adminApi/eventAdminController.js` |
| Participant controller | `Node/controllers/adminApi/participantController.js` |
| Approval workflow service | `Node/services/approvalWorkflowService.js` |
| Common controller (notifications) | `Node/controllers/commonController.js` |
| API routes | `Node/routes/apiRoutes.js` |
| Sequelize models + associations | `Node/models/index.js` |
| Sequelize adapter (table mappings) | `Node/config/sequelizeAdapter.js` |
| CIAM service | `Node/ciam/ciam.service.js` |
| Push notification utility | `Node/utils/PushNotificationUtil.js` |

### Admin Panel (Admin/)

| Purpose | File |
|---|---|
| Auth context (permissions store) | `Admin/src/context/AuthContext.tsx` |
| Permission utility functions | `Admin/src/utils/permissions.ts` |
| Route-to-permission mapping | `Admin/src/utils/routePermissions.ts` |
| Protected route component | `Admin/src/component/ProtectedRoute/ProtectedRoute.tsx` |
| Sidebar (nav filtering) | `Admin/src/component/Sidebar/sidebar.tsx` |
| Login page | `Admin/src/auth/Login.tsx` |
| Events table (approval button) | `Admin/src/pages/Events/EventsTable.tsx` |
| App (session restore) | `Admin/src/App.tsx` |

### Employee Portal (Employee/)

| Purpose | File |
|---|---|
| Auth store (Zustand) | `Employee/src/store/store.ts` |
| Login page | `Employee/src/pages/Auth/Login.tsx` |
| Router (no role guards) | `Employee/src/router/router.tsx` |
| App (token refresh) | `Employee/src/App.tsx` |

---

*Document generated from codebase analysis — `ROLES_AND_CAPABILITIES.md`*
