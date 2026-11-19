# Test Infrastructure & Automated E2E Test Suite

## Overview
This document specifies the end-to-end (E2E) testing infrastructure for the **Folio Interactive Digital Book & Presentation** project (`folio-interactive-book`), dedicated to the historical monograph on Konstantin Georgiev Fotinov (ок. 1785 – 1858).

The test suite provides an **opaque-box, requirement-driven, multi-tier validation harness** designed to guarantee strict adherence to data schemas, visual layout boundaries, media integrity, cross-persistence synchronization, and Next.js production compilability.

---

## 1. Test Architecture & Runner Design

The primary test harness is implemented in TypeScript and executed via `tsx` (ESM native TypeScript execution runner):
- **Runner Path**: `scripts/e2e-book-validator.ts`
- **Execution Script**: `npm test` or `npx tsx scripts/e2e-book-validator.ts`
- **Quick Mode (Bypassing Next.js build)**: `npm run test:quick` or `npx tsx scripts/e2e-book-validator.ts --skip-build`
- **Single Tier Execution**: `npx tsx scripts/e2e-book-validator.ts --tier=<1|2|3|4>`
- **Verbose Output**: `npx tsx scripts/e2e-book-validator.ts --verbose`

### Execution Matrix
| Command | Tiers Executed | Execution Time | Use Case |
|---------|---------------|----------------|----------|
| `npm test` | Tiers 1, 2, 3, 4 | ~15–25s | Pre-commit, CI/CD, Final Gate |
| `npm run test:quick` | Tiers 1, 2, 3 | ~1s | Fast local feedback during editing |
| `npx tsx scripts/e2e-book-validator.ts --tier=1` | Tier 1 only | <500ms | Data schema and sync check |
| `npx tsx scripts/e2e-book-validator.ts --tier=2` | Tier 2 only | <500ms | Layout, block count & character checks |
| `npx tsx scripts/e2e-book-validator.ts --tier=3` | Tier 3 only | <500ms | Companion text & cold-start simulation |
| `npx tsx scripts/e2e-book-validator.ts --tier=4` | Tier 4 only | ~15–20s | Production build & routing check |

---

## 2. Tier Breakdown & Test Coverage

### Tier 1: Feature Coverage (Core Data & Contract Integrity)
1. **T1.1-CHAPTER-SCHEMA**:
   - Validates that every chapter in `data/book-db.json` strictly conforms to the `Chapter` interface defined in `src/types/book.ts`.
   - Validates unique chapter IDs and slugs (format: `^[a-z0-9-]+$`).
   - Ensures sequential, positive `order` numbering and valid `status` (`"published" | "draft"`).
2. **T1.2-BLOCK-SCHEMA**:
   - Validates that every block in every chapter conforms to `BookBlock`.
   - Enforces unique block IDs across the entire monograph.
   - Enforces valid `BlockType` (`"paragraph"`, `"heading"`, `"image"`, `"media"`, `"choice"`, `"collapsible"`, `"quote"`, `"code"`, `"footnote"`).
   - Validates `content` string type and valid `pageSide` (`"left" | "right"`).
3. **T1.3-MEDIA-SCHEMA**:
   - Validates all media metadata in `db.media` conforming to `MediaItem`.
   - Enforces unique IDs, unique filenames, valid URLs starting with `/uploads/`, positive byte sizes (`size > 0`), and valid MIME types (`image/jpeg`, `image/png`, `image/svg+xml`, etc.).
4. **T1.4-BLOCK-MEDIA-EXISTS**:
   - Traverses every `BookBlock.mediaUrl` across all chapters.
   - Verifies the referenced asset physically exists on the filesystem in `public/uploads/` and has a file size > 0 bytes.
5. **T1.5-DB-MEDIA-EXISTS**:
   - Traverses every registered item in `db.media`.
   - Verifies the referenced asset physically exists in `public/uploads/` with size > 0 bytes.
6. **T1.6-AUTHORSHIP-PRESERVED**:
   - Enforces immutable preservation of the monograph authors: `"Стоян Калчев и Константин Караниколов"`.
   - Verified synchronously in both `data/book-db.json` and `src/lib/db.ts` (`INITIAL_SEED.bookAuthor`).
7. **T1.7-AUTH-GATE-PRESERVED**:
   - Validates `src/components/AdminAuthGate.tsx`.
   - Verifies admin credentials (`ItzKTN`, `tqncho`, passwords `Q@a201020`, `23323223a`) and storage key `fotinov_admin_authenticated_v1`.
