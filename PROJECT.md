# Project: Интегриране на ново историческо съдържание и архивни материали за Константин Фотинов

## Architecture
- **Framework**: Next.js 14 (App Router) + TypeScript (strict) + Tailwind CSS
- **Data Persistence**: Single-file JSON database at `data/book-db.json` with fallback/cold-start seeding from `INITIAL_SEED` in `src/lib/db.ts`
- **Asset Storage**: Static media assets in `public/uploads/` served at `/uploads/<filename>`
- **Rendering Modes**:
  - **Presentation Mode**: Viewport-constrained (`h-[100dvh]`), 1 chapter per slide, target screen height < 95%, 2–3 blocks max, zero vertical scrollbar
  - **Textbook Mode**: Two-page spread (`left` / `right` pages) split via `getTextbookSplit(targetCh)` using explicit `block.pageSide`
- **Authentication**: `AdminAuthGate.tsx` protecting `/edit` and `/data` routes via `sessionStorage` / `localStorage` (`fotinov_admin_authenticated_v1`)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | F1: Media Asset Curation & Migration | Копиране и организиране на висококачествените изображения (`IMG-...` и `ppt/media`) в `public/uploads/` с описателни kebab-case имена | M1 | Survey (R2) |
| 2 | F2: Media Metadata Registration | Регистриране на всички медийни ресурси в `media` списъка на базата с коректни MIME типове, размери и категории | M1 | Survey (R2) |
| 3 | F3: Archival Image Replacement in Slides 1–9 | Замяна на плейсхолдърните SVG файлове в съществуващите глави 1–9 с автентични архивни фотографии и обогатяване на фактологията | M2 | Survey (R1, R3) |
| 4 | F4: New Chapter X: Art & Iconography | Нова глава/слайд за портретите (Заберски, Фотев, Калъчев) и скулптурния бюст (проф. Мара Георгиева) | M2 | Survey (R1, R3) |
| 5 | F5: New Chapter XI: Literary & School Memory | Нова глава/слайд за литературната памет: поема от Борис Бухчев, химн на гимназията, Иван Вазов, плоча в Измир | M2 | Survey (R1, R3) |
| 6 | F6: New Chapter XII: Memorial Topography & Nature | Нова глава/слайд за мемориалната география (Самоков, София, Родопи: Фотински водопади и скален комплекс „Костенурките“) | M2 | Survey (R1, R3) |
| 7 | F7: Presentation Layout & No-Scroll Guarantee | Спазване на максимум 2–3 блока на слайд, общ текст ≤650 символа, височина <95% от екрана, нулев вертикален скрол | M2 | Survey (R3) |
| 8 | F8: Balanced Textbook Two-Page Spread | Задаване на експлицитен `pageSide: "left" \| "right"` за всеки блок за идеален баланс на лява и дясна страница | M2 | Survey (R3) |
| 9 | F9: Dual Synchronization of Database & Seed | Едновременно обновяване на `data/book-db.json` и `INITIAL_SEED` в `src/lib/db.ts` за предотвратяване на десинхронизация | M2 | Survey (R4) |
| 10 | F10: Authorship & Auth Preservation | Непокътнато запазване на авторите „Стоян Калчев и Константин Караниколов“ и входните данни в `AdminAuthGate.tsx` | M2 | Survey (R4) |
| 11 | F11: Programmatic Verification & Compilation | Успешна компилация `npm run build` без TypeScript или Next.js грешки, 100% валидни HTTP 200 медийни линкове | M3 | Survey (AC) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Media Asset Pipeline | Обработка, филтриране и копиране на подбраните медийни файлове в `public/uploads/` с проверка на размери и ориентация | none | DONE |
| M2 | Synchronized Content & Chapter Integration | Структуриране на глави 1–12, дизайн на блоковете (2–3 на слайд, float layout, pageSide), едновременно записване в `data/book-db.json` и `src/lib/db.ts` | M1 | DONE |
| M3 | E2E Testing & Verification Gate | Пълен набор от автоматизирани E2E тестове (Tiers 1–4), проверка на нулев скрол, компилация `npm run build`, одитен преглед | M2 | DONE |

## Interface Contracts
### Media ↔ Chapters (`src/types/book.ts`)
- `BookBlock.mediaUrl`: абсолютен или релативен път към файл в `public/uploads/` (напр. `"/uploads/samokov-convent-pokrov.jpg"`).
- `BookBlock.imageLayout`: `"float-left"` | `"float-right"` | `"center"` | `"full-page"`. Когато има съпътстващ текст в `content`, се използва flex обтичане.
- `BookBlock.imageCrop`: `"portrait"` (за портрети), `"landscape"` (за фасади и природа), `"square"`, `"wide"`, `"contain"`.
- `BookBlock.imageFocus`: `"top"` (задължително при портрети за избягване на отрязване на лицето) | `"center"`.
- `BookBlock.pageSide`: `"left"` | `"right"`.

### Database Schema Sync Contract
- `data/book-db.json` и `INITIAL_SEED` в `src/lib/db.ts` съдържат точно същите глави (`chapters`), блокове (`blocks`) и медийни обекти (`media`).
- `bookAuthor`: `"Стоян Калчев и Константин Караниколов"`.

## Code Layout
- `public/uploads/`: Физически файлове на изображенията
- `data/book-db.json`: JSON база данни
- `src/lib/db.ts`: Драйвер на базата данни и `INITIAL_SEED`
- `src/types/book.ts`: TypeScript дефиниции на типовете
- `src/components/AdminAuthGate.tsx`: Потребителски вход и пароли
- `src/components/InteractiveReader.tsx`: Рендеринг на слайдовете и учебника

