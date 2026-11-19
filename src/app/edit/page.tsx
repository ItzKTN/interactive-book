import React from "react";
import { getChapters, readDb } from "@/lib/db";
import BlockEditor from "@/components/BlockEditor";
import AdminAuthGate from "@/components/AdminAuthGate";

export const dynamic = "force-dynamic";

export default function DefaultEditPage() {
  const db = readDb();
  const chapters = getChapters(true);
  const firstChapter = chapters[0];

  return (
    <AdminAuthGate pageTitle="Вход в Редактора на Слайдове (/edit)">
      <BlockEditor
        key={firstChapter?.id || "default"}
        initialChapter={firstChapter}
        allChapters={chapters}
        bookTitle={db.bookTitle}
      />
    </AdminAuthGate>
  );
}
