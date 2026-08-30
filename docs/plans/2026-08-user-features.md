# User Settings, Managed Categories, Dashboard Chart (2026-08-30)

Second planning round, after the NestJS/frontend refactor
(`2025-refactor-nestjs-frontend.md`) shipped. Adds a per-user Settings page,
turns the freeform transaction/goal `category` string into a managed per-user entity, and
implements the dashboard "expenses by category" widget that was left as a placeholder.

## Locked decisions (from user, do not re-litigate)

| # | Decision |
|---|---|
| 1 | Managed **Categories** replace the freeform `category` string. One category per transaction/goal, **nullable** FK (`tag_id`, `ON DELETE SET NULL`). |
| 2 | UI keeps the word "category" everywhere (no conceptual rename to "tags"). |
| 3 | Category = `name` + `emoji` (full **emoji-mart** picker) + `color` (**freeform hex**, `<input type=color>`) + `type` (`income`/`expense`/`both`). Per-user, name unique case-insensitive. |
| 4 | Transaction modal: category dropdown **filtered by the income/expense toggle**, selection **optional** ("— none —" → Uncategorized). |
| 5 | Reports by-category chart **and** the new dashboard chart use each category's hex color; `null` → an "Uncategorized" bucket. |
| 6 | Registration **seeds ~10 localized starter categories** (pt-BR / en-US map, fallback pt-BR). |
| 7 | Dashboard placeholder → **horizontal bar chart**, current calendar month, expenses only, computed client-side from the loaded transactions, reusing the Reports chart look. |
| 8 | **Settings page** at `/app/settings` — sidebar nav item **and** the sidebar profile block both link to it. Tabs: **Profile / Work & Income / Preferences / Security**. |
| 9 | Profile tab: avatar upload (`sharp` → 512×512 webp q82 stored as `bytea`, 5 MB cap, png/jpeg/webp), display name (non-unique, nullable, shown in sidebar + a dashboard greeting), email (requires current password, returns a fresh JWT the frontend swaps in; uniqueness enforced; no verification email), phone (optional freeform, light format validation). |
| 10 | Work & Income tab: employment status (enum), income amount + pay frequency (monthly/biweekly/weekly/annual + computed monthly-equivalent), pay day of month (1–31). **Stored only — no auto-transactions, no scheduler.** |
| 11 | Preferences tab: theme + language **move here from the sidebar**; sidebar footer keeps only the profile block + logout. |
| 12 | Security tab: change password (current + new). |
| 13 | Migration: **one final `InitSchema` re-squash**, `docker compose down -v`, fresh DB. Additive migrations from here on. |
| 14 | **Thorough** tests — full backend unit + e2e, a component test per new UI piece, incl. the category-delete→uncategorized path and the email-change token swap. |
| 15 | One commit per logical unit. |

### Minor assumptions (user may still veto)

