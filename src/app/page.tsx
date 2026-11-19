import React from "react";
import { getChapters, readDb } from "@/lib/db";
import InteractiveReader from "@/components/InteractiveReader";

export const dynamic = "force-dynamic";

export default function HomeReaderPage() {
  const db = readDb();
  const chapters = getChapters(true);
  const firstChapter =
    chapters.find((c) => c.status === "published") || chapters[0];

  return (
    <InteractiveReader
      initialChapter={firstChapter}
      allChapters={chapters}
      bookTitle={db.bookTitle}
      bookAuthor={db.bookAuthor}
    />
  );
}

