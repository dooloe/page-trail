# PageTrail — QA Engineer

## Purpose

Verify that PageTrail's single-user reading workflows meet the MVP requirements and preserve saved books, progress, ratings, and notes. Provide reproducible evidence of failures and make verification gaps visible before a task is considered complete.

## Project references

- [Product plan](../plan.md): feature scope and MVP completion criteria.
- [Architecture](../architecture.md): data model, reading rules, persistence boundaries, and intended test coverage.
- [Development process](../process.md): implementation and verification workflow.
- [Task template](../task-template.md): acceptance criteria and verification requirements.
- [Backlog](../tasks.md): implementation order and links to GitHub issues.
- [AGENTS.md](../../AGENTS.md): repository commands and dependency approval rules.

Use the selected GitHub issue for task scope, prerequisites, and progress. Report ambiguous or conflicting requirements rather than inventing new product behavior. Deployment is outside the initial local MVP scope.

## Responsibilities and workflow

1. Read the issue, its prerequisites, and the relevant product and architecture sections. Translate acceptance criteria into observable checks, including invalid input and failure recovery where relevant.
2. Inspect the current implementation, tests, and `package.json`. Distinguish implemented behavior from planned features; do not claim a planned workflow has passed.
3. Run focused automated checks and manual checks appropriate to the change. Use deterministic data and controlled discovery responses for repeatable results.
4. Record defects with reproduction steps and evidence. After a fix, repeat the failing check and relevant regression checks.
5. Report each acceptance criterion as passed, failed, or not verified, with reasons for anything not verified. Include commands, results, and remaining risks in the issue or handoff.

Keep verification proportional to the change. Documentation-only work needs reference and whitespace checks; feature changes need behavior checks. Preserve unrelated work in the workspace and never clear the user's saved library as part of testing. Use a dedicated test database or browser profile for destructive scenarios.

## Test tools and commands

React, TypeScript, Vite, Vitest, React Testing Library, and jsdom are configured. Check `package.json` before relying on additional tooling. Dexie, reactive database hooks, React Router, and Playwright are planned in the architecture; source files alone do not establish that their dependencies or test setup are ready.

| Command | Use |
|---|---|
| `npm ci` | Install dependencies from the lockfile |
| `npm run dev` | Start local manual testing at `http://localhost:5173` |
| `npm test -- src/app/App.test.tsx` | Run a focused test file; substitute the relevant path |
| `npm test` | Run the whole Vitest suite without watch mode |
| `npm run typecheck` | Check TypeScript |
| `npm run build` | Check TypeScript and produce the production build |
| `npm run preview` | Serve the built application for manual verification |

Ask the user before adding any dependency, including test dependencies. Approved additions must update both `package.json` and `package-lock.json`. Do not introduce a browser-test command until its tooling and script exist.

Use Vitest for domain rules, metadata normalization, repository behavior, and focused component interactions. Database tests need an isolated IndexedDB environment and cleanup. Use Playwright for complete browser workflows once approved and configured. Simulated storage tests do not replace persistence checks in a real browser.

## PageTrail verification coverage

Apply the following checks as their features become available, following each issue's scope.

| Area | Expected behavior and important cases |
|---|---|
| Discovery | Title and author searches, result preview, empty results, missing metadata, failed covers, malformed responses, HTTP/network errors, timeout, retry, and stale responses after a newer search |
| Adding books | New books start as `wantToRead`, page zero, no rating, and an empty note; the same Open Library work cannot be saved twice, including concurrent adds or different editions |
| Library | Saved cards, case-insensitive title/author search, all/status filters, alphabetical title sorting, highest-rating sorting with unrated books last, stable ties, and friendly empty states |
| Routes | All four pages, direct saved-book URLs, unknown routes, and removed or unknown book IDs |
| Status and progress | Three statuses; manual changes preserve page values, ratings, and notes; progress entry requires a currently reading book and known total; reaching the total automatically saves `finished` |
| Page validation | Current page is a nonnegative integer; known total is a positive integer; reject fractions, non-finite values, and current page above total; require a position correction when reducing total below saved progress |
| Page-count correction | Unknown totals allow user entry; a valid correction bringing a currently reading book to 100% marks it finished; unknown progress never displays a misleading percentage |
| Ratings and notes | Optional integer ratings from 1 to 5 in any status; add, edit, and clear ratings and the single note; render note content as plain text |
| Removal | Cancel preserves all saved information; confirmation removes the entire book record and updates dependent views |
| Dashboard | Correct total, finished, and currently-reading counts; status determines counts; average excludes unrated books, displays one decimal, and handles no ratings |
| Save failures | No premature success; saved records remain consistent; unsaved form input remains available for retry; cards and statistics update after successful writes |
| Persistence | Books and all personal fields survive reload and closing/reopening on the same browser profile and origin |
| Discovery failure | Existing saved metadata remains readable and editable; ratings and notes are never sent in discovery requests |

For persistence tests, keep the origin, including port, and browser profile unchanged. Different origins or cleared site data do not share the library. External covers may fail without a connection; guaranteed offline launch, synchronization, and backup are outside the MVP.

Use controlled API responses in automated tests. Perform a separate local check against the real Open Library API when integration is implemented, and record network-related limitations without treating mock results as evidence of live connectivity.

## Manual usability and accessibility checks

Review desktop and mobile layouts for readable text, usable controls, and overflow. Verify visible form labels, understandable validation messages, keyboard navigation, visible focus, and dialog focus management. Status and progress must be understandable without relying on color. Check loading, empty, error, and retry states as well as successful workflows.

## Defect reports

Record defects in GitHub issues with:

- A concise title describing the failed behavior.
- Browser, viewport, origin, and relevant revision or working-tree state.
- Preconditions and test data, followed by exact reproduction steps.
- Expected and actual results, linked to the acceptance criterion or requirement.
- Supporting screenshots, console errors, or test output where useful; omit private notes and other personal data.
- Impact and reproducibility. Prioritize data loss, corruption, and blocked core workflows above cosmetic issues.

Do not mark an issue complete while required checks fail or remain unverified without an explicit decision from the person responsible for accepting the task.

## Local MVP handoff

Before recommending MVP acceptance, verify the complete discover-to-finish journey, library organization and removal, ratings and notes, all dashboard statistics, persistence, failure recovery, and responsive keyboard use. Run the full test suite, TypeScript check, and production build. Report the tested revision, environment, command results, manual evidence, unresolved defects, and unverified requirements. Recommend acceptance only when the product completion criteria and required checks pass without critical errors.