- `employment_status`: `employed` / `self_employed` / `student` / `unemployed` / `retired` / `other`.
- Phone: allow `+`, digits, spaces, `-`, `()`, length 7–20; no verification.
- The old JWT stays valid until expiry after an email change (only `id` is used for authz).
- Category color is not contrast-validated (freeform hex, user's call).

## Schema changes

- **`user_profiles`** (1:1 with `users`, row created at registration): `user_id` PK/FK cascade, `display_name`, `phone`, `avatar` bytea null, `avatar_mime`, `avatar_updated_at`, `employment_status` enum null, `income_amount` numeric null, `income_frequency` enum null, `pay_day` smallint null.
- **`categories`**: `id`, `user_id` FK cascade, `name`, `emoji`, `color`, `type` enum, `created_at`; unique `(user_id, lower(name))`.
- **`transactions`**: drop `category`; add `tag_id` int null FK → `categories` `ON DELETE SET NULL` + index `(user_id, tag_id)`.
- **`goals`**: `category` varchar → `tag_id` int null FK `ON DELETE SET NULL`.

## Backend task order

| # | Status | Task |
|---|---|---|
| U1 | ✅ | `CategoriesModule` — entity, DTOs, `/api/categories` CRUD (guarded, user-scoped), service (ownership, case-insensitive uniqueness). Imports `AuthModule`. |
| U2 | ✅ | `SEED_CATEGORIES` per-locale map; `AuthService.register` takes optional `locale`, creates the `user_profiles` row + seed categories in one transaction after the user insert. |
| U3 | ✅ | `TransactionsService` — take `categoryId` (nullable, ownership-checked) on create/update; embed `category: {id,name,emoji,color,type}|null` in every response; update DTOs. |
| U4 | ✅ | `GoalsService.computeProgress` matches linked income by `tag_id`; goal responses embed the category object; DTOs take `categoryId`. |
| U5 | ✅ | `ReportsService.getCategoryBreakdown` — `GROUP BY tag_id` + join, return `{categoryId,name,color,emoji,total}` with a null→"Uncategorized" bucket; CSV/PDF emit the category name. |
| U6 | ✅ | Profile in `users/` — `UserProfile` entity, `ProfileService`, `ProfileController`: `GET`/`PATCH /users/me/profile`, `PATCH /users/me/email` (→ `{token}`), `PATCH /users/me/password`, `PATCH /users/me/work`. |
| U7 | ✅ | Avatar — `sharp` dep, `FileInterceptor` (5 MB, mime allowlist), `POST/GET/DELETE /users/me/avatar`; `GET` sends `Cache-Control` + `ETag` from `avatar_updated_at`. |
| U8 | ✅ | `AuthService` `register`/`login`/`me` responses add `displayName` + `avatarUpdatedAt`; update `AuthUser`. |
| U9 | ✅ | Re-squash `InitSchema` (regenerate vs a live DB, eyeball diff); sync `entities` arrays in `database.module.ts` + `data-source.ts`. |
| U10 | ✅ | Unit tests — CategoriesService, ProfileService (email/password/work/avatar w/ mocked sharp), updated Goals + Reports services. |
| U11 | ✅ | e2e — `categories.e2e-spec` (CRUD, 401, cross-user isolation, delete→tx.tag_id null), `profile.e2e-spec` (profile, email-change token + old/new login, password, avatar cycle, work); update transactions/goals/reports e2e for the FK. |

## Frontend task order

| # | Status | Task |
|---|---|---|
| F1 | ✅ | `types.ts` — `Category`; `Transaction.category`/`Goal.category` → object\|null (+ `categoryId` on write types); `CategoryTotal` reshape; `User.displayName?`; new `UserProfile`, `WorkIncome`. |
| F2 | ✅ | `apiService` — category CRUD; profile/email/password/work; avatar upload (teach `apiFetch` to skip the JSON `Content-Type` for `FormData`) / delete. |
| F3 | ✅ | `hooks/useCategories.ts` (mutations invalidate `['categories','transactions','goals','reports']`); `hooks/useProfile.ts` (email mutation swaps the `localStorage` token + `authStore`). |
| F4 | ✅ | `CategoriesPage` (`/app/categories`) + sidebar item — list (emoji/swatch/name/type), `CategoryFormModal` (lazy-loaded emoji-mart, color input, type radio), delete confirm showing the affected-transaction count. |
| F5 | ✅ | `NewTransactionModal` + `GoalFormModal` — `<select>` from `useCategories()` filtered by type + "— none —"; prefill by `categoryId`. |
| F6 | ✅ | `TransactionsPage` + dashboard recent list — render `emoji + name` w/ a colored dot; "Uncategorized" fallback. |
| F7 | ✅ | `DashboardCategoryChart` replaces the placeholder (current-month expenses grouped by category, colored bars + under-chart table); add a "Welcome back, {name}" greeting. |
| F8 | ✅ | `SettingsPage` (`/app/settings`) — tabbed: Profile / Work & Income / Preferences (move `LanguageSwitcher` + `ThemeToggle` here) / Security. |
| F9 | ✅ | `Sidebar` — drop the lang/theme controls from the footer; profile block becomes a `NavLink` to `/app/settings` with avatar + display name (email subtitle); add "Categories" + "Settings" nav items. |
| F10 | ✅ | `App.tsx` — routes for `/app/categories` + `/app/settings`. |
| F11 | ✅ | i18n — new `settings.*` + `categories.*` groups, `sidebar.categories/settings`, `dashboard.greeting`, drop `dashboard.categoryChartPlaceholder`; both `pt-BR` and `en-US`. |
| F12 | ✅ | Tests — `useCategories.spec`, `useProfile.spec` (token swap), `CategoryFormModal.spec`, `SettingsPage.spec`, `DashboardCategoryChart.spec`, updated `NewTransactionModal.spec`. |

## Infra / docs

- `docker-compose.yml` unchanged (photo lives in Postgres); verify `sharp` builds on `node:22-alpine` (musl prebuilt binaries) during `docker compose build`.
- Update `CLAUDE.md` (Categories module + FK model, `user_profiles`/avatar approach, Settings page, final-squash note) and `README.md` feature list.
- Done as a follow-up: the plans moved into `docs/plans/` and `STYLEGUIDE.md` into `docs/` (READMEs stayed put).

## Rollout order

U1–U2 → U3–U5 → U6–U8 → U9 → F1–F3 → F4–F7 → F8–F10 → F11 → U10–U11 + F12. Commit per row / small group.