# Finly — Style Guide

Design tokens live in `src/index.css` (Tailwind v4 `@theme` block) and are consumed as ordinary utility classes (`bg-primary-600`, `text-danger-500`, etc.) — there is no separate JS theme object to keep in sync.

## Palette

**Primary — blue.** `primary-600` (`#2563eb`) matches the `blue-600` already used throughout the original UI, so adopting the token reads as a refinement, not a rebrand. Full 50–950 scale defined for hover/active/dark-mode variants.

**Accent — amber**, complementary to the primary blue. Reserved for secondary emphasis and *attention* states — not for income/expense, which have their own tokens. Current use: the balance card on the Dashboard switches from `primary` to `accent` when the balance goes negative.

**Semantic — success / danger.** Formalizes the green/red used ad-hoc in the original UI: `success-*` for income and positive states, `danger-*` for expenses and destructive actions (delete buttons, error text). Prefer these tokens over reaching for Tailwind's raw `green-*`/`red-*` in new code.

| Token | Light value | Used for |
|---|---|---|
| `primary-600` | `#2563eb` | Primary buttons, active nav, links, focus rings |
| `accent-500` | `#f59e0b` | Negative-balance warning, future: goal-deadline warnings |
| `success-600` | `#059669` | Income amounts, positive states |
| `danger-600` | `#e11d48` | Expense amounts, delete actions, form errors |

## Dark mode

Class-based (`@custom-variant dark (&:where(.dark, .dark *))` in `index.css`), toggled by `store/themeStore.ts` setting/removing a `dark` class on `<html>`. Preference persists to `localStorage` (key `finly-theme`) and falls back to `prefers-color-scheme` on first visit. Every surface (`bg-white` → `dark:bg-gray-800`, page background `bg-gray-100` → `dark:bg-gray-900`) has a dark variant — when adding a new component, add the `dark:` pair at the same time, don't leave it for later.

## Typography & spacing

No new scale was introduced — the original Tailwind defaults already in use (`text-sm`/`text-lg`/`text-2xl`/`text-3xl` for hierarchy, the default 4px spacing scale via `p-4`/`p-6`/`gap-6`/`gap-8`) are formalized as the convention rather than replaced:

- Page/card title: `text-2xl font-semibold`
- Section heading (inside a card, e.g. "Recent Transactions"): `text-xl font-semibold`
- Stat/metric value: `text-3xl font-bold`
- Body/label text: `text-sm`, muted via `text-gray-500 dark:text-gray-400`
- Card padding: `p-6`; gap between stacked cards: `space-y-8` (page level) / `space-y-4` (within a card)

## Components

- **Card**: `bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6`
- **Primary button**: see `src/styles/formStyles.ts`'s `primaryButtonClass` — `bg-primary-600 hover:bg-primary-700`, white text, used for the main CTA on a page (submit forms, "Nova Transação")
- **Text input**: `src/styles/formStyles.ts`'s `textInputClass` — bordered, `focus:ring-primary-500`, dark-mode-aware background/text. Reused across Login, Register, and the transaction modal; add new form fields with this constant rather than re-typing the class string
- **Status badge** (transaction category pill): `bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full px-2 text-xs font-semibold`

## Responsive layout

- Breakpoint used for the nav shell: `md` (768px). Below it, the sidebar becomes an off-canvas drawer (`fixed` + `-translate-x-full`/`translate-x-0`, backdrop, opened via a hamburger button in a mobile-only topbar); at `md` and above it's static in normal flow.
- Drawer state lives in `store/uiStore.ts` (`isMobileMenuOpen`) and closes automatically on navigation (see `Sidebar.tsx`'s `SidebarNavItem`).
- Dashboard's stat cards: `grid-cols-1 sm:grid-cols-3` (was `md:grid-cols-3` — tightened so the 3-card row isn't stuck single-column on small tablets/large phones in landscape).
- Transactions list: a real breakpoint swap, not just `overflow-x-auto` — a stacked-card layout below `sm`, the full table at `sm` and above (see `TransactionsPage.tsx`).
- Ultra-wide monitors: `AppLayout`'s content area is wrapped in `max-w-[1600px] mx-auto` so cards don't stretch edge-to-edge on very wide screens; add new top-level pages inside that same wrapper (it's already applied once in `AppLayout`, so page components themselves don't need to repeat it).

## i18n note

All copy goes through `react-i18next`'s `t()` — see `CLAUDE.md` for the locale file structure. Don't hardcode strings in new components.
