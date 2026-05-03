# AGENTS.md — JMG Ascensores Frontend

## Stack
- **Angular 21** with standalone components and signals
- **Vitest** for unit testing (not Karma/Jasmine)
- **Tailwind CSS** + SCSS for styling
- **Lucide Angular** for icons

## Key Commands

```bash
npm start          # Dev server → http://localhost:4200
npm test           # Run all Vitest tests
ng build           # Production build (output: dist/)
```

## Architecture

- **Entry point**: `src/main.ts` → `src/app/app.ts` → `src/app/app.config.ts`
- **Routing**: Lazy-loaded feature routes (`auth`, `admin`, `worker`) in `src/app/app.routes.ts`
- **Guards**: `authGuard` (functional `CanActivateFn`) protects admin and worker routes
- **Interceptor**: `authInterceptor` handles JWT + refresh token rotation on 401

## API Configuration

| Environment | File | URL |
|-------------|------|-----|
| Production | `src/environments/environment.ts` | `https://backend-jmgascensores.onrender.com/api` |
| Development | `src/environments/environment.development.ts` | `http://localhost:3000/api` |

Angular uses file replacement for build configuration — `environment.development.ts` replaces `environment.ts` when building with `--configuration development`.

## Auth Flow

1. `AuthService.login()` stores `accessToken` + `refreshToken` in localStorage via `StorageService`
2. Every HTTP request gets `Authorization: Bearer <token>` header via interceptor
3. On 401 (except login/refresh endpoints), interceptor triggers `refreshToken()` flow
4. If refresh fails → `forceLogout()` clears storage and redirects to `/auth/login`

## Testing

- Test setup: `src/test-setup.ts` (setupFiles in tsconfig.spec.json)
- Test entry: `src/test.ts` (manual setup, not Angular CLI default)
- Both files mock `localStorage` — Vitest has no native localStorage
- Lucide icons are globally provided via `app.config.ts`; `src/test-setup.ts` patches TestBed to inject them automatically in every `configureTestingModule` call
- Run single test: `ng test -- --run` (Vitest flag `--run` to exit after one pass)

## Conventions

- Components use standalone pattern (no NgModules except app root)
- Signals for reactive state (`signal()`, `computed()`) — avoid `BehaviorSubject` in services
- SCSS for component styles; Tailwind utility classes in templates
- Feature folder structure: `features/{area}/{feature}/{component}.component.ts`
- Spec files live next to their source: `*.component.ts` → `*.component.spec.ts`