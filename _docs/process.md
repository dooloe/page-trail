# PageTrail — Development Process

## Task sources

Use [GitHub Issues](https://github.com/dooloe/page-trail/issues) for task scope, verification requirements, and implementation progress. The [local backlog](./tasks.md) preserves implementation order. Use the [product plan](./plan.md) for feature scope and the [architecture](./architecture.md) for technical decisions.

When creating or refining a task, use the [task template](./task-template.md) to record its goal, scope, prerequisites, acceptance criteria, and verification. Link prerequisite issues and identify any dependency additions that need approval.

## Commands

- `npm ci` — install dependencies from the lockfile.
- `npm run dev` — start the application at http://localhost:5173.
- `npm test` — run the whole test suite without watch mode.
- `npm test -- src/app/App.test.tsx` — run one test file.
- `npm run typecheck` — check TypeScript without emitting files.
- `npm run build` — check TypeScript and create the production build.

## Dependency changes

Follow [AGENTS.md](../AGENTS.md): ask the user before adding a dependency, including development dependencies. Planned technologies in the architecture still require approval before installation. Record approved dependencies in `package.json` and update `package-lock.json` alongside it.

## Implementation and verification

Read the selected issue and its prerequisites before implementing its scope. Run its required checks and report the results, including any remaining limitations. For the current scaffold, verify the render smoke test, TypeScript check, and production build. Add feature-specific verification as later tasks require it.

When asked to commit current work before revising documents, create that checkpoint commit before making documentation edits. Keep the subsequent edits available for review.

When committing documentation changes, review all modified and new documents, preserve the user's edits, align related references, and check local links and whitespace. Stage only the files intended for that commit.

Build and verify locally first. Deployment remains outside the initial MVP scope.
