# Fitness Evaluation Module - Changes Summary

## Overview
Added a new **Fitness Evaluation** module that allows uploading Excel files to the `evaluations` table and managing those records with full CRUD functionality. Accessible only to SuperAdmin and Examiner roles.

## Files Created

### Database
- **`Node/misc/sql/add_evaluation_columns.sql`** - MSSQL migration script that adds 6 nullable columns to the `evaluations` table:
  - `rank` (NVARCHAR(255))
  - `grp` (NVARCHAR(255))
  - `employee_name` (NVARCHAR(500))
  - `sector` (NVARCHAR(255))
  - `fitness_status` (NVARCHAR(255))
  - `year` (INT)

### Backend (Node)

- **`Node/controllers/adminApi/fitnessEvaluationController.js`** - New controller with:
  - `list` - Paginated listing with search & year filter
  - `show` - Single record view
  - `store` - Bulk insert from Excel records
  - `update` - Edit single record
  - `delete` - Soft delete
  - `getYears` - Get distinct years for filter dropdown

### Frontend (Admin)

- **`Admin/src/api/fitnessEvaluation.api.ts`** - API client with all CRUD endpoints
- **`Admin/src/pages/FitnessEvaluation/ManageFitnessEvaluation.tsx`** - Main page with search, year filter, Upload button, handles CRUD operations
- **`Admin/src/pages/FitnessEvaluation/FitnessEvaluationTable.tsx`** - DataTable showing columns: ID, GRP, Name, Evaluation Result (Pending badge or points), Year, Actions (View/Edit/Delete)
- **`Admin/src/pages/FitnessEvaluation/FitnessEvaluationModal.tsx`** - Reusable modal with 3 modes:
  - `upload` - Excel file upload with preview (parses .xlsx/.xls/.csv files)
  - `view` - Read-only details view
  - `edit` - Edit form for individual record fields

### New Package
- **`xlsx`** (SheetJS) installed in Admin for Excel file parsing on the frontend

## Files Modified

### Backend
- **`Node/routes/apiRoutes.js`** - Added 6 new routes for fitness evaluation CRUD + years endpoint. All routes use `verifyAdminOrSuperAdmin` middleware.

### Frontend
- **`Admin/src/component/Sidebar/sidebar.tsx`** - Added "Fitness Evaluation" menu item below "Participants Request" with `evaluation_config` icon and `view-evaluation-list` permission
- **`Admin/src/routes/AppRoutes.tsx`** - Added route `/fitness-evaluation` pointing to `ManageFitnessEvaluation`
- **`Admin/src/utils/routePermissions.ts`** - Added permission mapping for `/fitness-evaluation` route
- **`Admin/src/locales/translations.ts`** - Added `fitnessEvaluation` sidebar labels in English and Arabic

## Permissions
- Sidebar visibility: Requires `view-evaluation-list` permission
- API access: Requires `verifyAdminOrSuperAdmin` middleware (SuperAdmin/Admin roles)
- Route protection: Standard `ProtectedRoute` wrapper

## DataTable Columns Displayed
| Column | Description |
|--------|-------------|
| ID | Record ID |
| GRP | Group from Excel |
| Name | Employee name |
| Evaluation Result | Shows "Pending" badge (yellow) if no total_points; shows point value (green) if evaluated |
| Year | Year from Excel |
| Actions | View (green), Edit (blue), Delete (red) buttons |

## Excel Upload Format
Expected Excel columns: `id, rank, grp, employee_name, sector, fitness_status, year`
Case-insensitive header matching with common alternatives supported (e.g., `Employee Name`, `Group`, `RANK`).
