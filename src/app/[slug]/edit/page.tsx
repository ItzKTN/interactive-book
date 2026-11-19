import React from "react";
import { redirect } from "next/navigation";
import { getChapterBySlug, getChapters, readDb } from "@/lib/db";
import BlockEditor from "@/components/BlockEditor";
import AdminAuthGate from "@/components/AdminAuthGate";

export const dynamic = "force-dynamic";

interface ChapterEditPageProps {
  params: {
    slug: string;
  };
}

export default function ChapterEditPage({ params }: ChapterEditPageProps) {
  const db = readDb();
  const chapters = getChapters(true);
  const chapter = getChapterBySlug(params.slug) || chapters[0];

  if (!chapter) {
    redirect("/edit");
  }

  return (
    <AdminAuthGate pageTitle={`Редакция на ${chapter.title || chapter.slug}`}>
      <BlockEditor
        key={chapter.id}
        initialChapter={chapter}
        allChapters={chapters}
        bookTitle={db.bookTitle}
      />
    </AdminAuthGate>
  );
}
