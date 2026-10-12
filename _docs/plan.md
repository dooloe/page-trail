# PageTrail — MVP Product Scope

**Product idea:** PageTrail is a personal reading tracker and digital bookshelf that helps users discover books, organize their reading lists, track their progress, and record their thoughts.

**Main goal:** Make it easy to manage personal reading activities in one cozy, organized space.

## 1. Core Features

### 1.1 Book Discovery

Users can search for books online and add them to their personal library.

**How it works:**
- Enter a book title in the search bar.
- View matching books with their covers, titles, and authors.
- Select a book to see additional information.
- Click **Add to Library** to save it.

**Decisions:**
- Allow searching by **title and author**, rather than title only.
- Display basic book information automatically so users don't need to enter everything manually.
- Prevent adding the same book twice.

**Why:** Book discovery should be quick and convenient, not feel like filling out a form.

### 1.2 Personal Bookshelf

Users can view and organize all their saved books in one place.

**How it works:**
- Books appear as visual cards with their covers and titles.
- Users can search within their own library.
- Filter books by reading status.
- Sort books by title or rating.
- Remove books they no longer want to track.

**Decision — Three reading statuses:**

| Status | Meaning |
|---|---|
| **Want to Read** | Books saved for future reading |
| **Currently Reading** | Books started but not finished |
| **Finished** | Completed books |

Newly added books automatically receive **Want to Read** status.

**Why:** Three statuses are sufficient to organize a personal library without introducing unnecessary complexity.

### 1.3 Reading Progress

Users can track how much of a book they have read.

**How it works:**
- Select a book marked **Currently Reading**.
- Enter the current page number.
- PageTrail calculates the completion percentage.
- A visual progress bar displays the result.

**Example:** Page 120 of 400 = **30% completed**.

**Decisions:**
- Use page-based tracking instead of reading-time tracking.
- Allow users to correct a book's total page count.
- Automatically mark a book as **Finished** when progress reaches 100%.
- Allow users to manually change reading status.

**Why:** Page tracking is straightforward, measurable, and doesn't require timers or reading sessions.

### 1.4 Ratings and Personal Notes

Users can evaluate books and save their thoughts.

**How it works:**
- Give any saved book a rating from **1 to 5 stars**.
- Write a personal note or short review.
- Return later to edit or delete the rating or note.

**Decisions:**
- Ratings and notes are optional.
- Allow **one editable note per book**.
- Keep notes private.
- Allow ratings even if the book is not yet finished.

**Why:** Some readers want to record their thoughts while still reading. Keeping everything in one note is simpler than building a full reading journal.

### 1.5 Reading Dashboard

A simple overview of the user's reading activity.

**Example statistics (illustrative only):**

| Statistic | Example |
|---|---:|
| Total books | 24 |
| Finished | 12 |
| Currently reading | 3 |
| Average rating | 4.2 ★ |

**Decisions:**
- Show four statistics: **total books**, **finished books**, **currently reading**, and **average rating**.
- Calculate average rating only from books that have ratings.
- Avoid reading streaks, monthly charts, and reading goals in the MVP.

**Why:** The dashboard should give an immediate overview without requiring users to track additional information.

## 2. Application Pages

PageTrail will have four main pages.

| Page | Purpose |
|---|---|
| **Dashboard** | Overview of reading statistics |
| **My Library** | Browse, search, filter, and organize saved books |
| **Discover Books** | Search online and add new books |
| **Book Details** | View book information, update progress, rating, and notes |

**Decision:** Book Details opens when a user selects a book from their library. Separate pages for notes, ratings, and progress are unnecessary.

**Why:** Keeping related actions together makes the experience simpler and more intuitive.

## 3. User Journey

1. **Discover a book** — Search for a title or author.
2. **Add to library** — Save the book under **Want to Read**.
3. **Start reading** — Change its status to **Currently Reading**.
4. **Track progress** — Update the current page whenever desired.
5. **Record thoughts** — Add a rating and personal note.
6. **Finish the book** — Mark it as completed.
7. **Review reading activity** — See updated statistics on the dashboard.

## 4. Visual Design

**Design direction: Cozy digital bookshelf.**

**Decisions:**
- Warm cream, beige, soft brown, and muted green colors.
- Book covers as the main visual elements.
- Card-based bookshelf layout.
- Simple navigation and readable typography.
- Responsive layout for desktop and mobile browsers.
- Friendly empty states, such as *“Your bookshelf is empty. Discover your first book!”*

**Why:** The design should feel like a personal reading space rather than a complicated management tool.

## 5. Additional Product Rules

| Situation | Expected behavior |
|---|---|
| Book already saved | Show **Already in Library** instead of adding a duplicate |
| Book cover unavailable | Display a default book cover |
| Total pages unavailable | Allow the user to enter the page count |
| No books match a filter | Display a friendly empty-state message |
| User removes a book | Ask for confirmation before deleting its saved information |
| Online search unavailable | Show a helpful error; existing saved books remain accessible |
| User closes the application | Saved books, progress, ratings, and notes remain available |

## 6. Out of Scope for the MVP

The following features are **not** part of the initial version:

- User registration and login
- Social features (friends, public reviews, following users)
- AI book recommendations
- Custom collections and tags
- Reading challenges, goals, and streaks
- Reading timers and session history
- Advanced statistics and charts
- Book purchasing or ebook reading
- Multiple notes or quote collections per book

These are possible future improvements, not requirements for the first version.

## 7. MVP Completion Criteria

The MVP is complete when a user can:

1. Discover and save books.
2. Find, filter, sort, and remove books in their library.
3. Change reading status and track page-based progress.
4. Add and edit ratings and personal notes.
5. View accurate basic reading statistics.
6. Close and reopen the application without losing saved information.
7. Complete these workflows without critical errors during local testing.

**Release decision:** Build and test PageTrail locally first, then deploy after tests and necessary fixes. Deployment is not part of the initial MVP build.

---

## Final Product Decision

**PageTrail will be a cozy, single-user digital bookshelf focused on three essential activities: organizing books, tracking reading progress, and remembering personal thoughts about reading.**

The MVP includes **five core feature groups**, **four pages**, and a straightforward reading workflow.

**Rationale:** The scope is meaningful enough to deliver a useful product while staying manageable for a beginner. More advanced features can be considered after the first working version.
