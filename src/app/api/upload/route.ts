import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { addMediaItem } from "@/lib/db";
import { MediaCategory, MediaItem } from "@/types/book";

export const dynamic = "force-dynamic";

function detectMediaCategory(mimeType: string, filename: string): MediaCategory {
  const lower = filename.toLowerCase();
  if (mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|avif)$/.test(lower)) {
    return "image";
  }
  if (mimeType.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|flac)$/.test(lower)) {
    return "audio";
  }
  if (mimeType.startsWith("video/") || /\.(mp4|webm|mov|mkv)$/.test(lower)) {
    return "video";
  }
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    return "pdf";
  }
  if (
    mimeType === "application/json" ||
    lower.endsWith(".json")
  ) {
    return "json";
  }
  return "other";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];
    const category = (formData.get("category") as string) || "general";
    const tagsRaw = (formData.get("tags") as string) || "";

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No file provided in multipart/form-data" },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const uploadedItems: MediaItem[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const safeBaseName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .replace(/-+/g, "-");
      const uniqueFilename = `${Date.now()}-${safeBaseName}`;
      const filePath = path.join(uploadsDir, uniqueFilename);

      fs.writeFileSync(filePath, buffer);

      const mediaType = detectMediaCategory(file.type || "", file.name);
      const item: MediaItem = {
        id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        filename: uniqueFilename,
        url: `/uploads/${uniqueFilename}`,
        type: mediaType,
        mimeType: file.type || "application/octet-stream",
        size: buffer.byteLength,
        category,
        tags: tags.length > 0 ? tags : [mediaType],
        uploadedAt: new Date().toISOString(),
      };

      addMediaItem(item);
      uploadedItems.push(item);
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedItems,
      item: uploadedItems[0],
    });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json(
      { error: "File upload failed" },
      { status: 500 }
    );
  }
}

