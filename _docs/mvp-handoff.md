# PageTrail — local MVP handoff

Verified on 2026-10-13 with Node.js 24.21.0, npm 11.19.0, and Chromium against
`http://127.0.0.1:4173`. Implementation and evidence are in the local worktree;
this report does not imply a commit, push, or deployment.

After acceptance verification, closed #6–#8 and #10–#27 with reason
`completed`. A fresh GitHub all-state query confirmed all 27 issues closed,
zero open issues, and every `mvp` label retained.

## Setup and repeatable checks

Follow [README](../README.md) for supported Node versions, installation, browser
setup, development, and production preview. The approved router/storage/test
packages appear in both manifest and lockfile. No further packages were added.

| Command | Recorded result |
|---|---|
| `npm ci` | Clean install succeeded; 152 packages installed, zero audit vulnerabilities. Sandbox initially prevented esbuild binary validation; the approved unrestricted rerun succeeded. |
| `npm test` | 102 tests passed in 15 files. |
| `npm run typecheck` | Passed, including application, browser tests, and both Playwright configurations. |
| `npm run build` | Passed; Vite built the actual application in `dist/`. |
| `npm run test:e2e` | All 27 Chromium tests passed twice, in fresh isolated contexts (29.0s and 27.7s). |
| `npm run test:live` | Both real Open Library journeys passed at 1280px and 320px (14.3s total). |

Both browser runners start `npm run preview -- --host 127.0.0.1 --port 4173
--strictPort` themselves and reject an existing server. Build before running
browser tests. Unit and repeatable browser suites do not depend on the live API;
`test:live` is explicitly separate and requires internet access. Failure traces
are retained under the ignored `test-results/` directory.

This host needed downloaded browser binaries and locally extracted system
libraries. Its successful browser commands used this environment prefix:

```sh
LD_LIBRARY_PATH=/tmp/page-trail-browser-libs/usr/lib/x86_64-linux-gnu \
PLAYWRIGHT_BROWSERS_PATH=/tmp/page-trail-headless npm run test:e2e

LD_LIBRARY_PATH=/tmp/page-trail-browser-libs/usr/lib/x86_64-linux-gnu \
PLAYWRIGHT_BROWSERS_PATH=/tmp/page-trail-headless npm run test:live
```

These temporary paths are environment-specific; normal machines should use the
standard Playwright installation documented in README.

## Acceptance audit for the remaining issues

Each row summarizes the original issue's acceptance criteria and the evidence
that now resolves the earlier [completion audit](./issue-completion-audit.md).
All tests cited below executed successfully. Unit evidence is under `src/`;
production browser evidence is under `tests/browser/` and `tests/live/`.

