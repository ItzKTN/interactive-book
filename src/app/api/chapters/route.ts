import { NextRequest, NextResponse } from "next/server";
import {
  clearAllChaptersToBlank,
  deleteChapterBySlug,
  getChapterBySlug,
  getChapters,
  readDb,
  resetChaptersToDefaultSeed,
  saveChapter,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const publishedOnly = searchParams.get("publishedOnly") === "true";

    const db = readDb();

    if (slug) {
      const chapter = getChapterBySlug(slug);
      if (!chapter) {
        return NextResponse.json(
          { error: `Chapter '${slug}' not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        bookTitle: db.bookTitle,
        bookAuthor: db.bookAuthor,
        chapter,
        chapters: getChapters(!publishedOnly),
      });
    }

    return NextResponse.json({
      bookTitle: db.bookTitle,
      bookAuthor: db.bookAuthor,
      bookDescription: db.bookDescription,
      chapters: getChapters(!publishedOnly),
    });
  } catch (error) {
    console.error("GET /api/chapters error:", error);
    return NextResponse.json(
      { error: "Failed to load chapters" },
      { status: 500 }
    );
  }
}

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch",
  ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

function sanitizeSlug(raw: string): string {
  const transliterated = raw
    .toLowerCase()
    .trim()
    .split("")
    .map((ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
    .join("");

  const cleaned = transliterated
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || `slide-${Date.now()}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === "reset_seed") {
      const chapters = resetChaptersToDefaultSeed();
      return NextResponse.json({
        chapter: chapters[0],
        chapters,
        message: "Default chapters restored",
      });
    }

    if (body.action === "clear_all") {
      const chapters = clearAllChaptersToBlank();
      return NextResponse.json({
        chapter: chapters[0],
        chapters,
        message: "All chapters cleared to a single blank page",
      });
    }

    const sanitizedSlug = sanitizeSlug(
      String(body.slug || body.title || `slide-${Date.now()}`)
    );

    const saved = saveChapter({
      ...body,
      title: body.title ?? "",
      slug: sanitizedSlug,
    });

    return NextResponse.json({
      chapter: saved,
      chapters: getChapters(true),
      message:
        saved.status === "published"
          ? "Chapter published successfully"
          : "Draft saved successfully",
    });
  } catch (error) {
    console.error("POST /api/chapters error:", error);
    return NextResponse.json(
      { error: "Failed to save chapter" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (!slug) {
      return NextResponse.json(
        { error: "Missing 'slug' query parameter" },
        { status: 400 }
      );
    }

    deleteChapterBySlug(slug);

    return NextResponse.json({
      success: true,
      chapters: getChapters(true),
    });
  } catch (error) {
    console.error("DELETE /api/chapters error:", error);
    return NextResponse.json(
      { error: "Failed to delete chapter" },
      { status: 500 }
    );
  }
}

