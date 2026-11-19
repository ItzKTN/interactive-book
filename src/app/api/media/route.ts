import { NextRequest, NextResponse } from "next/server";
import { deleteMediaItem, getMediaItems, updateMediaItem } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");
    const categoryFilter = searchParams.get("category");
    const tagFilter = searchParams.get("tag");
    const query = searchParams.get("q")?.toLowerCase().trim();

    let items = getMediaItems();

    if (typeFilter && typeFilter !== "all") {
      items = items.filter((item) => item.type === typeFilter);
    }
    if (categoryFilter && categoryFilter !== "all") {
      items = items.filter((item) => item.category === categoryFilter);
    }
    if (tagFilter && tagFilter !== "all") {
      items = items.filter((item) => item.tags.includes(tagFilter));
    }
    if (query) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.filename.toLowerCase().includes(query) ||
          item.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({ media: items });
  } catch (error) {
    console.error("GET /api/media error:", error);
    return NextResponse.json(
      { error: "Failed to fetch media items" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json(
        { error: "Missing media item 'id'" },
        { status: 400 }
      );
    }
    const updated = updateMediaItem(body.id, {
      name: body.name,
      category: body.category,
      tags: body.tags,
    });
    if (!updated) {
      return NextResponse.json(
        { error: "Media item not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ item: updated, media: getMediaItems() });
  } catch (error) {
    console.error("PATCH /api/media error:", error);
    return NextResponse.json(
      { error: "Failed to update media item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing media 'id' parameter" },
        { status: 400 }
      );
    }

    const removed = deleteMediaItem(id);
    if (!removed) {
      return NextResponse.json(
        { error: "Media item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      media: getMediaItems(),
    });
  } catch (error) {
    console.error("DELETE /api/media error:", error);
    return NextResponse.json(
      { error: "Failed to delete media item" },
      { status: 500 }
    );
  }
}

