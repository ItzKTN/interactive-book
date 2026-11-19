"use client";

import React, { useEffect, useState } from "react";
import {
  Check,
  FileAudio,
  FileCode,
  FileText,
  Film,
  Image as ImageIcon,
  Loader2,
  Search,
  Upload,
  X,
} from "lucide-react";
import { MediaCategory, MediaItem } from "@/types/book";

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  allowedTypes?: MediaCategory[];
  title?: string;
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  allowedTypes,
  title = "Select Asset from /data Library",
}: MediaPickerModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string>("all");

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      setMedia(data.media || []);
    } catch (err) {
      console.error("Failed to load media:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("file", f));
      formData.append("category", "editor-upload");
      formData.append("tags", "editor,quick-upload");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.item) {
        await fetchMedia();
        onSelect(data.item);
        onClose();
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const filtered = media.filter((item) => {
    if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(item.type)) {
      return false;
    }
    if (activeType !== "all" && item.type !== activeType) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.filename.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const renderIcon = (type: MediaCategory) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-6 w-6 text-amber-500" />;
      case "audio":
        return <FileAudio className="h-6 w-6 text-emerald-500" />;
      case "video":
        return <Film className="h-6 w-6 text-purple-500" />;
      case "json":
        return <FileCode className="h-6 w-6 text-sky-500" />;
      default:
        return <FileText className="h-6 w-6 text-stone-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-semibold text-stone-900 dark:text-zinc-100">
              {title}
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Choose an existing asset from <code>/data</code> or upload a new file directly.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter & Upload Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-stone-50/70 px-6 py-3 dark:border-zinc-800/70 dark:bg-zinc-950/50">
          <div className="relative flex-1 min-w-[200px]">
            <Search className=" absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by filename or tag..."
              className="w-full rounded-lg border border-stone-200 bg-white py-1.5 pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {["all", "image", "audio", "video", "json", "pdf"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${
                  activeType === t
                    ? "bg-amber-600 text-white"
                    : "bg-white text-stone-600 hover:bg-stone-100 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800 dark:bg-zinc-100 dark:text-zinc-900">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>{uploading ? "Uploading..." : "Upload New"}</span>
            <input
              type="file"
              multiple
              onChange={handleQuickUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-stone-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading /data assets...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-stone-400">
              <p className="text-sm font-medium">No matching assets found</p>
              <p className="mt-1 text-xs">
                Upload a file above or visit the /data dashboard.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white text-left transition hover:border-amber-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="relative flex h-32 w-full items-center justify-center overflow-hidden bg-stone-100 dark:bg-zinc-900">
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      renderIcon(item.type)
                    )}
                    <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white">
                      {item.type}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-3">
                    <div>
                      <p className="truncate text-xs font-semibold text-stone-800 dark:text-zinc-200">
                        {item.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-stone-400">
                        {item.url}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-stone-400">
                        {(item.size / 1024).toFixed(1)} KB
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 opacity-0 transition group-hover:opacity-100">
                        <Check className="h-3 w-3" /> Insert
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

