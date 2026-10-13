# PageTrail

Your bookshelf, your progress, your thoughts.

PageTrail is a cozy personal reading tracker and digital bookshelf for discovering books, organizing a library, tracking reading progress, and saving ratings and private notes.

The application includes Dashboard, My Library, Discover Books, and Book Details,
with local book storage, reading progress, ratings, and one private note per book.

## Local development

Use Node.js 22.12+ on the Node 22 line, Node.js 24, or Node.js 26+, and npm. Node.js 24 is recommended.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. The development server uses a fixed port to keep the browser storage origin stable so the same profile can reopen its saved library.

## Verification commands

```sh
npm test          # Run Vitest once, without watch mode
npm test -- src/app/App.test.tsx # Run one test file
npm run typecheck # Check TypeScript without emitting files
npm run build     # Check TypeScript and build production assets in dist/
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort # Local production preview
npx playwright install chromium # Install the browser used for workflow tests
npx playwright install-deps chromium # Install system libraries if needed (requires sudo)
npm run test:e2e   # Controlled production-browser suite; build first
npm run test:live  # Separate real-API mobile/desktop journeys; internet required
```

## Features

- Discover books by title or author through Open Library.
- Organize books as Want to Read, Currently Reading, or Finished.
- Track page-based reading progress.
- Save star ratings and one personal note per book.
- View a simple dashboard of reading activity.
- Keep saved library data in the browser using IndexedDB.

## Stack and storage

React, TypeScript, Vite, React Router, Dexie, CSS Modules, Vitest, and Playwright.

React Router, Dexie, dexie-react-hooks, fake-indexeddb, and Playwright were
approved for installation. Ask the user before adding further dependencies.
Declare approved dependencies in `package.json` and update `package-lock.json`
alongside it.

Saved data belongs to the browser profile and origin, including its port. Use
the same origin when reopening the application to retain access to your library.
Clearing site data deletes it; there is no sync, backup, or automatic transfer
between development and production-preview origins. Notes remain local and are
not sent to Open Library. Covers require external network access. Discovery
failure does not prevent access to saved books in the running application;
offline application launch is not guaranteed.

Browser tests use isolated contexts, controlled discovery responses, and a
temporary persistent profile; they do not use or delete a user's actual library.
The 27 repeatable checks cover navigation, title/author saving, organization,
reading/editing, statistics, removal, genuine browser close/reopen, recovery,
and mobile/keyboard behavior. The separate live suite uses the real Open Library
API at desktop and mobile widths. Both runners start their own production
preview at http://127.0.0.1:4173; build first and leave that port free. Failed
browser checks retain traces in `test-results/`. See the
[local MVP handoff](_docs/mvp-handoff.md) for the dated results and limitations.

To run the controlled suite in Firefox, install it with
`npx playwright install firefox`, then run
`PAGE_TRAIL_BROWSER=firefox npm run test:e2e`.

## Project documentation

- [Product plan](_docs/plan.md)
- [Technical architecture](_docs/architecture.md)
- [MVP tasks](_docs/tasks.md)
- [Local MVP handoff and acceptance evidence](_docs/mvp-handoff.md)
- [Verification history](_docs/verification.md)
- [Development process](_docs/process.md)
- [Task template](_docs/task-template.md)
- [Agent commands and rules](AGENTS.md)

The MVP is intended for local implementation and verification first. Application deployment is outside its initial scope.