| Issue | Accepted behavior and evidence |
|---|---|
| [#6](https://github.com/dooloe/page-trail/issues/6) — shell/routes | `ApplicationRoutes.tsx`, actual dashboard smoke test, and `routes.spec.ts`: four pages, active `aria-current` links, initial skip-link focus, keyboard navigation, direct/reloaded detail IDs, back/forward, unknown-path recovery. Preview stays inline. |
| [#7](https://github.com/dooloe/page-trail/issues/7) — visual foundation | Shared cream/brown/green CSS tokens, system fonts, scoped modules, visible focus, active-link underline/bold. Screenshot/operator review and `accessibility.spec.ts` verify narrow/wide layout; measured contrast is recorded below. |
| [#8](https://github.com/dooloe/page-trail/issues/8) — cards/covers | `BookCard.test.tsx`, discovery and accessibility cases: missing/failed covers use local SVG; a changed URL retries; absent/multiple authors and long/unbroken titles remain readable. Saved status/rating and discovery-only metadata have distinct accessible links/actions without nesting controls. |
| [#10](https://github.com/dooloe/page-trail/issues/10) — search service | `searchBooks.test.ts`, `searchPacing.test.ts`, live journeys, and current API documentation: encoded title/author fields, blank-query avoidance, public selected fields, 20-result limit, 10-second deadline, cancellation, cleanup, malformed/HTTP/network/timeout distinctions. Browser access succeeds without a backend; usage boundaries are below. |
| [#11](https://github.com/dooloe/page-trail/issues/11) — discovery | `Discover.test.tsx`, discovery/recovery cases, operator keyboard review: labeled mode/query, button/Enter submit, initial/loading/empty/error states, retry retains failed query/mode, older successful and failed responses cannot overwrite newer results, superseded/unmounted work is cancelled, navigation remains usable. |
| [#12](https://github.com/dooloe/page-trail/issues/12) — preview/save | Inline preview now includes its own cover, authors, pages/fallback, and focus management. `AddBook.test.tsx`, repository concurrency tests, discovery cases: defaults persist, canonical work/alternate-edition duplicates never overwrite personal data, pending repeats are blocked, failure retains preview for retry, subscribers see saved snapshots without an extra API request. |
| [#13](https://github.com/dooloe/page-trail/issues/13) — library | Page/hook tests and discovery/organization/recovery cases: loading/error/empty/populated views, every saved snapshot, local-ID links, subscribed add/update/delete refresh, reload persistence, no discovery request for local reads, keyboard/narrow layout. |
| [#14](https://github.com/dooloe/page-trail/issues/14) — organization | `library.test.ts`, page tests, `organization.spec.ts`: insensitive title/any-author search combined with all three statuses, alphabetical title and descending rating sorts, unrated last, title/ID ties, immediate controls/no-match recovery. Changes/deletion in a second app tab refresh the active filtered view without reload or API calls. |
| [#15](https://github.com/dooloe/page-trail/issues/15) — details | Detail/hook tests plus routes/reading/recovery/accessibility cases: snapshot-only direct/reload, incomplete metadata, unknown progress, explicit unrated/empty-note text, loading/storage-error/missing/deleted recovery, changed-ID draft/data isolation, inert HTML-like notes and narrow keyboard layout. |
| [#16](https://github.com/dooloe/page-trail/issues/16) — status | Domain, repository and reading/recovery cases: every selectable status persists; status-only edits preserve pages/rating/note/creation metadata, allow Finished with unknown pages and Currently Reading at 100%. Pending acknowledgment, failure/draft retry and keyboard operation are verified. |
| [#17](https://github.com/dooloe/page-trail/issues/17) — page counts | Reading/detail/domain/repository cases: unknown/positive totals, rejection of zero/negative/fractional/below-position totals with retained drafts, atomic joint corrections for every status, completion only for a currently-reading page edit, no silent clamp, failure/retry/reload and unrelated-field preservation. Duplicate discovery never replaces corrected totals. |
| [#18](https://github.com/dooloe/page-trail/issues/18) — progress | Reading/domain cases: gating on reading+known total, valid zero/intermediate/final values, invalid drafts/failure retry, 120/400 = 30%, matching semantic bar/text, no stored percentage. Final-page position and Finished commit together; manually Finished incomplete/unknown progress remains faithful. Focus moves to status when the progress form disappears. |
| [#19](https://github.com/dooloe/page-trail/issues/19) — ratings | Reading cases exercise all values 1–5, change, failed retry, clear to null and reload in every status; saved-value text, labeled keyboard selection, reactive updates and other-field preservation. Rating edits at 100% do not trigger completion. |
| [#20](https://github.com/dooloe/page-trail/issues/20) — note | Reading/detail cases exercise exact whitespace/multiline/HTML-like text, one-note replacement, clear to empty string, failed-draft retry, pending state, every status and reload; script-like text is inert. Service/request inspection confirms only public query fields are sent, never notes or ratings. |
| [#21](https://github.com/dooloe/page-trail/issues/21) — removal | `RemoveBook.test.tsx` and both browser entry-point cases: named confirmation explains all personal-data loss, cancellation/Escape never write, native-modal focus enters/cycles/restores, pending repeats/dismissal blocked, failed delete retains complete record and permits retry. Confirmation deletes the whole record and updates subscribers; details return to Library. |
| [#22](https://github.com/dooloe/page-trail/issues/22) — dashboard | Domain/page and reading/browser cases: all three counts use saved status independently of pages, total includes every status, average excludes null ratings and rounds 13/3 to 4.3. Empty/no-rating/loading/error feedback and subscribed status/rating/clear/delete updates work without network or persisted aggregates. |
| [#23](https://github.com/dooloe/page-trail/issues/23) — harness | Fixed production-preview origin, separate controlled/live suites, isolated contexts/fixtures, accessible locators and retained failure traces. Title/author save-defaults and duplicate/detail cases passed in both clean runs, without prior data, test-order dependence or fixed sleeps. README documents browser installation. |
| [#24](https://github.com/dooloe/page-trail/issues/24) — workflows | `organization.spec.ts` and `reading.spec.ts` cover combined local controls/ties/no-match recovery, status/unknown totals, joint corrections/atomic completion, rating/note create-edit-clear, persisted records and all dashboard values. Removal cases prove cancel preservation and confirmed deletion/count changes. |
| [#25](https://github.com/dooloe/page-trail/issues/25) — persistence/recovery | `recovery.spec.ts` genuinely closes and relaunches a test-owned persistent browser profile at the same origin, comparing every saved field. HTTP/network/timeout search failure leaves local reads/edits usable while failure remains active, then retry succeeds. Real IndexedDB add/put/delete faults preserve records/drafts and allow retry; read errors never masquerade as empty data. Missing covers/totals remain usable. Profiles are cleaned up; fault hooks exist only in test pages. |
| [#26](https://github.com/dooloe/page-trail/issues/26) — responsive/accessibility | All four pages plus incomplete/missing/unknown-path states reviewed at 320/768/1280px. Long-metadata bounds and complete keyboard journeys have browser regressions. Operator visual/keyboard/state review, measured contrast, and resolved focus defects are recorded below; no full conformance claim is made. |
| [#27](https://github.com/dooloe/page-trail/issues/27) — handoff | Clean install, unit/browser/type/build results above; real title/author journeys on mobile/desktop and operator inspection; persistence/failure evidence above; seven product criteria below. README and this handoff document commands, origins, privacy and remaining limitations. Deployment is excluded. |

## Seven product completion criteria

| Product criterion | Verified evidence |
|---|---|
| Discover and save books | Both search modes, real API previews/add once, defaults and duplicate protection. |
| Find, filter, sort and remove books | Organization cases, native confirmation cancel/confirm, persisted deletion and reactive counts. |
| Change status and track page progress | All statuses, unknown totals, corrected totals/joint pages, invalid drafts and automatic final-page completion. |
| Add and edit ratings and personal notes | Ratings 1–5 and note create/edit/clear across statuses, failure retry and reload preservation. |
| Accurate basic statistics | Empty/mixed/manual-status cases, nullable ratings, average rounding and subscribed edits/deletion. |
| Close/reopen without losing data | Actual browser close/relaunch using the identical test-owned persistent profile and origin; exact record equality including all personal fields. |
| Complete locally without critical errors | Two clean 27-case production browser runs, two live journeys, operator review, 102 unit tests and successful typecheck/build. No known critical workflow defects remain. |

## Operator visual and keyboard review

Reviewed production screenshots on 2026-10-13 for Dashboard, Library, Discover,
known/unknown-total Details, missing Details and unknown routes. Browser layout
checks captured all of these at 320, 768 and 1280px; narrow and desktop screenshots
were inspected directly, including deliberately long unbroken titles and
multiple authors. Controls fit the viewport; text wraps instead of clipping.

A separate isolated operator-driven browser session used the real API: initial
Tab reached the skip link, keyboard navigation opened Discover, title search
previewed Dune, adding saved once, author search worked, local author search and
status/rating ordering located the saved record, and Details accepted total
correction, reading status, 120/400 progress, rating and multiline inert note.
The session edited/cleared personal data, completed the book, checked all four
statistics, cancelled then confirmed removal, and returned to an empty library.
Reviewed preview, form and native-modal focus screenshots at 320px and desktop.
The surviving status control receives focus after final-page completion;
cancelled removal returns to its trigger. Loading/empty/error/retry states were
also reviewed with isolated controlled requests/storage reads. Review artifacts
are local temporary files under `/tmp/page-trail-review`, not release assets.

Resolved findings: initial navigation focus skipped the skip link; preview lacked
its own cover and deliberate focus/return; native dialog Tab could escape its
button cycle; final-page completion removed the focused form; and an add's
pending label could be superseded by an incoming saved subscription. Browser
regressions now exercise these behaviors.

Calculated contrast from the actual CSS tokens using sRGB relative luminance:
body ink/paper 12.53:1, muted text/paper 6.10:1, muted text/surface 6.53:1,
green links/focus on paper 6.56:1, white button text/green 7.13:1, and status
ink/soft-green 11.39:1. Active navigation uses bold/underline plus `aria-current`;
status/progress use text and native semantics. This is a scoped visual/keyboard
review, not a claim of full accessibility conformance or screen-reader coverage.

## Open Library access and usage

Reviewed the current [Search API documentation](https://openlibrary.org/dev/docs/api/search)
and [API usage guidelines](https://openlibrary.org/developers/api) on 2026-10-13.
Real browser title and author requests completed on the production-preview
origin; no CORS/access blocker was observed and no backend was introduced.

Discovery is explicit, human-triggered and requests only `key`, `title`,
`author_name`, `cover_i`, `number_of_pages_median`, with limit 20. The service has a
10-second timeout including its per-tab queue, cancels superseded work, and
paces starts at least one second apart. Fetch uses ordinary browser HTTP cache
behavior. It never submits the library, status, pages, rating, or note.

Open Library documents a default 1-request/second limit and a higher identified
limit, asks applications to identify themselves with contact information and
register, and discourages bulk harvesting. This browser-only local MVP uses the
default anonymous browser requests; it does not claim an identified allowance,
set a fictitious operator contact, or coordinate limits across browser tabs/IPs.
Application registration/contact and stronger cross-tab/shared rate coordination
remain operator considerations before a public/high-volume deployment. External
API/cover availability can change and live checks can fail independently of
local storage workflows. No deployment or registration was performed.

## Storage boundaries and remaining limitations

Saved books and personal fields live in IndexedDB database `page-trail`, schema
version 1, table `books`. Browser profile and the complete origin (scheme,
hostname, port) own the data. `http://localhost:5173`,
`http://127.0.0.1:5173`, and `http://127.0.0.1:4173` are distinct libraries.
Reopen the identical origin/profile; no automatic development-to-preview transfer
exists. Normal closing/reopening retains records. Clearing site data, deleting
the profile, browser storage eviction, or ending a private session can remove them.

There is no account, synchronization, export/import, or cloud backup. Notes are
private because the application does not publish/send them; anyone with access
to the same profile can read them, and browser storage is not an encrypted vault.
Covers are external resources with a local fallback. Discovery failure leaves
already-loaded local workflows available; guaranteed offline application launch
is not implemented. The local MVP remains subject to API availability, browser
storage availability and these documented boundaries.

No known critical workflow defects remain after this review. Full accessibility
conformance, exhaustive browser/device coverage, and deployment are not claimed.
