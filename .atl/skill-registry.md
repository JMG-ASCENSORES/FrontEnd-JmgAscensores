# Skill Registry — jmg-ascensores

_Updated by sdd-init on 2026-04-20_

## Project Info

- **Name**: jmg-ascensores
- **Stack**: Angular 21, TypeScript 5.9, Tailwind CSS 3, SCSS, RxJS 7.8, Vitest
- **Architecture**: Feature-based (Screaming Architecture), Core/Features/Shared layout
- **Testing**: Vitest (`npm test`), Playwright (`npx playwright test`)
- **Formatting**: Prettier (printWidth: 100, singleQuote: true, Angular HTML parser)

## Convention Files

No project-level AGENTS.md, CLAUDE.md, or .cursorrules found.

## User Skills

| Skill | Trigger Context |
|-------|----------------|
| `frontend-design` *(project-level)* | Building web components, pages, UI, dashboards, layouts, visual/styling work |
| `branch-pr` | Creating pull requests, preparing changes for review |
| `issue-creation` | Creating GitHub issues, reporting bugs, requesting features |
| `judgment-day` | "judgment day", "juzgar", "doble review", adversarial dual review |
| `skill-creator` | Creating new AI skills, documenting patterns for AI |

## Compact Rules

### Angular Architecture (scope-rule)

**ALWAYS use standalone components** — no NgModules. Use `inject()` not constructor DI. Use `input()`/`output()` signal-based functions. Implement `ChangeDetectionStrategy.OnPush`. Use signals: `signal()`, `computed()`, `effect()`. Use native control flow `@if`/`@for`/`@switch`. No `.component`, `.service`, `.module` suffixes in filenames.

**Scope Rule (UNBREAKABLE)**: Code used by 2+ features → goes in `shared/` or `core/`. Code used by 1 feature → stays inside that feature. NO EXCEPTIONS.

**Screaming Architecture**: Feature names = business domain names. Directory structure tells the story of what the app does. Main feature component name matches the feature name.

**Structure**:
```
src/app/
  features/[feature]/ → local components, services, models, signals
  shared/             → ONLY for 2+ feature usage
  core/               → singleton services, interceptors, guards
```

### TypeScript

TypeScript strict mode ON (`strict: true`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `strictTemplates`). Never use `any`. Use `unknown` for unknown types. Prefer interfaces over types for object shapes. Use generics for reusability.

### Tailwind / Brand

Use Tailwind utility classes in templates. Brand tokens from `tailwind.config.js`:
- Colors: `jmg` (#003B73), `jmg-dark`, `jmg-muted`, `accent` (#10b981), `success`, `warning`, `error`
- Fonts: `font-display` (Syne) for headings, `font-body` (DM Sans) for body text
- Animations: `animate-fade-in`, `animate-fade-in-up`, `animate-slide-in-right`
- NEVER inline styles. Use Tailwind classes or component `.scss`.

### `frontend-design`

Avoid generic AI aesthetics. Commit to a bold aesthetic direction before coding. Use JMG brand palette. Prefer distinctive typography (Syne + DM Sans already set up). Execute with precision — minimalist or maximalist, but always intentional.

### `branch-pr`

Issue must exist before opening PR. PR title: `type(scope): short description` (conventional commits). Include test plan and affected areas.

### `issue-creation`

Label: `bug`, `enhancement`, or `chore`. Include steps to reproduce for bugs. Reference related issues/PRs.

### `judgment-day`

Launch two independent blind judge sub-agents in parallel. Synthesize findings; apply fixes; re-judge until both pass or escalate after 2 iterations.

## Testing Capabilities

| Capability | Status | Command |
|------------|--------|---------|
| Test Runner | ✅ vitest | `npm test` |
| Unit Tests | ✅ vitest + jsdom | `npm test` |
| Integration Tests | ❌ Not installed | — |
| E2E Tests | ✅ playwright | `npx playwright test` |
| Coverage | ✅ v8 | `npx vitest --coverage` |
| Linter | ✅ ESLint + angular-eslint | `npx eslint .` |
| Type Checker | ✅ TypeScript strict | `npx tsc --noEmit` |
| Formatter | ✅ Prettier | `npx prettier --check .` |

**Strict TDD Mode**: enabled ✅ (vitest detected; no override in CLAUDE.md or openspec)
