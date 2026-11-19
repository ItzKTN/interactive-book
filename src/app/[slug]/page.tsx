import React from "react";
import { notFound } from "next/navigation";
import { getChapterBySlug, getChapters, readDb } from "@/lib/db";
import InteractiveReader from "@/components/InteractiveReader";

export const dynamic = "force-dynamic";

interface ChapterReaderPageProps {
  params: {
    slug: string;
  };
}

export default function ChapterReaderPage({ params }: ChapterReaderPageProps) {
  const db = readDb();
  const chapters = getChapters(true);
  const chapter = getChapterBySlug(params.slug) || chapters[0];

  if (!chapter) {
    notFound();
  }

  return (
    <InteractiveReader
      initialChapter={chapter}
      allChapters={chapters}
      bookTitle={db.bookTitle}
      bookAuthor={db.bookAuthor}
    />
  );
}

