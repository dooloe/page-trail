# Backlog verification

## Final local MVP verification — 2026-10-13

Implemented the remaining 21 open MVP issues starting at #6. The application
renders the complete four-page PageTrail UI. After a successful clean `npm ci`,
`npm test` passed 102 tests in fifteen files, `npm run typecheck` passed, and
`npm run build` produced the application. `npm run test:e2e` passed all 27
Chromium cases twice with isolated data (29.0s / 27.7s); `npm run test:live`
passed the two real-API journeys at 1280px and 320px (14.3s). Both browser
runners verify the production preview at http://127.0.0.1:4173.

Genuine same-profile browser close/relaunch, all personal editing workflows,
reactive cross-tab views/statistics, native-modal focus, storage faults/retry,
discovery failure with usable saved edits, mobile bounds, keyboard journeys,
and separate operator screenshot/real-API review now provide the evidence
missing from the earlier audit. The [MVP handoff](./mvp-handoff.md) records
each issue and all seven product criteria, setup, API usage and persistence
boundaries. Earlier entries below are historical and do not describe the
current completion state. Changes remain in the local worktree.

Closed the verified remaining issues #6–#8 and #10–#27 with reason `completed`.
A fresh GitHub query confirms all 27 MVP issues closed and zero open issues;
all existing `mvp` labels remain intact.

## Approved dependencies and production application verification

On 2026-10-13, the user approved react-router, dexie, dexie-react-hooks,
fake-indexeddb, and @playwright/test. Installed runtime and test packages in
their respective manifest sections and updated package-lock.json. Added
`npm run test:e2e`, a production-preview Playwright configuration, and the
initial integrated application browser test. Vitest discovers only unit test
files under src, keeping the browser runner separate.

App now mounts ApplicationRoutes instead of the placeholder. Its render smoke
test checks the actual dashboard heading and navigation. Current verification:

- `npm test`: 96 passing tests in fifteen files, including the real IndexedDB
  adapter repository and reactive-read tests.
- `npm run build`: TypeScript passes and Vite creates the production build.
- Focused TypeScript check of playwright.config.ts and the browser test: passes.
- Production workflow browser check: passes in Firefox and Chromium. It covers
  all four pages, controlled discovery, saved creation defaults, duplicate
  feedback, reading status, progress, rating/note saves, reload persistence,
  dashboard refresh, and absence of page errors. Inspected the dashboard
  screenshot at `test-results/application-dashboard.png`.
- `git diff --check`: passes.

Browsers were downloaded into /tmp. This host lacks browser libraries and sudo
requires terminal authentication, so approved library downloads were extracted
locally. The successful Chromium command was:

```sh
LD_LIBRARY_PATH=/tmp/page-trail-browser-libs/usr/lib/x86_64-linux-gnu \
PLAYWRIGHT_BROWSERS_PATH=/tmp/page-trail-headless npm run test:e2e
```

Firefox used the same library path with
`PLAYWRIGHT_BROWSERS_PATH=/tmp/page-trail-firefox PAGE_TRAIL_BROWSER=firefox`.
Standard browser installation is documented in README; these /tmp paths are
specific to this verification environment and are not application requirements.

Earlier dependency-blocked entries below describe historical work. The
dependency gate is now resolved. Broader backlog acceptance remains outstanding:
real API browser access, browser close/reopen, fault recovery, complete
organization/editing/removal scenarios, mobile/keyboard review, and final MVP
handoff. This initial check does not prove all MVP criteria.

## Reactive editor draft correction

On 2026-10-13, fixed details forms retaining obsolete untouched values after
their saved record changes. Untouched drafts now follow subscribed values;
dirty drafts survive incoming updates and failed saves. Page-count-only edits
omit currentPage so they cannot overwrite newer stored progress. Successful
page saves no longer reset unsaved drafts in separate status/progress forms.

`npm test -- src/pages/BookDetails.test.tsx` passes seven tests, including
incoming record changes, failed joint corrections, and preserving other form
drafts after a successful save. A focused strict TypeScript check of the
details component and tests passes. This is component-level evidence; real
database subscriptions and browser verification remain pending dependency
approval, and #16–#18 remain open.

## Subscription verification prepared

Added `src/data/useLibrary.test.tsx` for #5 with isolated IndexedDB databases.
The cases cover initial loading versus empty success, reactive committed
add/update/delete, changing detail IDs without displaying the previous book,
removed records, and storage errors distinct from missing/empty data.
These tests remain unexecuted until fake-indexeddb, Dexie, and
dexie-react-hooks are approved and installed; their presence is not evidence
that #5 is complete.

