# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Angular 21** — standalone components, signals (`signal()` / `computed()`), no NgModules outside the root.
- **TypeScript 5.9** strict.
- **Vitest 4** (not Karma/Jasmine) with `jsdom` and Angular TestBed.
- **Tailwind CSS 3** + SCSS for styling, Lucide Angular for icons.
- **Playwright** for E2E in `tests/` (`playwright.config.ts`).
- **pnpm 11** is the package manager (`pnpm-lock.yaml`). The `cli.packageManager: "npm"` line in `angular.json` is stale — use pnpm.

## Commands

```bash
pnpm install               # install deps
pnpm start                 # dev server → http://localhost:4200 (uses environment.development.ts)
pnpm test                  # full Vitest run via @angular/build:unit-test
ng test -- --run           # single one-shot run (Vitest `--run` flag — exits after one pass)
ng build                   # production build → dist/ (budgets: 500kB warn, 1MB error)
ng build --configuration development   # dev build with sourcemaps
npx playwright test        # run E2E (tests/, see playwright.config.ts)
npx eslint .               # lint (no npm script; ESLint flat config in eslint.config.js)
```

There is no `lint` script in `package.json` — invoke ESLint directly.

## Architecture

### Entry / bootstrapping
`src/main.ts` → `src/app/app.ts` → `src/app/app.config.ts`. `appConfig` provides the router, HTTP client with `authInterceptor`, and the global `LUCIDE_ICONS` provider (icons listed in `src/app/shared/icons/lucide-icons.ts`).

### Routing (role-based, lazy)
`src/app/app.routes.ts` lazy-loads three feature areas:
- `auth/**` → `features/auth/auth.routes.ts` (login).
- `admin/**` → `features/admin/admin.routes.ts`, protected by `authGuard`. Children include `clients`, `elevators`, `technicians`, `documents`, `programming` (dashboard), `maintenance-scheduling`, `reports`, `ai-assistant`, `settings`.
- `worker/**` → `features/worker/worker.routes.ts`, protected by `authGuard`. Children: `profile`, `routes`, `reports`, `equipment`.

`authGuard` (`core/guards/auth.guard.ts`) is a functional `CanActivateFn` that reads `AuthService.isAuthenticated()` (a `computed` signal) and redirects to `/auth/login` via `Router.createUrlTree`. The guard does NOT inspect role — role-based gating happens inside feature layouts/components.

### Auth flow (gotchas live here)
1. `AuthService.login()` → backend returns `{ accessToken, refreshToken, user }`, persisted in `StorageService` (localStorage wrapper) and mirrored to the `currentUserSig` signal.
2. `authInterceptor` (`core/interceptors/auth.interceptor.ts`) attaches `Authorization: Bearer <token>` to every outbound request, skipping when the stored token is missing / the string `"undefined"` / `"null"` (defensive against past serialization bugs — keep these checks).
3. On a 401 that is NOT `/auth/login` or `/auth/refresh`, the interceptor runs a **single-flight refresh**: module-level `isRefreshing` flag + shared `BehaviorSubject<string | null>` so concurrent 401s wait on one refresh call rather than spawning a stampede. If refresh fails, `authService.forceLogout()` clears storage and redirects to login.
4. Both `isRefreshing` and `refreshTokenSubject` live at module scope on purpose — interceptors are re-instantiated per request, so state must persist outside the function.

### Environments
Configured via Angular's `fileReplacements` (see `angular.json` build configurations):
- Production (default): `src/environments/environment.ts` → `https://backend-jmgascensores.onrender.com/api`.
- Development: replaced with `environment.development.ts` → `http://localhost:3000/api`.

`pnpm start` uses the `development` serve configuration, so the dev API URL is what runs locally.

### State & services
Services use Angular's `inject()` (no constructor DI) and expose state via **signals** (`signal()`, `computed()`). Avoid `BehaviorSubject` for component-facing state. RxJS is still used at HTTP/interceptor boundaries.

`IaSchedulerService` (`core/services/ia-scheduler.service.ts`) is the integration point for the AI-driven scheduling endpoints (`/ia-scheduler/demand`, `/tecnicos`, `/generar`, `/ajustar`, `/confirmar`, `/config`); response/request shapes live in `features/admin/models/ia-scheduler.interface.ts`.

### Folder layout (Screaming Architecture)
- `src/app/core/` — `services/`, `guards/`, `interceptors/`, `models/` (cross-cutting auth + scheduler).
- `src/app/features/{admin|auth|worker}/{feature}/{name}.component.ts` — feature-scoped components, each colocated with `.html`, `.scss`, and `.spec.ts`.
- `src/app/shared/` — `components/` (reusable: `confirm-modal`, `entity-card`, `filters`, `loading-spinner`, `maintenance-checklist`, `modal-wrapper`, `placeholder-page`, `searchable-select`, `sidebar`, `skeleton-loader`), `icons/`, `utils/`.

## Testing

- Setup file: `src/test-setup.ts` (registered via `angular.json` test target's `setupFiles`, AND via `vitest.config.ts` — both paths exist; the Angular CLI test builder is the primary one).
- `src/test-setup.ts` does two non-obvious things:
  1. Installs a `localStorage` mock on `globalThis` — Vitest's jsdom env doesn't ship one that survives all paths.
  2. **Monkey-patches `TestBed.configureTestingModule`** to auto-inject the `LUCIDE_ICONS` provider. Specs do not need to add Lucide manually; any component using `<lucide-icon>` will just work in tests.
- `vitest.config.ts` also defines a path alias `@` → `src/`.
- Spec files live next to the source: `*.component.ts` ↔ `*.component.spec.ts`. See `TESTING.md` for the project's service- and component-test patterns (HTTP mocking via `HttpClientTestingModule`, spies via `vi.fn()`).

## Conventions

- **Component selector prefix**: `app-` (kebab-case) — enforced by ESLint (`@angular-eslint/component-selector`).
- **Directive selector prefix**: `app` (camelCase, attribute).
- **Styling**: SCSS for component styles, Tailwind utility classes in templates. Component style budget per file = 500kB warn / 1MB error in prod build.
- **Tailwind palette has two distinct namespaces** (`tailwind.config.js`):
  - `jmg-*` (`#003B73` brand) for all standard UI.
  - `ai-*` (`#06b6d4` cyan accent) is reserved for AI-generated content and the AI module's branding only — do not use it for general UI.
  - AI-only animations: `shimmer`, `glow-pulse`, `ai-enter` are intended for AI surfaces.
- **Formatting (Prettier, configured in `package.json`)**: `printWidth: 100`, `singleQuote: true`, HTML parsed with the Angular parser.
- **Editor**: 2-space indent, single quotes in TS, trailing newline (`.editorconfig`).

## Notes for future Claude sessions

- If you change auth behavior, also update the `'undefined'`/`'null'` token-string guards in `authInterceptor` — they are deliberate, not paranoia.
- When adding a route under `admin` or `worker`, prefer `loadComponent` lazy imports (consistent with existing routes) and rely on the parent's `authGuard` rather than re-applying it.
- When adding a component that uses Lucide icons in tests, you don't need to wire up `LUCIDE_ICONS` — `src/test-setup.ts` already does it globally via the TestBed patch.
- The `dist/`, `playwright-report/`, and `test-results/` directories are build/test artifacts — don't commit changes there.
