# GitHub issue completion audit — 2026-10-13

**Historical audit:** This records the state before the user requested implementation
of all remaining issues. The later [MVP handoff](./mvp-handoff.md) and
[final verification entry](./verification.md) supersede the gaps below with
implemented fixes and executed acceptance evidence.

Reviewed all 27 issues in `dooloe/page-trail`, including closed issue #1.
All currently carry `mvp`. Reviewed each issue's scope, acceptance criteria,
prerequisites, and verification instructions against the current local worktree
and actual test coverage. Code presence and a passing general suite alone do
not prove every issue complete. This audit does not implement missing features
or expand test coverage to manufacture additional completions.

Fresh checks during the audit:

- `npm test`: 96 tests passed in fifteen files.
- `npm run build`: TypeScript and production build passed.
- Production browser suite: one Chromium test passed, using the environment's
  downloaded browser and locally extracted libraries as recorded in
  [verification.md](./verification.md).

Implementation evidence is in the local worktree, including uncommitted files;
this audit does not assert that it has been committed or published to GitHub.

## Fully verified issues eligible for closure

### #2 — Book model and creation defaults

All four acceptance criteria are supported by `src/domain/book.ts` and
`src/domain/book.test.ts`: the complete architecture fields and three-status
union; nullable optional metadata and empty authors; a separate discovery type
without personal fields; unique local IDs, equal initial timestamps, creation
defaults, copied metadata, and an independent authors array. Creation tests and
the full TypeScript/build checks pass. Prerequisite #1 was already completed.

### #3 — Local database and basic repository

All five acceptance criteria are supported by `src/data/database.ts`,
`src/data/libraryRepository.ts`, and its IndexedDB-backed tests. The versioned
schema has local IDs, unique source/work identities, and a status index.
Tests verify add/get/list/delete, metadata/defaults, reopening the database,
missing records, harmless absent deletes, concurrent duplicates, preservation
of the existing record, and explicit storage failures. The add resolves after
the write. Repository reads are local. Canonical work identities are supplied
by the verified normalizer, so edition metadata does not change identity.
Tests delete their isolated databases. Dexie and fake-indexeddb were approved,
and both manifest and lockfile include them. Prerequisite #2 is verified.

### #4 — Validated updates

All seven acceptance criteria are supported by `src/domain/updateBook.ts`, its
tests, and repository tests. These cover the three statuses and manual changes
at 100%; completion with unknown totals; finite integer page bounds; standalone
progress gating; joint corrections in all statuses; atomic automatic completion;
rejection of combined status/page edits; ratings and plain-text notes with
clearing; immutability and preservation of unrelated fields; validation/missing
record failures without writes; rollback after failed persistence; timestamps;
and concurrent updates through separate database connections. The repository
reads the latest record and writes inside one read/write transaction. Ratings
and notes have no status restriction and do not trigger page completion.
Prerequisites #2/#3 are verified. The issue explicitly requires no browser check.

### #5 — Reactive library reads

All three acceptance criteria are supported by `src/data/useLibrary.ts`,
`src/data/useLibrary.test.tsx`, and the local repository. Tests exercise loading,
empty/success, missing/deleted records, storage errors, changed IDs without old
data, and committed add/update/delete subscription refreshes. Reads make no
Open Library request. The installed dexie-react-hooks implementation returns
the observable unsubscribe function from its React effect, confirming unmount
cleanup; test cleanup unmounts hooks before deleting the isolated databases.
The dependency was approved and recorded in both package files. Prerequisites
#3/#4 are verified.

### #9 — Open Library normalization

All four acceptance criteria are supported by `src/services/normalizeBook.ts`
and its tests. Work paths and bare work IDs produce documented bare `OL…W`
identities; editions and unusable identities/titles are rejected. Authors,
cover references, and page estimates have safe defaults and validation.
Valid covers use HTTPS; malformed optional metadata does not crash the module.
Frozen fixtures prove input preservation; exact result assertions exclude
personal fields. Fixtures cover complete/incomplete metadata, mixed authors,
invalid identities, and invalid cover/page values. Prerequisite #2 is verified.

## Issues that remain open

Each row identifies outstanding implementation or verification sufficient to
prevent closure; it is not an exhaustive replacement for the original issue.