8. **T1.8-DUAL-SYNC**:
   - Performs deep synchronization comparison between `data/book-db.json` and `INITIAL_SEED` in `src/lib/db.ts`.
   - Checks matching chapter counts, identical chapter slugs, orders, block counts, block IDs, media URLs, and media metadata.

### Tier 2: Boundary & Corner Cases (Visual Constraints & Layout Physics)
1. **T2.1-BLOCK-COUNT-LIMIT**:
   - Enforces that no chapter contains more than 3 blocks (`blocks.length <= 3`, `blocks.length >= 1`).
   - Guarantees presentation mode readability without crowding.
2. **T2.2-TEXT-CHAR-LIMIT**:
   - Enforces cumulative visible text per presentation slide <= 650 characters (plain text after stripping HTML tags, combining block content, captions, and quotes).
3. **T2.3-PRESENTATION-HEIGHT**:
   - Mathematical model simulating presentation viewport height at standard 1080p resolution.
   - Verifies that estimated cumulative slide height remains strictly below 95% of screen height (`< 95%`), guaranteeing zero vertical scrollbars in Presentation Mode.
4. **T2.4-IMAGE-CONFIG**:
   - Validates explicit configuration of all image blocks:
     - `imageLayout`: `"center" | "full-page" | "float-left" | "float-right"`
     - `imageSize`: `"small" | "medium" | "large" | "full"`
     - `imageCrop`: `"contain" | "portrait" | "square" | "landscape" | "wide"`
     - `imageFocus`: `"center" | "top" | "bottom" | "left" | "right"`
   - For all portraits and busts (human subjects: Fotinov, Zaberski, Fotev, Kalachev, Mara Georgieva), enforces `imageFocus: "top"` to prevent facial cropping.
5. **T2.5-TEXTBOOK-PAGESIDE-BALANCE**:
   - Enforces balanced two-page textbook layout:
     - Every block must have an explicit `pageSide` (`"left"` or `"right"`).
     - Left page takes strictly 1 block.
     - Right page takes 1 to 2 blocks.

### Tier 3: Cross-Feature Combinations (Interactions & Cold Start)
1. **T3.1-FLOAT-LAYOUT-COMPANION**:
   - Verifies that whenever an image uses `imageLayout: "float-left"` or `"float-right"`, substantial companion narrative text (>= 40 plain characters) is present either inline in `block.content` or in an adjacent paragraph block.
2. **T3.2-SEED-RESET-SIMULATION**:
   - Tests cold-start fallback resilience: simulates reading or resetting from `INITIAL_SEED` in `src/lib/db.ts` to ensure the application starts with complete chapter data even in absence of local persistent storage.

### Tier 4: Real-World Scenarios & Compilation
1. **T4.1-NEXT-BUILD**:
   - Executes `npm run build` (`next build`) in a clean child process.
   - Verifies 0 TypeScript type errors, 0 ESLint fatal errors, successful page data collection, and static page generation with exit code 0.
2. **T4.2-APP-ROUTER-ROUTES**:
   - Verifies presence and structural integrity of critical App Router pages and API routes:
     - `/` (Home / Reader)
     - `/[slug]` (Chapter Reader)
     - `/edit` (Monograph Editor)
     - `/data` (Raw JSON Data Inspector)
     - `/api/chapters` (Chapter REST API)
     - `/api/media` (Media REST API)

---

## 3. Adversarial Edge Case Verification

The test harness incorporates adversarial assertions against common failure modes:
1. **HTML Stripping & Character Counting**: Uses strict regular expressions to peel away `<p>`, `<strong>`, `<em>`, `<span>`, `<br>` and HTML entities before measuring textual density, avoiding false passes from markup inflation.
2. **Duplicate Asset & ID Detection**: Tracks every chapter ID, chapter slug, block ID, and media filename in hash sets to detect collisions before database mutations occur.
3. **Empty File / Broken Asset Detection**: Beyond checking `fs.existsSync`, inspects `fs.statSync().size > 0` to catch corrupted 0-byte uploaded images.
4. **Portrait Facial Crop Prevention**: Uses multi-token heuristic inspection (`портрет`, `portrait`, `бюст`, `bust`, `zaberski`, `fotev`, `kalachev`, `mara-georgieva`, `fotinov-portrait`) to mandate `imageFocus: "top"`.

---

## 4. Exit Code & Reporting Convention

- **Exit Code 0**: All executed tests passed cleanly.
- **Exit Code 1**: One or more tests failed. Full failure diagnostics, chapter slugs, block IDs, and character counts are output to `stdout`/`stderr`.
