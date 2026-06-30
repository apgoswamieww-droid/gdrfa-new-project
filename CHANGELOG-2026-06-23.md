# Changelog — June 23, 2026

## UI / Layout
- Cards redesigned: one card = one evaluation session (not per-category), 3 cards per row (grid-cols-3)
- Evaluation History card moved to full page width (outside the 3-column form grid)
- Form always starts empty (no pre-fill from existing results)
- Gender/DOB inputs replaced with read-only display (auto-filled from CIAM)

## Icons & Buttons
- Edit/Delete/Save/Recalc/Cancel: SVG icons instead of text
- Per-row Delete removed → single Delete per session card (header trash icon)
- confirm() replaced with themed ConfirmModal (red trash + backdrop)

## CIAM / Backend
- User lookup now constructs userDomain = "ml" + grp (e.g. "ml4057") before calling CIAM
- Added ml647 to fallbackUsers in CIAM mock data
- Gender/DOB auto-filled on page load from CIAM

## Score Calculation
- displayValue() helper: handles both MM:SS and raw seconds → no more NaN
- Edit mode shows value in user-friendly format (MM:SS for running)
- Recalc button: calls calculateScoresApi for the edited value; if matrix returns 0, falls back to Math.round(raw) for count-based categories

## Session Management
- POST /admin/fitness-evaluations/:id/delete-session — deletes all results by resultIds[]
- deleteEvaluationSessionApi in frontend
- Progress bar on Excel file upload in modal (animated 0→100%)
