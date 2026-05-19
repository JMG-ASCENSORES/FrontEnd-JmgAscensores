# Skill Registry — FrontEnd-JmgAscensores

_Updated by sdd-init on 2026-05-18_

## Project Info

- **Name**: FrontEnd-JmgAscensores (angular.json project name: `jmg-ascensores`)
- **Stack**: Angular 21.2, TypeScript 5.9 strict, Tailwind CSS 3.4, SCSS, RxJS 7.8, Lucide Angular, Vitest 4, Playwright
- **Package manager**: pnpm 11.1.2 (NOT npm — `angular.json` says npm but it's stale)
- **Architecture**: Screaming Architecture (feature-based), Core/Features/Shared layout, signal-first state
- **Testing**: Vitest (`pnpm test`), Playwright E2E (`npx playwright test`), coverage via v8
- **Formatting**: Prettier (printWidth: 100, singleQuote: true, Angular HTML parser)

## Convention Files

- `CLAUDE.md` (project root) — authoritative project guide, includes pnpm note, `ai-*` palette rule, auth gotchas
- `AGENTS.md` (project root) — shorter agent guide, partial overlap with CLAUDE.md (uses `npm` — outdated)
- `TESTING.md` — service & component test patterns (HTTP mocking via `HttpClientTestingModule`, spies via `vi.fn()`)

## User Skills

| Skill | Trigger Context |
|-------|----------------|
| `frontend-design` *(project-level)* | Building web components, pages, UI, dashboards, layouts, visual/styling work |
| `branch-pr` | Creating pull requests, preparing changes for review |
| `issue-creation` | Creating GitHub issues, reporting bugs, requesting features |
| `judgment-day` | "judgment day", "juzgar", "doble review", adversarial dual review |
| `skill-creator` | Creating new AI skills, documenting patterns for AI |
| `simplify` | Review changed code for reuse, quality, efficiency; fix issues |
| `claude-api` | Anthropic SDK / Claude API code (only triggers on `anthropic` imports) |

## Compact Rules

### Angular Architecture (scope-rule)

**ALWAYS use standalone components** — no NgModules except app root. Use `inject()` not constructor DI. Use signal-based functions (`input()`, `output()`). Implement `ChangeDetectionStrategy.OnPush` where applicable. Use signals: `signal()`, `computed()`, `effect()`. Use native control flow `@if`/`@for`/`@switch`.

**Scope Rule (UNBREAKABLE)**: Code used by 2+ features → goes in `shared/` or `core/`. Code used by 1 feature → stays inside that feature. NO EXCEPTIONS.

**Screaming Architecture**: Feature names = business domain names. Directory structure tells what the app does. Main feature component name matches the feature name.

**Structure**:
```
src/app/
  core/               → singleton services, interceptors (auth), guards, cross-cutting models
  features/[area]/    → admin | auth | worker, each lazy-loaded with own routes file
  shared/             → ONLY for 2+ feature usage
```

### Auth Conventions (CRITICAL — keep when editing)

- `authInterceptor` skips when token is missing OR equals string `"undefined"` / `"null"` — defensive against past serialization bugs. DO NOT REMOVE.
- Single-flight refresh: module-level `isRefreshing` flag + shared `BehaviorSubject` — interceptors are re-instantiated per request, so state lives at module scope intentionally.
- `authGuard` does NOT inspect role; role gating happens inside feature layouts/components.
- When adding admin/worker routes, use `loadComponent` and rely on parent's `authGuard` — don't re-apply.

### TypeScript

TypeScript strict mode ON. Never use `any` (ESLint `@typescript-eslint/no-explicit-any: warn`). Use `unknown` for unknown types. Prefer interfaces over types for object shapes. Use generics for reusability.

### Tailwind / Brand (two-namespace rule)

Two color namespaces — DO NOT MIX:
- **`jmg-*`** (`#003B73`) for all standard UI. Variants: DEFAULT, dark, light, muted.
- **`ai-*`** (`#06b6d4`) RESERVED for AI-generated content and the AI module's branding only. Variants: DEFAULT, dark, light, muted.
- Semantic: `primary`, `secondary`, `accent` (#10b981), `success`, `warning`, `error`
- Fonts: `font-display` (Syne) for headings, `font-body` (DM Sans) for body
- General animations: `fade-in`, `fade-in-up`, `slide-in-right`
- **AI-only animations**: `shimmer`, `glow-pulse`, `ai-enter` — only on AI surfaces
- NEVER inline styles. Use Tailwind classes or component `.scss`.

### ESLint Selectors

- Component selector prefix: `app-` (kebab-case) — enforced
- Directive selector prefix: `app` (camelCase attribute) — enforced

### Testing Gotchas

- Don't wire `LUCIDE_ICONS` in spec files — `src/test-setup.ts` monkey-patches `TestBed.configureTestingModule` globally.
- `localStorage` is mocked globally in `src/test-setup.ts` (jsdom doesn't provide one that survives all paths).
- Path alias `@` → `src/` is available in tests via `vitest.config.ts`.
- Specs co-located with source: `foo.component.ts` ↔ `foo.component.spec.ts`.

### `frontend-design`

Avoid generic AI aesthetics. Commit to a bold aesthetic direction before coding. Use JMG brand palette (`jmg-*` for general UI, `ai-*` only for AI surfaces). Prefer distinctive typography (Syne + DM Sans). Execute with precision — minimalist or maximalist, but always intentional.

### `branch-pr`

Issue must exist before opening PR. PR title: `type(scope): short description` (conventional commits, observed in `git log`). Include test plan and affected areas.

### `issue-creation`

Label: `bug`, `enhancement`, or `chore`. Include steps to reproduce for bugs. Reference related issues/PRs.

### `judgment-day`

Launch two independent blind judge sub-agents in parallel. Synthesize findings; apply fixes; re-judge until both pass or escalate after 2 iterations.

### `simplify`

Review the changed code for reuse opportunities, unnecessary abstraction, dead branches, and efficiency wins. Fix issues found. Default to deleting — three similar lines beat a premature abstraction.

## Testing Capabilities

| Capability | Status | Command |
|------------|--------|---------|
| Test Runner | ✅ Vitest 4.1.4 | `pnpm test` |
| Unit Tests | ✅ Vitest + jsdom + TestBed | `pnpm test` |
| Integration Tests | ❌ Not installed | — |
| E2E Tests | ✅ Playwright | `npx playwright test` |
| Coverage | ✅ v8 | `npx vitest --coverage` |
| Linter | ✅ ESLint + angular-eslint | `npx eslint .` |
| Type Checker | ✅ TypeScript strict | `npx tsc --noEmit` |
| Formatter | ✅ Prettier | `npx prettier --check .` |

**Strict TDD Mode**: enabled ✅ (Vitest detected; no override in CLAUDE.md/AGENTS.md)