| Issue | Remaining acceptance or verification gap |
|---|---|
| #6 — Shell and routes | Keyboard navigation, unknown routes, and browser back/forward have not been verified. The existing browser test covers main navigation and a detail reload only. |
| #7 — Visual foundation | Required narrow/desktop, contrast, visible keyboard focus, and active-navigation review has not been recorded. A desktop dashboard screenshot alone is insufficient. |
| #8 — Cards and covers | Unit fallback and metadata tests pass; long-title/multiple-author readability in a narrow grid and keyboard interactions remain unverified. |
| #10 — Search service | Real browser API access and applicable application-identification/usage requirements remain unverified. Mocked Fetch and paced requests do not prove live access. |
| #11 — Discovery interface | Manual labels/keyboard submission and navigation during failed or pending discovery are unverified; the live-service prerequisite #10 is incomplete. |
| #12 — Preview and saving | The inline preview region does not render a cover; covers appear on result cards outside it. Required keyboard preview interaction remains unverified. |
| #13 — Saved library | Narrow-width and keyboard usability remain unverified; browser coverage does not verify the rendered library after reactive update/delete. |
| #14 — Library controls | Labeled keyboard controls and reactive updated/removed records under active controls remain unverified. Unit sorting/filtering and no-match recovery tests do not cover the complete subscribed workflow. |
| #15 — Saved details | Required narrow keyboard review and the full loading/error/incomplete/deleted/changed-ID view matrix remain unverified. The browser test proves populated details and reload persistence only. |
| #16 — Manual status | All persisted UI transitions, unknown totals, status-only changes at 100%, failure/retry, and keyboard use remain unverified as an integrated feature. Domain rules are proven separately in #4. |
| #17 — Page-count correction | UI corrections across all statuses, automatic completion from corrected totals, and persisted correction after reload remain unverified. Existing component tests cover only part of the required matrix. |
| #18 — Reading progress | Integrated final-page completion, rejected-input draft retention, failed-progress retry, and faithful manual-Finished displays remain unverified. The browser test verifies an intermediate 30% save/reload. |
| #19 — Ratings | Ratings 1–5 and change/clear across statuses, failed-rating retry, keyboard use, and persisted clearing remain unverified. The browser test saves/reloads rating 4. |
| #20 — Private note | Integrated edit/clear, multiline content across statuses, keyboard use, and inspection of discovery requests after personal edits remain unverified. Component retry/inert-text and browser save/reload cover only part of the scope. |
| #21 — Confirmed removal | Browser cancellation/confirmation from both entry points, modal focus containment/Escape/restoration, subscribed refresh, and complete persisted deletion remain unverified. jsdom tests explicitly mock native modal behavior. |
| #22 — Dashboard | Required average-rounding edge-case unit coverage is absent. Integrated subscribed rating-clear/delete refreshes remain unverified; current page tests use supplied prop changes and the browser test saves one rating. |
| #23 — Browser harness | The harness works, but the required author-mode discovery/save test is absent, and saved creation defaults are not fully asserted. A working title-mode journey is insufficient for this issue. |
| #24 — Integrated workflows | The browser suite lacks organization/filter/sort/no-match scenarios, joint corrections/completion, rating/note edits and clears, and cancel/confirm removal with all statistics. |
| #25 — Persistence and recovery | No genuine persistent-profile close/relaunch test or controlled discovery/storage fault browser matrix exists. Reload alone does not meet the requirement. |
| #26 — Responsive/accessibility review | The required all-route 320px/desktop, keyboard, modal-focus, contrast, and loading/empty/error-state review has not been completed or recorded. |
| #27 — Final local MVP handoff | Implementation and verification prerequisites remain open; the real-API journey, reopening/recovery, mobile/keyboard review, and seven-criterion completion audit are incomplete. |

Issue #1 remains closed; later adaptation of its original placeholder smoke
test to the actual application does not reopen the completed scaffold task.
Closed #2, #3, #4, #5, and #9 on GitHub with reason `completed` after this audit.
A fresh all-state issue query confirmed exactly #1, #2, #3, #4, #5, and #9 are
closed and the other 21 issues remain open. All MVP labels remain intact.