On 2026-10-13, `npm test -- src/app src/domain src/services src/components
src/pages` passed 83 tests in thirteen files. The whole suite fails resolving
fake-indexeddb, and `npm run typecheck` fails on missing planned router/database
packages and consequent database-type errors. Dependency approval has been
requested again in the active backlog session. The entry point still renders
the placeholder, so the integrated application remains incomplete.

## Prepared subscription and route integration

Added #5 hooks using the documented dexie-react-hooks API and repository
queries, with loading/success/missing/error states and identity guards to
avoid displaying an old ID or repository result. Added the #6 application
route module for Dashboard, Library, Discover, Details, and unknown paths,
including active navigation, skip link, route focus, and repository callbacks
for adds, updates, and removal. The module is prepared but not mounted in
the entry point until the pending dependencies can be installed and verified.

Reviewed official Dexie useLiveQuery and React Router declarative routing
documentation on 2026-10-13. `npm run typecheck` remains unsuccessful and now
explicitly reports missing react-router, dexie, and dexie-react-hooks.
fake-indexeddb is also still absent. No manifest/lockfile changes were made.
Subscription behavior, direct URL/back/forward routes, complete integrated
workflows, and browser persistence remain unverified. Component tests alone
must not be used to close these issues or accept the MVP.

## Search pacing and saved-preview synchronization

Search request starts now use a shared per-tab one-second pacing queue,
consistent with the reviewed default API rate limit. Cancelling while queued
cleans up its timer and does not reserve an extra request slot. The overall
10-second timeout includes queue time. An abort check immediately before
Fetch prevents a request when cancellation arrives during queue completion.
Application-identification guidance and actual browser API access still need
review; pacing does not establish those requirements or coordinate other tabs.

Discovery saving now hands duplicate state back to library read props once
they observe the saved record, allowing add again after subsequent removal.
Regression tests cover that transition and concurrent paced/cancelled calls.
The runnable non-database suite passes 83 tests in thirteen files; focused
strict TypeScript checks pass for these modules. These results still do not
prove database subscriptions, router integration, or browser persistence.

## Discovery saving

Added #12 preview save controls with injected repository operations and
library read state. Existing canonical source/work identities show Already
in Library; pending saves prevent repeated writes; success is announced only
after the operation resolves. Concurrent duplicate results become saved-book
feedback, while other failures allow retry. Loading/error library reads do
not permit an add based on an assumed empty library.

The runnable non-database suite passes 80 tests in twelve files. Focused
strict TypeScript checks pass for the save component, its tests, and discovery
page. Tests cover existing records, pending/repeated actions, delayed success,
storage-failure retry, and concurrent duplicate feedback. Real database
integration, cross-view deletion/add synchronization, route integration, and
browser persistence remain unverified. Pending package approval still blocks
the planned Dexie/reactive hooks/router/browser harness installation.

## Removal confirmation

Added #21 shared native-modal removal confirmation and entry points in the
Library and Book Details views. It names the book and explains loss of
progress, rating, and note. Cancellation restores trigger focus and does not
write; pending deletion prevents repeated writes; failure preserves the
dialog for retry. Successful library removal focuses its heading; details
accepts a navigation callback for returning to the library.

The runnable non-database suite passes 77 tests in eleven files, and focused
strict TypeScript checks pass for the dialog, tests, and both entry views.
Tests simulate missing jsdom dialog methods and verify cancellation focus,
failed-delete retry, and success callbacks. Native browser modal focus
containment, Escape behavior, actual complete-record deletion, subscribed
counts, and post-removal route focus remain to be verified. Dependency
approval is still pending, so database/routing integration remains incomplete.

## Book details and editing controls

Added the #15 saved-book detail view and #16–#20 editing controls for status,
joint page corrections, standalone progress, rating save/clear, and one
plain-text note save/clear. Writes use injected repository operations and
domain validation. Pending writes disable controls; errors preserve drafts.
Known progress uses a semantic progress element and rounded display text;
unknown totals gate progress entry. Missing/loading/error records have
distinct feedback. Different book IDs remount the editor to isolate drafts.

Tests verify page-combination rejection before writing, joint correction,
manual status writes, rating clearing, failed-note retry, inert HTML-like
note drafts, unknown-total gating, and missing-book navigation. The runnable
non-database suite passes 75 tests in ten files; focused strict TypeScript
checking of the details view and tests passes. This is component-level
evidence only: routes, subscriptions, real persisted edits/reopening, all
rating values, keyboard/browser review, and removal integration remain
outstanding. No dependency approval has been received or package added.

## Library and dashboard views

Added #13/#14 library rendering with labeled search, status and sort controls,
saved cards, empty/no-match feedback, and clear-search/filter recovery. Added
#22 dashboard rendering with all four statistics and one-decimal average
ratings, excluding unrated records. Both views distinguish loading and
storage failure from empty success through a shared typed read-state contract.

