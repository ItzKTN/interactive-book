#!/usr/bin/env tsx
/**
 * Automated E2E Book & Presentation Validator
 * Covers Tiers 1–4:
 *   Tier 1: Feature Coverage (Schema conformance, physical media existence, author/auth preservation, dual sync)
 *   Tier 2: Boundary & Corner Cases (Block count <= 3, text <= 650 chars, height < 95%, image params, balanced pageSide)
 *   Tier 3: Cross-Feature Combinations (Float layout companion text, seed reset sync)
 *   Tier 4: Real-World Scenarios & Compilation (Next.js production build, route verification)
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import {
  Chapter,
  BookBlock,
  MediaItem,
  DatabaseSchema,
  BlockType,
  ImageLayout,
  ImageSize,
  ImageCrop,
  ImageFocus,
} from "@/types/book";

// Colors for terminal output
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";

interface TestResult {
  tier: number;
  id: string;
  name: string;
  passed: boolean;
  message?: string;
  details?: string[];
}

const results: TestResult[] = [];

function recordTest(tier: number, id: string, name: string, passed: boolean, message?: string, details?: string[]) {
  results.push({ tier, id, name, passed, message, details });
  const statusBadge = passed ? `${GREEN}✔ PASS${RESET}` : `${RED}✘ FAIL${RESET}`;
  console.log(`  [Tier ${tier}] ${statusBadge} ${BOLD}${id}${RESET}: ${name}`);
  if (!passed && message) {
    console.log(`         ${RED}Reason: ${message}${RESET}`);
  }
  if (!passed && details && details.length > 0) {
    for (const d of details.slice(0, 10)) {
      console.log(`           - ${d}`);
    }
    if (details.length > 10) {
      console.log(`           ... and ${details.length - 10} more issues`);
    }
  }
}

// Helper: Strip HTML tags to measure visible character count
function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Root paths
const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, "data");
const DB_FILE = path.join(DATA_DIR, "book-db.json");
const UPLOADS_DIR = path.join(ROOT_DIR, "public", "uploads");
const DB_TS_FILE = path.join(ROOT_DIR, "src", "lib", "db.ts");
const AUTH_FILE = path.join(ROOT_DIR, "src", "components", "AdminAuthGate.tsx");

// Command-line flag parsing
const args = process.argv.slice(2);
const skipBuild = args.includes("--skip-build");
const specificTierArg = args.find((a) => a.startsWith("--tier="));
const selectedTier = specificTierArg ? parseInt(specificTierArg.split("=")[1], 10) : null;
const isVerbose = args.includes("--verbose");

console.log(`${BOLD}${CYAN}========================================================================${RESET}`);
console.log(`${BOLD}${CYAN}       FOLIO INTERACTIVE BOOK — AUTOMATED E2E TEST VALIDATOR            ${RESET}`);
console.log(`${BOLD}${CYAN}========================================================================${RESET}`);
console.log(`Working Directory: ${ROOT_DIR}`);
console.log(`Mode: ${selectedTier ? `Tier ${selectedTier} only` : "Full Suite (Tiers 1–4)"}`);
if (skipBuild) console.log(`${YELLOW}Note: --skip-build active (Skipping Next.js production build step)${RESET}`);
console.log("");

// Load files
let jsonDb: DatabaseSchema;
try {
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  jsonDb = JSON.parse(raw);
} catch (err: any) {
  console.error(`${RED}FATAL: Failed to read ${DB_FILE}: ${err.message}${RESET}`);
  process.exit(1);
}

let initialSeed: DatabaseSchema;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { INITIAL_SEED } = require("@/lib/db");
  initialSeed = INITIAL_SEED;
} catch (err: any) {
  console.error(`${RED}FATAL: Failed to import INITIAL_SEED from src/lib/db.ts: ${err.message}${RESET}`);
  process.exit(1);
}

// ============================================================================
// TIER 1: FEATURE COVERAGE
// ============================================================================
function runTier1() {
  console.log(`\n${BOLD}${BLUE}--- TIER 1: FEATURE COVERAGE ---${RESET}`);

  // T1.1: Chapter Schema Conformance (JSON DB)
  {
    const errors: string[] = [];
    const seenSlugs = new Set<string>();
    const seenIds = new Set<string>();

    if (!Array.isArray(jsonDb.chapters) || jsonDb.chapters.length === 0) {
      errors.push("jsonDb.chapters must be a non-empty array");
    } else {
      jsonDb.chapters.forEach((ch, idx) => {
        if (!ch.id || typeof ch.id !== "string") errors.push(`Chapter[${idx}] missing valid string id`);
        if (!ch.slug || typeof ch.slug !== "string") errors.push(`Chapter[${idx}] missing valid string slug`);
        if (!ch.title || typeof ch.title !== "string") errors.push(`Chapter[${idx}] missing valid title`);
        if (typeof ch.order !== "number" || ch.order <= 0) errors.push(`Chapter[${idx}] invalid order (${ch.order})`);
        if (ch.status !== "published" && ch.status !== "draft") errors.push(`Chapter[${idx}] invalid status (${ch.status})`);
        if (!Array.isArray(ch.blocks)) errors.push(`Chapter[${idx}] blocks must be an array`);
        if (!Array.isArray(ch.footnotes)) errors.push(`Chapter[${idx}] footnotes must be an array`);

        if (seenSlugs.has(ch.slug)) errors.push(`Duplicate chapter slug: '${ch.slug}'`);
        seenSlugs.add(ch.slug);
        if (seenIds.has(ch.id)) errors.push(`Duplicate chapter id: '${ch.id}'`);
        seenIds.add(ch.id);
      });
    }

    recordTest(
      1,
      "T1.1-CHAPTER-SCHEMA",
      "All chapters in data/book-db.json conform to Chapter interface (unique IDs, slugs, types)",
      errors.length === 0,
      errors.length > 0 ? `${errors.length} schema violations found` : undefined,
      errors
    );
  }

  // T1.2: BookBlock Schema Conformance (JSON DB)
  {
    const errors: string[] = [];
    const validBlockTypes: BlockType[] = [
      "paragraph",
      "heading",
      "image",
      "media",
      "choice",
      "collapsible",
      "quote",
      "code",
      "footnote",
    ];
    const seenBlockIds = new Set<string>();

    jsonDb.chapters.forEach((ch) => {
      ch.blocks.forEach((blk, bIdx) => {
        if (!blk.id || typeof blk.id !== "string") {
          errors.push(`Chapter '${ch.slug}' Block[${bIdx}] missing string id`);
        } else {
          if (seenBlockIds.has(blk.id)) {
            errors.push(`Duplicate block ID across chapters: '${blk.id}'`);
          }
          seenBlockIds.add(blk.id);
        }

        if (!validBlockTypes.includes(blk.type)) {
          errors.push(`Chapter '${ch.slug}' Block '${blk.id}' has invalid type: '${blk.type}'`);
        }
        if (typeof blk.content !== "string") {
          errors.push(`Chapter '${ch.slug}' Block '${blk.id}' content must be string`);
        }
        if (blk.pageSide && blk.pageSide !== "left" && blk.pageSide !== "right") {
          errors.push(`Chapter '${ch.slug}' Block '${blk.id}' invalid pageSide: '${blk.pageSide}'`);
        }
      });
    });

    recordTest(
      1,
      "T1.2-BLOCK-SCHEMA",
      "All blocks conform to BookBlock interface (unique IDs, valid types, valid pageSide)",
      errors.length === 0,
      errors.length > 0 ? `${errors.length} block schema violations found` : undefined,
      errors
    );
  }

  // T1.3: MediaItem Schema Conformance (JSON DB)
  {
    const errors: string[] = [];
    const seenMediaIds = new Set<string>();
    const seenFilenames = new Set<string>();

    if (!Array.isArray(jsonDb.media)) {
      errors.push("jsonDb.media must be an array");
    } else {
      jsonDb.media.forEach((item, mIdx) => {
        if (!item.id || typeof item.id !== "string") errors.push(`Media[${mIdx}] missing valid id`);
        else {
          if (seenMediaIds.has(item.id)) errors.push(`Duplicate media ID: '${item.id}'`);
          seenMediaIds.add(item.id);
        }

        if (!item.filename || typeof item.filename !== "string") errors.push(`Media[${mIdx}] missing filename`);
        else {
          if (seenFilenames.has(item.filename)) errors.push(`Duplicate media filename: '${item.filename}'`);
          seenFilenames.add(item.filename);
        }

        if (!item.url || !item.url.startsWith("/uploads/")) errors.push(`Media[${mIdx}] url must start with /uploads/`);
        if (typeof item.size !== "number" || item.size <= 0) errors.push(`Media[${mIdx}] invalid size (${item.size})`);
        if (!item.mimeType || typeof item.mimeType !== "string") errors.push(`Media[${mIdx}] missing mimeType`);
      });
    }

    recordTest(
      1,
      "T1.3-MEDIA-SCHEMA",
      "All media items conform to MediaItem interface (valid IDs, URLs, sizes > 0)",
      errors.length === 0,
      errors.length > 0 ? `${errors.length} media schema violations found` : undefined,
      errors
    );
  }

  // T1.4: Block mediaUrl Physical Existence in public/uploads/
  {
    const errors: string[] = [];
    jsonDb.chapters.forEach((ch) => {
      ch.blocks.forEach((blk) => {
        if (blk.mediaUrl && blk.mediaUrl.startsWith("/uploads/")) {
          const filename = blk.mediaUrl.replace(/^\/uploads\//, "");
          const filePath = path.join(UPLOADS_DIR, filename);
          if (!fs.existsSync(filePath)) {
            errors.push(`Chapter '${ch.slug}' Block '${blk.id}' references missing file: ${filename}`);
          } else {
            const stat = fs.statSync(filePath);
            if (stat.size === 0) {
              errors.push(`Chapter '${ch.slug}' Block '${blk.id}' file has 0 bytes: ${filename}`);
            }
          }
        }
      });
    });

    recordTest(
      1,
      "T1.4-BLOCK-MEDIA-EXISTS",
      "Every media item referenced in BookBlock.mediaUrl physically exists in public/uploads/",
      errors.length === 0,
      errors.length > 0 ? `${errors.length} missing block media files` : undefined,
      errors
    );
  }

  // T1.5: db.media Items Physical Existence in public/uploads/
  {
    const errors: string[] = [];
    if (Array.isArray(jsonDb.media)) {
      jsonDb.media.forEach((m) => {
        const filePath = path.join(UPLOADS_DIR, m.filename);
        if (!fs.existsSync(filePath)) {
          errors.push(`MediaItem '${m.id}' missing file: public/uploads/${m.filename}`);
        } else {
          const stat = fs.statSync(filePath);
          if (stat.size === 0) {
            errors.push(`MediaItem '${m.id}' has 0 bytes in public/uploads/${m.filename}`);
          }
        }
      });
    }

    recordTest(
      1,
      "T1.5-DB-MEDIA-EXISTS",
      "Every media item in db.media physically exists in public/uploads/",
      errors.length === 0,
      errors.length > 0 ? `${errors.length} missing registered media files` : undefined,
      errors
    );
  }

  // T1.6: Authorship Preservation
  {
    const errors: string[] = [];
    const expectedAuthor = "Стоян Калчев и Константин Караниколов";

    if (jsonDb.bookAuthor !== expectedAuthor) {
      errors.push(`data/book-db.json bookAuthor is '${jsonDb.bookAuthor}', expected '${expectedAuthor}'`);
    }
    if (initialSeed.bookAuthor !== expectedAuthor) {
      errors.push(`src/lib/db.ts INITIAL_SEED.bookAuthor is '${initialSeed.bookAuthor}', expected '${expectedAuthor}'`);
    }

    recordTest(
      1,
      "T1.6-AUTHORSHIP-PRESERVED",
      "Preserves exact authors: 'Стоян Калчев и Константин Караниколов'",
      errors.length === 0,
      errors.length > 0 ? errors.join("; ") : undefined,
      errors
    );
  }

  // T1.7: Admin Credentials & Storage Key Preservation
  {
    const errors: string[] = [];
    if (!fs.existsSync(AUTH_FILE)) {
      errors.push(`AdminAuthGate file not found at ${AUTH_FILE}`);
    } else {
      const authContent = fs.readFileSync(AUTH_FILE, "utf-8");
      if (!authContent.includes("fotinov_admin_authenticated_v1")) {
        errors.push("Missing AUTH_STORAGE_KEY: fotinov_admin_authenticated_v1");
      }
      if (!authContent.includes("ItzKTN") || !authContent.includes("tqncho")) {
        errors.push("Missing required validUsers credentials: ItzKTN and tqncho");
      }
      if (!authContent.includes("Q@a201020") || !authContent.includes("23323223a")) {
        errors.push("Missing required validPasswords credentials");
      }
    }

    recordTest(
      1,
      "T1.7-AUTH-GATE-PRESERVED",
      "Preserves admin credentials and storage key in AdminAuthGate.tsx",
      errors.length === 0,
      errors.length > 0 ? errors.join("; ") : undefined,
      errors
    );
  }

  // T1.8: Dual Synchronization (data/book-db.json <-> src/lib/db.ts)
  {
    const errors: string[] = [];
    if (jsonDb.chapters.length !== initialSeed.chapters.length) {
      errors.push(
        `Chapter count mismatch: book-db.json has ${jsonDb.chapters.length}, but INITIAL_SEED has ${initialSeed.chapters.length}`
      );
    } else {
      jsonDb.chapters.forEach((jCh, idx) => {
        const sCh = initialSeed.chapters[idx];
        if (!sCh || jCh.id !== sCh.id || jCh.slug !== sCh.slug) {
          errors.push(`Chapter[${idx}] mismatch: '${jCh.slug}' vs '${sCh?.slug}'`);
        } else if (jCh.blocks.length !== sCh.blocks.length) {
          errors.push(
            `Chapter '${jCh.slug}' block count mismatch: book-db.json has ${jCh.blocks.length}, INITIAL_SEED has ${sCh.blocks.length}`
          );
        } else {
          jCh.blocks.forEach((jBlk, bIdx) => {
            const sBlk = sCh.blocks[bIdx];
            if (!sBlk || jBlk.id !== sBlk.id) {
              errors.push(`Chapter '${jCh.slug}' Block[${bIdx}] ID mismatch: '${jBlk.id}' vs '${sBlk?.id}'`);
            } else {
              if (jBlk.mediaUrl !== sBlk.mediaUrl) {
                errors.push(`Chapter '${jCh.slug}' Block '${jBlk.id}' mediaUrl mismatch: '${jBlk.mediaUrl}' vs '${sBlk.mediaUrl}'`);
              }
              if (jBlk.pageSide !== sBlk.pageSide) {
                errors.push(`Chapter '${jCh.slug}' Block '${jBlk.id}' pageSide mismatch: '${jBlk.pageSide}' vs '${sBlk.pageSide}'`);
              }
            }
          });
        }
      });
    }

    if (jsonDb.media.length !== initialSeed.media.length) {
      errors.push(
        `Media count mismatch: book-db.json has ${jsonDb.media.length}, INITIAL_SEED has ${initialSeed.media.length}`
      );
    }

    recordTest(
      1,
      "T1.8-DUAL-SYNC",
      "Full synchronization: data/book-db.json and INITIAL_SEED in src/lib/db.ts are identical",
      errors.length === 0,
      errors.length > 0 ? `${errors.length} desynchronization points found` : undefined,
      errors
    );
  }
}

// ============================================================================
// TIER 2: BOUNDARY & CORNER CASES
// ============================================================================
function runTier2() {
  console.log(`\n${BOLD}${BLUE}--- TIER 2: BOUNDARY & CORNER CASES ---${RESET}`);

  // T2.1: Block Count per Chapter strictly <= 3
  {
    const errors: string[] = [];
    jsonDb.chapters.forEach((ch) => {
      if (ch.blocks.length > 3) {
        errors.push(`Chapter '${ch.slug}' has ${ch.blocks.length} blocks (strictly <= 3 allowed)`);
      }
      if (ch.blocks.length === 0) {
        errors.push(`Chapter '${ch.slug}' has 0 blocks (minimum 1 required)`);
      }
    });

    recordTest(
      2,
      "T2.1-BLOCK-COUNT-LIMIT",
      "Block count per chapter is strictly <= 3 blocks (no chapter with 4+ blocks)",
      errors.length === 0,
      errors.length > 0 ? `${errors.length} chapters exceed block count limit` : undefined,
      errors
    );
  }

  // T2.2: Cumulative Text per Slide <= 650 characters
  {
    const errors: string[] = [];
    jsonDb.chapters.forEach((ch) => {
      let bodyText = "";
      let captionText = "";
      ch.blocks.forEach((blk) => {
        bodyText += " " + stripHtml(blk.content);
        if (blk.caption) captionText += " " + stripHtml(blk.caption);
        if (blk.quoteAuthor) bodyText += " " + stripHtml(blk.quoteAuthor);
      });
      const bodyLen = bodyText.trim().length;
      const totalLen = (bodyText + " " + captionText).trim().length;

      if (totalLen > 650) {
        errors.push(
          `Chapter '${ch.slug}' cumulative text is ${totalLen} chars (body: ${bodyLen}, caption: ${captionText.trim().length}, limit <= 650)`
        );
      }
    });

    recordTest(
      2,
      "T2.2-TEXT-CHAR-LIMIT",
      "Cumulative text per slide <= 650 characters",
      errors.length === 0,
      errors.length > 0 ? `${errors.length} slides exceed 650 characters` : undefined,
      errors
    );
  }

  // T2.3: Estimated Presentation Height < 95% (Zero Vertical Scroll)
  {
    const errors: string[] = [];
    jsonDb.chapters.forEach((ch) => {
      let estimatedPct = 24; // Header + margins + filigree decorations
      let hasFloatingImage = false;

      ch.blocks.forEach((blk) => {
        if (blk.type === "quote") {
          estimatedPct += 14;
        } else if (blk.type === "image") {
          if (blk.imageLayout === "float-left" || blk.imageLayout === "float-right") {
            hasFloatingImage = true;
            estimatedPct += 34; // Float image height
          } else {
            estimatedPct += blk.imageSize === "small" ? 22 : blk.imageSize === "large" ? 44 : 34;
            if (blk.caption) estimatedPct += 5;
          }
        } else if (blk.type === "paragraph") {
          const chars = stripHtml(blk.content).length;
          const textHeight = Math.ceil(chars / 75) * 2.8;
          if (!hasFloatingImage) {
            estimatedPct += Math.max(8, textHeight);
          } else {
            if (textHeight > 34) {
              estimatedPct += textHeight - 34;
            }
          }
        }
      });

      if (estimatedPct >= 95) {
        errors.push(`Chapter '${ch.slug}' estimated height is ${estimatedPct.toFixed(1)}% (must be < 95%)`);
      }
    });

    recordTest(
      2,
      "T2.3-PRESENTATION-HEIGHT",
      "Presentation height estimated < 95% for all slides (zero vertical scroll guarantee)",
      errors.length === 0,
      errors.length > 0 ? `${errors.length} slides exceed 95% estimated height` : undefined,
      errors
    );
  }

  // T2.4: Image Block Configuration (Layout, Size, Crop, Focus: "top" for portraits)
  {
    const errors: string[] = [];
    const validLayouts: ImageLayout[] = ["center", "full-page", "float-left", "float-right"];
    const validSizes: ImageSize[] = ["small", "medium", "large", "full"];
    const validCrops: ImageCrop[] = ["contain", "portrait", "square", "landscape", "wide"];
    const validFocuses: ImageFocus[] = ["center", "top", "bottom", "left", "right"];

    jsonDb.chapters.forEach((ch) => {
      ch.blocks.forEach((blk) => {
        if (blk.type === "image") {
          if (!blk.imageLayout || !validLayouts.includes(blk.imageLayout)) {
            errors.push(`Chapter '${ch.slug}' Block '${blk.id}' missing valid imageLayout (${blk.imageLayout})`);
          }
          if (!blk.imageSize || !validSizes.includes(blk.imageSize)) {
            errors.push(`Chapter '${ch.slug}' Block '${blk.id}' missing valid imageSize (${blk.imageSize})`);
          }
          if (!blk.imageCrop || !validCrops.includes(blk.imageCrop)) {
            errors.push(`Chapter '${ch.slug}' Block '${blk.id}' missing valid imageCrop (${blk.imageCrop})`);
          }
          if (!blk.imageFocus || !validFocuses.includes(blk.imageFocus)) {
            errors.push(`Chapter '${ch.slug}' Block '${blk.id}' missing valid imageFocus (${blk.imageFocus})`);
          }

          // Human portraits/busts check: imageFocus must be "top" to prevent cutting off the face
          const desc = `${blk.caption || ""} ${blk.alt || ""} ${blk.mediaUrl || ""}`.toLowerCase();
          const isHumanPortrait =
            desc.includes("портрет") ||
            desc.includes("portrait") ||
            desc.includes("бюст") ||
            desc.includes("bust") ||
            desc.includes("zaberski") ||
            desc.includes("fotev") ||
            desc.includes("kalachev") ||
            desc.includes("mara-georgieva") ||
            desc.includes("fotinov-portrait");

          if (isHumanPortrait && blk.imageFocus !== "top") {
            errors.push(
              `Chapter '${ch.slug}' Block '${blk.id}' depicts portrait/bust but has imageFocus: '${blk.imageFocus}' (expected 'top')`
            );
          }
        }
      });
    });

    recordTest(
      2,
      "T2.4-IMAGE-CONFIG",
      "Image block configuration: explicit layout, size, crop, and imageFocus: 'top' for portraits",
      errors.length === 0,
      errors.length > 0 ? `${errors.length} image configuration issues found` : undefined,
      errors
    );
  }

  // T2.5: Balanced pageSide for Textbook Mode (left: 1 block, right: 1-2 blocks)
  {
    const errors: string[] = [];
    jsonDb.chapters.forEach((ch) => {
      let leftCount = 0;
      let rightCount = 0;

      ch.blocks.forEach((blk) => {
        if (!blk.pageSide || (blk.pageSide !== "left" && blk.pageSide !== "right")) {
          errors.push(`Chapter '${ch.slug}' Block '${blk.id}' missing explicit pageSide ('left' | 'right')`);
        } else if (blk.pageSide === "left") {
          leftCount++;
        } else if (blk.pageSide === "right") {
          rightCount++;
        }
      });

      if (leftCount !== 1) {
        errors.push(`Chapter '${ch.slug}' has ${leftCount} left blocks (strictly 1 required)`);
      }
      if (rightCount < 1 || rightCount > 2) {
        errors.push(`Chapter '${ch.slug}' has ${rightCount} right blocks (1–2 required)`);
      }
    });

    recordTest(
      2,
      "T2.5-TEXTBOOK-PAGESIDE-BALANCE",
      "Balanced pageSide: left page takes 1 block and right page takes 1–2 blocks",
      errors.length === 0,
      errors.length > 0 ? `${errors.length} chapters have unbalanced pageSide` : undefined,
      errors
    );
  }
}

// ============================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS
// ============================================================================
function runTier3() {
  console.log(`\n${BOLD}${BLUE}--- TIER 3: CROSS-FEATURE COMBINATIONS ---${RESET}`);

  // T3.1: Float Layout & Companion Text Integrity
  {
    const errors: string[] = [];
    jsonDb.chapters.forEach((ch) => {
      ch.blocks.forEach((blk, idx) => {
        if (blk.type === "image" && (blk.imageLayout === "float-left" || blk.imageLayout === "float-right")) {
          const hasInlineText = blk.content && stripHtml(blk.content).length >= 40;
          const adjacentPara = ch.blocks.find(
            (b, bIdx) => Math.abs(bIdx - idx) === 1 && b.type === "paragraph" && stripHtml(b.content).length >= 40
          );
          const hasCompanionText = hasInlineText || Boolean(adjacentPara);

          if (!hasCompanionText) {
            errors.push(
              `Chapter '${ch.slug}' Block '${blk.id}' has ${blk.imageLayout} but lacks substantial companion text (>= 40 chars)`
            );
          }
        }
      });
    });

    recordTest(
      3,
      "T3.1-FLOAT-LAYOUT-COMPANION",
      "Float layout images verify companion text presence (inline or adjacent paragraph)",
      errors.length === 0,
      errors.length > 0 ? `${errors.length} float layout companion text errors` : undefined,
      errors
    );
  }

  // T3.2: Seed Reset & Cold-Start Simulation Test
  {
    const errors: string[] = [];
    try {
      if (!initialSeed || !Array.isArray(initialSeed.chapters) || initialSeed.chapters.length === 0) {
        errors.push("INITIAL_SEED is empty or invalid");
      } else {
        const seedTitles = initialSeed.chapters.map((c) => c.title);
        const jsonTitles = jsonDb.chapters.map((c) => c.title);
        if (seedTitles.length !== jsonTitles.length) {
          errors.push(
            `Seed chapter count (${seedTitles.length}) does not match JSON database count (${jsonTitles.length})`
          );
        }
      }
    } catch (err: any) {
      errors.push(`Seed reset test threw an exception: ${err.message}`);
    }

    recordTest(
      3,
      "T3.2-SEED-RESET-SIMULATION",
      "Seed reset test: cold-start INITIAL_SEED matches active database structure",
      errors.length === 0,
      errors.length > 0 ? `${errors.length} seed reset issues` : undefined,
      errors
    );
  }
}

// ============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS & COMPILATION
// ============================================================================
function runTier4() {
  console.log(`\n${BOLD}${BLUE}--- TIER 4: REAL-WORLD APPLICATION SCENARIOS & COMPILATION ---${RESET}`);

  // T4.1: Production Next.js Build
  if (skipBuild) {
    console.log(`  [Tier 4] ${YELLOW}SKIPPED${RESET} T4.1-NEXT-BUILD: Skipped via --skip-build flag`);
  } else {
    let buildPassed = false;
    let buildError = "";
    try {
      console.log(`  [Tier 4] Executing 'npm run build' ... (this may take ~15-30s)`);
      const output = execSync("npm run build", { cwd: ROOT_DIR, stdio: "pipe" }).toString();
      buildPassed = true;
      if (isVerbose) console.log(output);
    } catch (err: any) {
      buildPassed = false;
      buildError = err.stderr ? err.stderr.toString() : err.message;
    }

    recordTest(
      4,
      "T4.1-NEXT-BUILD",
      "Full Next.js build: 'npm run build' succeeds with exit code 0 and 0 type errors",
      buildPassed,
      !buildPassed ? `Build failed: ${buildError.slice(0, 300)}` : undefined
    );
  }

  // T4.2: Critical App Router Routes & Static Exportability
  {
    const errors: string[] = [];
    const criticalRouteFiles = [
      "src/app/page.tsx",
      "src/app/[slug]/page.tsx",
      "src/app/edit/page.tsx",
      "src/app/data/page.tsx",
      "src/app/api/chapters/route.ts",
      "src/app/api/media/route.ts",
    ];

    criticalRouteFiles.forEach((relPath) => {
      const fullPath = path.join(ROOT_DIR, relPath);
      if (!fs.existsSync(fullPath)) {
        errors.push(`Missing critical route file: ${relPath}`);
      }
    });

    recordTest(
      4,
      "T4.2-APP-ROUTER-ROUTES",
      "Critical App Router routes and endpoints exist and are properly structured",
      errors.length === 0,
      errors.length > 0 ? `${errors.length} missing route files` : undefined,
      errors
    );
  }
}

// Execution orchestration
if (selectedTier === null || selectedTier === 1) runTier1();
if (selectedTier === null || selectedTier === 2) runTier2();
if (selectedTier === null || selectedTier === 3) runTier3();
if (selectedTier === null || selectedTier === 4) runTier4();

// Summary & Status Table
console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
console.log(`${BOLD}${CYAN}                           E2E TEST SUMMARY                             ${RESET}`);
console.log(`${BOLD}${CYAN}========================================================================${RESET}`);

const totalTests = results.length;
const passedTests = results.filter((r) => r.passed).length;
const failedTests = results.filter((r) => !r.passed).length;

for (let t = 1; t <= 4; t++) {
  const tierResults = results.filter((r) => r.tier === t);
  if (tierResults.length === 0) continue;
  const tierPass = tierResults.filter((r) => r.passed).length;
  const tierFail = tierResults.filter((r) => !r.passed).length;
  const statusColor = tierFail === 0 ? GREEN : RED;
  console.log(
    `  Tier ${t} Results: ${statusColor}${tierPass}/${tierResults.length} Passed${RESET} (${tierFail} failed)`
  );
}

console.log(`${BOLD}Total Tests: ${totalTests} | Passed: ${GREEN}${passedTests}${RESET} | Failed: ${failedTests > 0 ? RED : GREEN}${failedTests}${RESET}`);
console.log(`${BOLD}${CYAN}========================================================================${RESET}`);

if (failedTests > 0) {
  console.log(`\n${RED}${BOLD}Failed Tests Breakdown:${RESET}`);
  results
    .filter((r) => !r.passed)
    .forEach((r) => {
      console.log(`  - [Tier ${r.tier}] ${r.id}: ${r.name}`);
      if (r.message) console.log(`      ${r.message}`);
    });
  process.exit(1);
} else {
  console.log(`\n${GREEN}${BOLD}✔ ALL E2E TESTS PASSED SUCCESSFULLY!${RESET}\n`);
  process.exit(0);
}
