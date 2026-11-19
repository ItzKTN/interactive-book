"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  Eye,
  FileAudio,
  FileCode,
  FileText,
  Film,
  Filter,
  FolderKanban,
  Image as ImageIcon,
  Loader2,
  Search,
  Tag,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { MediaCategory, MediaItem } from "@/types/book";
import Navbar from "./Navbar";

interface MediaDashboardProps {
  initialMedia: MediaItem[];
  bookTitle: string;
}

export default function MediaDashboard({
  initialMedia,
  bookTitle,
}: MediaDashboardProps) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload metadata inputs
  const [uploadCategory, setUploadCategory] = useState("illustrations");
  const [uploadTags, setUploadTags] = useState("book, interactive");

  // Filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // UI interactions
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [jsonPreviewContent, setJsonPreviewContent] = useState<string | null>(
    null
  );

  const handleFilesUpload = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("file", f));
      formData.append("category", uploadCategory || "general");
      formData.append("tags", uploadTags);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.uploaded) {
        const listRes = await fetch("/api/media");
        const listData = await listRes.json();
        if (listData.media) setMedia(listData.media);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/media?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.media) {
        setMedia(data.media);
        if (previewItem?.id === id) setPreviewItem(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleCopyUrl = async (item: MediaItem) => {
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${item.url}`
        : item.url;
    try {
      await navigator.clipboard.writeText(item.url);
    } catch {
      // fallback
    }
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
    return fullUrl;
  };

  const openPreviewModal = async (item: MediaItem) => {
    setPreviewItem(item);
    setJsonPreviewContent(null);
    if (item.type === "json") {
      try {
        const res = await fetch(item.url);
        const text = await res.text();
        setJsonPreviewContent(text);
      } catch {
        setJsonPreviewContent("// Unable to load JSON preview");
      }
    }
  };

  const allTags = Array.from(
    new Set(media.flatMap((m) => m.tags || []))
  ).sort();

  const filteredMedia = media.filter((item) => {
    if (selectedType !== "all" && item.type !== selectedType) return false;
    if (selectedTag !== "all" && !item.tags.includes(selectedTag)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.filename.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const renderMediaBadgeIcon = (type: MediaCategory) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-5 w-5 text-amber-500" />;
      case "audio":
        return <FileAudio className="h-5 w-5 text-emerald-500" />;
      case "video":
        return <Film className="h-5 w-5 text-purple-500" />;
      case "json":
        return <FileCode className="h-5 w-5 text-sky-500" />;
      default:
        return <FileText className="h-5 w-5 text-rose-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-20 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar bookTitle={bookTitle} />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <FolderKanban className="h-3.5 w-3.5" />
              <span>/data Asset & Media Library</span>
            </div>
            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight">
              Media & Interactive Asset Manager
            </h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
              Upload images, audio narrations, videos, JSON telemetry, and PDFs. All files are served statically from <code>/uploads/*</code> for instant embedding in the Visual Editor.
            </p>
          </div>
        </div>

        {/* Drag-and-Drop Uploader Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) {
              handleFilesUpload(e.dataTransfer.files);
            }
          }}
          className={`mt-6 rounded-2xl border-2 border-dashed p-6 transition ${
            isDragging
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-stone-300 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          }`}
        >
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            <div className="flex flex-col items-center justify-center text-center lg:col-span-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600">
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <UploadCloud className="h-6 w-6" />
                )}
              </div>
              <p className="mt-3 text-sm font-semibold">
                Drag & drop files here, or click to browse
              </p>
              <p className="mt-1 text-xs text-stone-400">
                Supports PNG, JPG, SVG, WebP, MP3, WAV, MP4, WebM, JSON, and PDF
              </p>

              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500">
                <UploadCloud className="h-4 w-4" />
                <span>{uploading ? "Uploading to /public/uploads..." : "Select Files to Upload"}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,audio/*,video/*,application/pdf,application/json,.svg,.json,.pdf"
                  onChange={(e) =>
                    e.target.files && handleFilesUpload(e.target.files)
                  }
                  className="hidden"
                />
              </label>
            </div>

            {/* Category & Tag Metadata Inputs before upload */}
            <div className="space-y-3 border-t border-stone-200 pt-4 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 dark:border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Upload Metadata Defaults
              </h3>
              <div>
                <label className="block text-xs font-semibold">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="illustrations">Illustrations & Art</option>
                  <option value="narration">Audio Narration</option>
                  <option value="maps">Maps & Schematics</option>
                  <option value="data">JSON & Telemetry Data</option>
                  <option value="documents">PDF & Reference Docs</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="chapter-1, blueprint, audio"
                  className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets by name, filename, category, or tag..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-4 text-xs focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>

          {/* Media Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="mr-1 h-3.5 w-3.5 text-stone-400" />
            {(["all", "image", "audio", "video", "json", "pdf"] as const).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition ${
                    selectedType === t
                      ? "bg-indigo-600 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {t}
                </button>
              )
            )}
          </div>

          {/* Tag Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-stone-400" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="all">All Tags ({allTags.length})</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Media Grid */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Thumbnail / Preview Area */}
              <div
                onClick={() => openPreviewModal(item)}
                className="relative flex h-44 cursor-pointer items-center justify-center overflow-hidden bg-stone-100 dark:bg-zinc-950"
              >
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    {renderMediaBadgeIcon(item.type)}
                    <span className="font-mono text-xs text-stone-400">
                      {item.filename}
                    </span>
                  </div>
                )}

                <span className="absolute left-3 top-3 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  {item.type}
                </span>

                <span className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-stone-800 shadow-sm">
                  {formatBytes(item.size)}
                </span>
              </div>

              {/* Details & Actions */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h3 className="truncate font-semibold text-stone-900 dark:text-zinc-100">
                    {item.name}
                  </h3>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-stone-400">
                    {item.url}
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-1">
                    <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {item.category}
                    </span>
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        onClick={() => setSelectedTag(t)}
                        className="cursor-pointer rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600 hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-stone-100 pt-3 dark:border-zinc-800">
                  <div className="mb-2 flex items-center justify-between text-[10px] text-stone-400">
                    <span>Uploaded</span>
                    <span>
                      {new Date(item.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-stone-200 py-1.5 text-xs font-semibold transition hover:bg-stone-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openPreviewModal(item)}
                      className="rounded-lg border border-stone-200 p-1.5 text-stone-600 hover:bg-stone-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      title="Preview File"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/40"
                      title="Delete Asset"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 dark:border-zinc-800">
              <div>
                <h3 className="font-semibold">{previewItem.name}</h3>
                <p className="font-mono text-xs text-stone-400">
                  {previewItem.url} • {formatBytes(previewItem.size)} •{" "}
                  {previewItem.mimeType}
                </p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-stone-950 p-6 text-center">
              {previewItem.type === "image" && (
                <img
                  src={previewItem.url}
                  alt={previewItem.name}
                  className="mx-auto max-h-[55vh] rounded-lg object-contain"
                />
              )}
              {previewItem.type === "audio" && (
                <div className="py-12">
                  <audio
                    src={previewItem.url}
                    controls
                    autoPlay
                    className="mx-auto w-full max-w-md"
                  />
                </div>
              )}
              {previewItem.type === "video" && (
                <video
                  src={previewItem.url}
                  controls
                  autoPlay
                  className="mx-auto max-h-[55vh] w-full rounded-lg"
                />
              )}
              {previewItem.type === "json" && (
                <pre className="max-h-[55vh] overflow-auto rounded-xl bg-zinc-900 p-4 text-left font-mono text-xs text-emerald-300">
                  {jsonPreviewContent || "Loading JSON..."}
                </pre>
              )}
              {previewItem.type === "pdf" && (
                <iframe
                  src={previewItem.url}
                  title={previewItem.name}
                  className="h-[55vh] w-full rounded-lg bg-white"
                />
              )}
            </div>

            <div className="flex items-center justify-between border-t border-stone-200 px-6 py-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                {previewItem.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-stone-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyUrl(previewItem)}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  {copiedId === previewItem.id
                    ? "Copied Public URL!"
                    : "Copy Public URL"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

