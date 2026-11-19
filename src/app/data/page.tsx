import React from "react";
import { getMediaItems, readDb } from "@/lib/db";
import MediaDashboard from "@/components/MediaDashboard";
import AdminAuthGate from "@/components/AdminAuthGate";

export const dynamic = "force-dynamic";

export default function DataMediaPage() {
  const db = readDb();
  const media = getMediaItems();

  return (
    <AdminAuthGate pageTitle="Вход в Архива със Снимки и Файлове (/data)">
      <MediaDashboard initialMedia={media} bookTitle={db.bookTitle} />
    </AdminAuthGate>
  );
}