Page tests verify combined controls, rating ordering, no-match recovery,
loading/error/empty rendering, and dashboard changes after supplied records
change or ratings are cleared. `npm test -- src/pages` passes eight tests in
two files; focused strict TypeScript checking of these views and their tests
passes. The complete runnable non-database suite passes 71 tests in nine files.
These pages still require #5 subscriptions and #6 routing, whose dependency
approval remains pending. Prop updates do not prove database reactivity, and
these issues remain incomplete until integration/browser checks pass.

## Discovery interface progress

Added the #11 discovery page with labeled title/author controls, explicit
submission, initial/loading/empty/error states, retry using the failed query
and mode, and cancellation on superseding searches or unmount. Older responses
cannot replace newer results even when a service ignores cancellation. Result
cards open an inline metadata preview; #12 persistence and duplicate feedback
remain to be integrated after the data-layer dependencies are approved.

The page is not yet mounted in the application: #6 React Router and #5 reactive
reads still need the pending dependency approval. No issue is marked complete
from component tests alone. `npm test -- src/app src/domain src/services
src/components src/pages` passes 67 tests in eight files. A focused strict
TypeScript check of the discovery page and its tests passes. Live API access,
request pacing, browser usability, full build, and database verification
remain outstanding.

## Cards and derived library data

Added shared visual tokens/base styles and reusable saved/discovery book
cards with a local SVG cover fallback. Tests verify saved metadata and
personal values, discovery preview actions, failed-image fallback without an
error loop, and retry when the cover URL changes. Routing integration,
responsive rendered review, and keyboard review remain outstanding for
#7/#8; the React Router prerequisite is still pending approval.

Added pure library search/filter/sort, statistics, and progress calculations
for #14/#18/#22. Tests cover combined title/author/status search, empty matches,
rating/title ordering with ID ties and unrated values, authoritative status
counts, rating clearing, deletion, and unrounded/unknown progress. These
calculations do not yet have subscribed page integration.

`npm test -- src/components src/domain src/services src/app` passes 63 tests
in seven files. A focused strict TypeScript check of the new components and
derived-data module passes. No dependency has been added, and full-project
verification is still blocked as described below.

## Search service progress

Issue #10 now has a Fetch search service with title/author parameters, only
public metadata fields, a 20-result limit, and a 10-second timeout. Blank
queries skip requests. HTTP, network, malformed response, timeout, and caller
cancellation have distinct results; timers and abort listeners are cleaned up.
`npm test -- src/services` passes 23 tests, including normalization and request
failure cases. A focused strict TypeScript check of domain/service modules and
service tests also passes. The full-project dependency failures below remain.

Reviewed [Search API documentation](https://openlibrary.org/dev/docs/api/search)
and [usage guidelines](https://openlibrary.org/developers/api) on 2026-10-13.
The default request limit is one per second; identified applications receive
a higher limit. Before completing #10/#11, enforce request pacing, account for
application identification guidance in browser requests, and verify actual
cross-origin browser access. These remain unverified; documentation retrieval
and mocked Fetch tests do not prove browser API access. No backend or live
browser verification has been introduced.

Current local verification on 2026-10-13, for the uncommitted worktree:

- Issue #2: creation model tests pass, covering defaults, independent IDs,
  metadata preservation, optional metadata, and authors-array isolation.
- Issue #4: pure update tests pass, covering status transitions, joint page
  corrections, automatic completion, invalid values, ratings, notes, and
  input preservation. Repository verification remains pending.
- Issue #9: implemented pure Open Library normalization. Canonical work IDs
  are bare `OL…W` values; `/works/OL…W` paths normalize to the same identity.
  Edition IDs and missing identities/titles are omitted. Invalid optional
  metadata uses empty authors and null covers/pages. Valid cover IDs produce
  HTTPS medium cover URLs with `default=false` so failed covers can use the
  application's fallback. Tests cover malformed values and input isolation.

`npm test` reports 46 passing tests across four files, but exits unsuccessfully:
the repository suite cannot resolve `fake-indexeddb/auto`.
`npm run build` fails at its TypeScript step because `dexie` is absent from
the manifest and installed dependencies. These are prerequisite failures,
so the affected issues have not been marked complete.

Approval has been requested for the architecture's planned Dexie,
dexie-react-hooks, React Router, fake-indexeddb, and Playwright test packages.
Once approved, update the manifest and lockfile together, verify the data
layer, and continue the ordered backlog. Full local MVP verification remains
outstanding; these unit results do not demonstrate browser workflows or
persistence across browser reopening.
